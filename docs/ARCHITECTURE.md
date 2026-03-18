# EzyForge — Architecture

## System Overview

```
                         ┌─────────────────────┐
                         │   YAML Schema File   │
                         │ (ezybusiness.schema  │
                         │       .yaml)         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Schema Registry    │
                         │  (parse + validate)  │
                         └──────────┬───────────┘
                                    │
                      ┌─────────────┼─────────────┐
                      │             │             │
                      ▼             ▼             ▼
              ┌──────────┐  ┌────────────┐  ┌───────────┐
              │  Schema   │  │   Tool     │  │   Type    │
              │ Compiler  │  │ Generator  │  │ Generator │
              │(→ JSON    │  │(→ MCP /    │  │(→ .d.ts)  │
              │  Schema)  │  │  OpenAI)   │  │           │
              └──────────┘  └─────┬──────┘  └───────────┘
                                  │
                                  ▼
         ┌────────────────────────────────────────────┐
         │            Tool Execution Runtime           │
         │                                             │
         │  ┌────────────┐  ┌──────────┐  ┌────────┐  │
         │  │ Permission  │→│   Rule   │→│  Data  │  │
         │  │   Layer     │  │  Engine  │  │ Layer  │  │
         │  └────────────┘  └──────────┘  └────────┘  │
         └────────────────────┬───────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ MCP      │   │ REST     │   │ CLI      │
        │ Server   │   │ API      │   │          │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │
             ▼              ▼              ▼
        AI Agents      Human Apps      Developer
        (Claude,       (web, mobile)
        OpenClaw)
```

---

## Core Components

### 1. Schema Registry

**Responsibility:** Parses the YAML schema file into a validated internal representation. The single source of truth for all entity definitions, rules, and permissions.

**Inputs:** `ezybusiness.schema.yaml` file on disk.

**Outputs:** Validated schema object in memory — entities, fields, rules, AI permissions, metadata. Or a list of validation errors with line numbers.

**Key design decisions:**
- YAML is the authoring format (human-readable, LLM-readable, git-diffable). The runtime never works with raw YAML — it's always parsed and validated first.
- Validation is strict and exhaustive. Unknown field types, conflicting constraints (`min: 10, max: 5`), references to nonexistent fields — all caught at parse time, not runtime.
- The registry is a pure function: no side effects, no database access. Parse in, schema object out.

---

### 2. Schema Compiler

**Responsibility:** Transforms the internal schema representation into standard JSON Schema (draft 2020-12) with custom vocabularies for EzyForge-specific features.

**Inputs:** Validated schema object from the registry.

**Outputs:** JSON Schema document with `$vocabulary` entries for `x-ai-permissions`, `x-business-rules`, `x-schema-governance`.

**Key design decisions:**
- Built on JSON Schema because it's the universal schema language — MCP, OpenAI, LangChain all consume it natively.
- Custom vocabularies are a *blessed* JSON Schema extension mechanism, not a hack. Standard validators ignore them gracefully; EzyForge-aware tools consume them.
- Compilation is one-way: YAML → JSON Schema. No round-tripping. The YAML file is always the source of truth.

---

### 3. Rule Engine

**Responsibility:** Evaluates business rules deterministically on every CRUD operation. Runs conditions, triggers actions (reject, warn, require_approval, tag, set_field).

**Inputs:** A rule definition (condition + action + lifecycle hook) and the record being operated on (new values, old values for updates).

**Outputs:** Pass (operation proceeds), reject (operation blocked with error), warn (operation proceeds with warning), require_approval (operation queued).

**Key design decisions:**
- FEEL-inspired expression language — safe, sandboxed, no arbitrary code execution. Supports comparisons, boolean logic, date functions, string functions, and `IN` operator.
- Rules are ordered and execute synchronously. Same input always produces the same result. No async, no network calls, no randomness.
- Before-hooks can block writes. After-hooks run side effects (tagging, notifications) but cannot roll back the write.
- Separate from field validation — validation checks types and ranges, rules check business semantics.

---

### 4. Permission Layer

**Responsibility:** Enforces AI field-level access control on every operation. The first checkpoint in the execution pipeline — runs before validation and rules.

**Inputs:** Operation request (entity, action, fields, caller role).

**Outputs:** Allow or deny with structured reason.

**Key design decisions:**
- Defense in depth: even if a tool definition accidentally exposes a restricted field, the permission layer blocks it at execution time.
- Two built-in roles in MVP: `owner` (unrestricted) and `ai` (restricted per `ai_permissions`). Role is determined by caller context — MCP/tool calls default to `ai`, CLI defaults to `owner`.
- Cannot be bypassed. No admin override for AI callers. This is the core security guarantee.
- Permissions shape tool generation: if AI can't delete, no delete tool is generated. Belt and suspenders.

---

### 5. Tool Generator

**Responsibility:** Auto-generates AI-compatible tool definitions from the schema, respecting AI permissions.

**Inputs:** Compiled schema with entities and AI permissions.

**Outputs:** MCP tool definitions (JSON), OpenAI function definitions (JSON), TypeScript type definitions (`.d.ts`).

**Key design decisions:**
- Tool definitions are *shaped by permissions*. If `delete: false`, no delete tool exists — the AI doesn't even know deletion is possible.
- `update: { allowed_fields: [notes, category] }` generates an update tool whose input schema *only includes* notes and category. The AI literally cannot submit a field it's not allowed to touch.
- Tool descriptions pull from field `description` values in the schema, giving the AI context about what each field means.
- MCP is the primary output format. OpenAI function format is nearly identical (both use JSON Schema for parameters).

---

### 6. Tool Execution Runtime

**Responsibility:** Executes tool calls against the database through the full enforcement pipeline: permission check → field validation → before-rules → database write → after-rules → response.

**Inputs:** Tool call (operation name + parameters) from any caller (AI agent, REST API, CLI).

**Outputs:** Operation result (created/updated/queried record) or structured error (permission_denied, rule_violation, validation_error).

**Key design decisions:**
- Single execution path for all callers. AI agents, REST API clients, and CLI commands all go through the same pipeline. No shortcuts.
- Each operation is atomic — wrapped in a database transaction.
- Errors are structured and typed: `{ error: "rule_violation", rule: "no_future_dates", message: "Expense date cannot be in the future" }`. AI agents can understand and relay these errors.
- List operations support filtering, sorting, and pagination. Aggregate operations (sum, count, avg) respect permission-defined `group_by` constraints.

---

### 7. Data Layer

**Responsibility:** Adapter between the execution runtime and the database. Handles table creation, queries, and type mapping.

**Inputs:** CRUD operation requests from the execution runtime.

**Outputs:** Database results (records, row counts, aggregates).

**Key design decisions:**
- SQLite for MVP (zero setup, file-based, portable). Postgres in Phase 2 (concurrent connections, production-grade).
- Auto-creates tables from schema on first run. No manual SQL. The developer defines YAML, the database just works.
- Type mapping is explicit: `decimal` → REAL (SQLite) / NUMERIC (Postgres), `enum` → TEXT with CHECK constraint, `date` → TEXT ISO 8601 (SQLite) / DATE (Postgres).
- Database adapter is a clean interface — swapping SQLite for Postgres requires no changes to the rest of the stack.

---

### 8. CLI

**Responsibility:** Developer interface for project management — init, validate, generate, serve, lock/unlock, status.

**Inputs:** Commands and flags.

**Outputs:** Console output, generated files, running server.

**Key commands:**
| Command | What it does |
|---------|-------------|
| `forge init <name>` | Create new project with schema file |
| `forge validate` | Check schema for errors (no side effects) |
| `forge generate` | Output MCP tools, TypeScript types |
| `forge serve` | Start local server (REST + MCP) |
| `forge lock` / `unlock` | Toggle schema governance |
| `forge status` | Show project state |

---

### 9. MCP Server

**Responsibility:** Exposes generated tools to AI agents via the Model Context Protocol. The bridge between EzyForge and the AI ecosystem.

**Inputs:** MCP tool calls from AI agents (JSON-RPC over stdio or HTTP).

**Outputs:** Tool execution results routed through the full pipeline.

**Key design decisions:**
- Part of `forge serve` — not a separate process. One command starts both REST and MCP.
- Tools are discoverable: AI agents can query the tool list and see exactly what operations are available with what parameters.
- Runs locally by default (port 3737). No authentication in MVP — designed for local development. Production auth comes in Phase 2.

---

## Data Flow

**Scenario:** An AI agent (via OpenClaw) wants to create an expense: "Jazz spent RM 45 on lunch at McDonald's today."

```
1. AI Agent → MCP Server
   Tool call: create_expense({
     amount: 45.00, currency: "MYR", category: "food",
     merchant: "McDonald's", date: "2026-03-18"
   })

2. MCP Server → Tool Execution Runtime
   Routes to create handler for "expense" entity.

3. Permission Layer ✓
   Checks: Is AI allowed to create expense? → Yes (create: true).
   Checks: Are all submitted fields writable? → Yes (all are input fields).

4. Field Validation ✓
   amount: 45.00 — decimal, 0.01–999999.99 → pass
   currency: "MYR" — enum [MYR, SGD, USD] → pass
   category: "food" — enum [food, transport, ...] → pass
   merchant: "McDonald's" — string, 1–100 chars → pass
   date: "2026-03-18" — date format → pass

5. Before-Rules ✓
   no_future_dates: "2026-03-18" <= today() → pass
   reasonable_amount: 45.00 <= 50000 → pass
   duplicate_detection: no matching record found → pass

6. Data Layer → SQLite
   INSERT INTO expenses (id, amount, currency, category, merchant,
     date, created_at, updated_at)
   VALUES (uuid(), 45.00, 'MYR', 'food', 'McDonald''s',
     '2026-03-18', now(), now())

7. After-Rules
   weekend_entertainment_flag: category != 'entertainment' → skip

8. Response → AI Agent
   { id: "abc-123", amount: 45.00, currency: "MYR", ... }
```

**What if the AI tries to delete it?**

```
1. AI Agent → MCP Server
   Tool call: delete_expense({ id: "abc-123" })

2. Tool not found — delete_expense was never generated
   because ai_permissions.delete: false.

3. Response → AI Agent
   { error: "unknown_tool", message: "No tool named delete_expense" }
```

---

## Schema Format

The canonical EzyForge schema (annotated):

```yaml
# ─── Metadata ──────────────────────────────────
app: personal-expenses        # machine-readable app name
version: "1.0.0"              # semver — tracked for migrations
locked: true                  # when true, schema cannot be modified

metadata:
  name: "Personal Expenses"
  owner: jazz@example.com

# ─── Storage ───────────────────────────────────
storage:
  engine: sqlite              # sqlite | postgres
  path: ./data/expenses.db    # file path (sqlite) or connection string (postgres)

# ─── Entities ──────────────────────────────────
entities:
  expense:
    table: expenses           # database table name

    # ── Fields ─────────────────────────────────
    fields:
      id:
        type: uuid
        generated: true       # system-managed, not user-supplied
        primary_key: true
      amount:
        type: decimal
        required: true
        min: 0.01
        max: 999999.99
        precision: 2
      currency:
        type: enum
        values: [MYR, SGD, USD]
        default: MYR
      category:
        type: enum
        values: [food, transport, entertainment, utilities, other]
      merchant:
        type: string
        required: true
        max_length: 100
      date:
        type: date
        required: true
      notes:
        type: string
        optional: true
      created_at:
        type: datetime
        generated: true
        auto: now              # set automatically on create

    # ── Business Rules ─────────────────────────
    rules:
      - name: no_future_dates
        when: before_create, before_update
        condition: "date <= today()"
        error: "Expense date cannot be in the future"

      - name: reasonable_amount
        when: before_create
        condition: "amount <= 50000"
        error: "Expense over 50,000 requires manual review"
        action: require_approval

    # ── AI Permissions ─────────────────────────
    ai_permissions:
      create: true             # AI can create expenses
      read: true               # AI can query expenses
      update:
        allowed_fields: [notes, category]  # AI can ONLY update these
      delete: false            # AI cannot delete — ever
      can_change_schema: false # AI cannot modify the schema
```

---

## Extension Points

### Any LLM (Claude, GPT, Gemini)

EzyForge is LLM-agnostic. It generates standard JSON Schema tool definitions that work with:
- **MCP** (Anthropic Claude, OpenClaw, any MCP client)
- **OpenAI Function Calling** (GPT-4, GPT-4o)
- **Google Gemini Function Calling** (same JSON Schema format)
- **Any framework** that accepts JSON Schema tool definitions

The AI never talks to EzyForge directly — it calls tools. EzyForge doesn't care which model generated the call.

### Any AI Agent Framework (OpenClaw, LangChain, CrewAI)

EzyForge exposes tools via:
- **MCP Server** — native integration for MCP-compatible frameworks
- **REST API** — universal HTTP interface for any framework
- **Programmatic SDK** — `import { createRuntime } from 'ezybusiness'` for embedded use

Frameworks route tool calls to EzyForge. EzyForge handles validation, rules, permissions, and storage. The framework handles conversation, reasoning, and tool selection.

### Any Database (SQLite, Postgres)

The data layer is an adapter interface:
- **SQLite** — zero-config, file-based, ideal for personal tools and development
- **PostgreSQL** — production-grade, concurrent connections, native types

The adapter interface is clean enough that community contributors could add MySQL, CockroachDB, or other backends.

---

## What EzyForge Is NOT

- **Not a database.** It sits above your database and enforces rules on the way in.
- **Not an AI model.** It doesn't generate text, reason, or make decisions. It generates and enforces tools.
- **Not an application framework.** It doesn't render UI, handle routing, or manage sessions.
- **Not a prompt engineering tool.** Rules live in the schema, not in prompts.
- **Not a general-purpose rules engine.** It's specifically designed for the AI-to-database path.
- **Not a replacement for Prisma/Supabase.** It complements them — Prisma defines the schema for your app code, EzyForge defines what AI can do with it.
- **Not multi-tenant SaaS (yet).** MVP is single-user, local-first.
