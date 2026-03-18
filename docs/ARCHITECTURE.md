# EzyForge — Architecture

## System Overview

EzyForge is an agentic-first cloud platform. The primary interface is an AI agent (Claude, GPT, OpenClaw, Gemini) connecting via MCP. The agent creates apps, operates data, and proposes schema changes. The web dashboard exists for admin tasks — token management, audit review, billing — not for daily operations.

The core engine (schema → rules → permissions → tools → database) runs server-side. User data is isolated per app, encrypted at rest, and protected by scoped API tokens.

```
                         ┌──────────────────────────────────────────────────────┐
                         │                     ezyforge.io                       │
                         │                                                       │
                         │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐   │
                         │  │  Auth &   │  │  App Manager  │  │  Template    │   │
                         │  │ Identity  │  │  (create,     │  │  Registry    │   │
                         │  │ (Clerk /  │  │   deploy,     │  │              │   │
                         │  │  Auth.js) │  │   propose)    │  │              │   │
                         │  └─────┬────┘  └──────┬───────┘  └──────┬───────┘   │
                         │        │              │                  │            │
                         │        ▼              ▼                  ▼            │
                         │  ┌──────────────────────────────────────────────┐     │
                         │  │          Multi-Tenant App Router              │     │
                         │  │    (isolates apps, routes by app_id)         │     │
                         │  └────────────────────┬─────────────────────────┘     │
                         │                       │                               │
                         │         ┌─────────────┼─────────────┐                │
                         │         │             │             │                 │
                         │         ▼             ▼             ▼                 │
                         │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
                         │  │  MCP     │  │  REST    │  │  Web     │           │
                         │  │ Endpoint │  │  API     │  │ Dashboard│           │
                         │  │ (per app)│  │          │  │          │           │
                         │  │ PRIMARY  │  │ AGENT +  │  │ SECONDARY│           │
                         │  │          │  │ ADMIN    │  │          │           │
                         │  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
                         │       │             │             │                  │
                         │       └─────────────┼─────────────┘                  │
                         │                     ▼                                │
                         │  ┌──────────────────────────────────────────────┐    │
                         │  │          EzyForge Engine Kernel                │    │
                         │  │                                               │    │
                         │  │  Schema    Permission   Rule    Tool          │    │
                         │  │  Registry → Layer    → Engine → Runtime       │    │
                         │  └──────────────────────┬───────────────────────┘    │
                         │                         │                            │
                         │                         ▼                            │
                         │  ┌──────────────────────────────────────────────┐    │
                         │  │           Postgres (Encrypted at Rest)        │    │
                         │  │   (per-app data isolation via app_id,        │    │
                         │  │    provider-managed encryption)              │    │
                         │  └──────────────────────────────────────────────┘    │
                         └──────────────────────────────────────────────────────┘

         External connections (ordered by importance):

         1. AI Agents ────────── MCP Endpoint (PRIMARY — all data operations)
            (Claude, GPT,           ↑
             OpenClaw, Gemini)      │ Agent creates apps, operates data, proposes changes.
                                    │ Token-scoped. Every action logged.
                                    │ This is the MAIN interface to EzyForge.

         2. AI Agents ────────── REST API (app lifecycle + management)
                                    │ POST /api/apps — agent creates app from template
                                    │ POST /api/apps/{id}/proposals — agent proposes schema changes
                                    │ GET /api/apps/{id}/tools — agent discovers available tools
                                    │ Agent-initiated, not human-initiated.

         3. App Owner ────────── Web Dashboard (SECONDARY — admin/config only)
                                    │ Approve/reject schema proposals
                                    │ Manage API tokens
                                    │ Review audit trail
                                    │ Billing and subscription
                                    │ Emergency schema unlock / export data
                                    │ NOT for daily data entry or querying.

         4. forge CLI ────────── REST API (developer helper tool)
                                    │ Login, pull/push schema, validate locally
                                    │ Helper — not the product.
```

---

## The Agentic Interaction Model

EzyForge is designed for a world where AI agents are the primary operators of business software. There are two paths into the platform, and they are not equal.

```
Human ←→ AI Agent ←→ EzyForge Cloud
              ↑
        (primary path — daily operations, app creation, data CRUD)

Human ←→ Web Dashboard ←→ EzyForge Cloud
              ↑
        (secondary path — admin, config, approvals, billing)
```

The primary path handles 95%+ of interactions. The secondary path exists for the things that require human judgment or governance — approving schema changes, managing billing, reviewing audit trails.

### Agentic Flow 1: App Creation (Agent-Initiated)

The agent creates apps on behalf of the human. No web UI needed.

```
1. Human → AI Agent:
   "Set up an expense tracker for me on EzyForge"

2. AI Agent → EzyForge REST API:
   POST /api/apps { template: "expenses", name: "Jazz's Expenses" }

3. EzyForge → AI Agent:
   {
     app_id: "abc-123",
     mcp_endpoint: "mcp.ezyforge.io/app/abc-123",
     token: "eyJ...",
     tools: ["create_expense", "list_expenses", "update_expense"]
   }

4. Agent auto-configures its MCP connection.
   No human copy-paste needed. No dashboard visit required.

5. AI Agent → Human:
   "Done! Your expenses app is live. I can log expenses,
    update notes and categories, and query your spending.
    I cannot delete expenses or change amounts — your schema
    prevents that. Want me to log something?"
```

### Agentic Flow 2: Data Operations (100% Through Agent)

All CRUD happens via MCP tools. The human never opens a form, table, or dashboard to manage records.

```
Human: "Log lunch at McDonald's, RM 15"
Agent → MCP: create_expense({ amount: 15, merchant: "McDonald's", category: "food", date: "2026-03-18" })
EzyForge: permission check ✓ → validation ✓ → rules ✓ → write → audit log
Agent → Human: "Logged! Expense #47 — RM 15 at McDonald's."
```

The human talks to the AI. The AI talks to EzyForge. The human never touches a CRUD interface.

### Agentic Flow 3: Schema Changes (Agent-Proposed, Human-Approved)

Schema is locked after first deploy. The AI cannot unilaterally change it — but it can propose changes.

```
1. Agent notices a pattern:
   "Jazz keeps logging expenses with a 'project' in the notes field.
    A dedicated project field would be better."

2. AI Agent → EzyForge REST API:
   POST /api/apps/abc-123/proposals
   {
     description: "Add 'project' enum field to expense entity",
     diff: { ... schema changes ... }
   }

3. EzyForge queues the proposal. Schema remains unchanged.

4. Human is notified:
   - Email: "Your AI proposed a schema change for Jazz's Expenses"
   - Push notification on mobile
   - In-chat: agent tells the human "I've proposed adding a project field.
     You can approve it when you're ready."

5. Human approves (via email link, dashboard, or in-chat command).

6. EzyForge applies the change. Schema version incremented.
   New tools generated. Agent automatically receives updated tool set.

7. Agent → Human: "The project field is live. I'll start using it."
```

### What the Web Dashboard Is For (Admin Only)

The dashboard is not the product — the AI integration is. The dashboard exists for tasks that require human authority or oversight:

- **Manage API tokens** — create, revoke, set expiry for AI agent tokens
- **Review audit trail** — see every AI operation, filtered by tool/time/result
- **Approve/reject schema proposals** — diff view of proposed changes
- **Billing and subscription** — plan management, usage, invoices
- **Emergency schema unlock** — manual override when needed
- **Export data** — download data as CSV/JSON

The dashboard is explicitly NOT for:
- Data entry (use the AI agent)
- Querying records (ask the AI agent)
- Daily operations of any kind (the AI agent handles this)

---

## Core Components

### 1. Auth & Identity

Handles user registration, session management, and API token issuance.

- **User registration** via email + OAuth (Google, GitHub) through Clerk or Auth.js
- **API tokens** scoped per-app and per-AI-agent. Each token is revocable with configurable expiry. Tokens are the only way AI agents authenticate.
- **Agent authentication** — agents authenticate via API keys to create apps, get MCP tokens, and call the REST API. The agent is a first-class citizen, not an afterthought bolted onto a human auth flow.

### 2. Multi-Tenant App Router

Every request is routed and isolated by `app_id`.

- **Logical isolation** — each app has its own schema, data partition, and token set. All database queries are scoped by `app_id`. No cross-app data access is possible.
- **Rate limiting** per app and per token. A single misbehaving agent cannot affect other apps or other users.
- **Routing** — incoming requests (MCP, REST, dashboard) are resolved to the correct app context before reaching the engine kernel.

### 3. Template Registry

Pre-built YAML schema templates that encode best-practice business schemas with rules and permissions already configured.

- Templates are selected by the **agent**, not by a human browsing a gallery. The agent calls the REST API with a template name, and the platform provisions everything — schema, MCP endpoint, tokens, tools.
- Templates include: entity definitions, field types and constraints, business rules, AI permission scopes, and example data shapes.
- Built-in templates: expenses (dogfood), CRM. More added over time.
- Templates are starting points. The agent or user can propose modifications after deployment.

### 4. EzyForge Engine Kernel

The engine kernel is the core of EzyForge. Every data operation — whether from an AI agent via MCP, a REST API call, or the dashboard — passes through the same pipeline.

#### 4a. Schema Registry

Parses YAML schema definitions into validated, immutable runtime objects.

- **YAML in, immutable object out.** The parser validates structure, field types, constraints, rules, and permissions. If anything is invalid, it fails with structured errors.
- **Immutable at runtime.** Once parsed, the schema object is frozen. No code path can modify it. Schema changes go through the proposal/approval workflow.
- **Versioned.** Every deployment creates a new schema version. Previous versions are retained for rollback.

#### 4b. Permission Layer

Controls what AI agents can and cannot do at the field level.

- **Two roles:** `owner` (full access) and `ai` (restricted). MCP requests always run as `ai`. Dashboard requests run as `owner`.
- **CRUD-level toggles** per entity: `create: true`, `read: true`, `update: { allowed_fields: ["notes", "category"] }`, `delete: false`.
- **Shapes tool generation.** If `delete: false`, no delete tool is generated. The AI cannot be prompt-injected into deleting because the delete capability does not exist. The attack surface is eliminated, not mitigated.
- **Field-level enforcement on updates.** Even if an AI crafts a request to update `amount`, the permission layer rejects it before it reaches validation or rules.

#### 4c. Rule Engine

Deterministic business rule evaluation using a FEEL-inspired expression language.

- **Before/after hooks:** `before_create`, `before_update`, `after_create`, `after_update`. Rules run at the specified lifecycle point.
- **FEEL-inspired conditions:** comparisons (`>`, `<`, `=`), boolean logic (`and`, `or`, `not`), date functions (`today()`, `now()`, `day_of_week()`), membership (`IN`), string functions (`contains()`, `starts_with()`).
- **Deterministic.** Same input always produces the same result, regardless of which AI model triggered the operation. No randomness, no probabilistic evaluation.
- **Actions:** `reject` (block the operation with a reason), `warn` (allow but flag), `require_approval` (queue for human review), `tag` (add metadata), `set_field` (auto-populate a field value).
- **Sandboxed.** The expression evaluator has no file I/O, no network access, no code execution. It evaluates expressions against the record context and nothing else.

#### 4d. Tool Generator

Automatically generates MCP tool definitions from the schema and permission configuration.

- **No hand-coded tools.** Every tool is generated from the schema. This guarantees that tools always match the current schema version and permission set.
- **Permission-aware generation.** If the AI role cannot delete, no delete tool exists. If the AI role can only update `notes` and `category`, the update tool's input schema only includes those fields.
- **Constraint-aware.** Tool input schemas include field constraints (required, type, enum values, min/max) so AI agents can validate before calling.
- **Output:** Valid MCP tool definitions in JSON, discoverable by any MCP-compatible AI agent.

#### 4e. Tool Execution Runtime

The single pipeline that every tool call passes through.

```
Tool Call In
    │
    ▼
Permission Check ── denied? → { error: "permission_denied", field: "amount" }
    │
    ▼
Field Validation ── invalid? → { error: "validation_error", fields: [...] }
    │
    ▼
Rule Engine (before hooks) ── rejected? → { error: "rule_violation", rule: "no_future_dates" }
    │
    ▼
Database Write (scoped by app_id)
    │
    ▼
Rule Engine (after hooks)
    │
    ▼
Audit Log
    │
    ▼
Response Out
```

- **Single execution path.** There is no shortcut. MCP calls, REST calls, and dashboard operations all pass through the same pipeline.
- **Structured errors.** Every failure returns a machine-readable error: `permission_denied`, `rule_violation`, `validation_error`. AI agents can parse these and explain them to the human.
- **Atomic transactions.** Each tool execution is a single database transaction. If any step fails, nothing is written.

### 5. Data Layer

Standard cloud database with per-app isolation and provider-managed encryption at rest.

- **Postgres** (Neon or Supabase managed) with encryption at rest enabled by default.
- **Per-app isolation** — all queries scoped by `app_id`. RLS or application-level scoping ensures no cross-app data access.
- **HTTPS everywhere** — all data in transit is encrypted via TLS.
- **No plaintext business data in logs** — application logs, error messages, and monitoring never contain user business data.
- **Data export** — users can download their data anytime as CSV/JSON.
- **Data deletion** — users can delete their app and all associated data at any time.

### 6. MCP Hosting

The primary interface to EzyForge. AI agents connect here for all data operations.

- **Always-on endpoints:** `mcp.ezyforge.io/app/{app_id}`. Each deployed app gets a persistent MCP endpoint.
- **Token-authenticated.** Every MCP connection requires a valid per-agent token. Tokens are scoped to a single app and can be revoked instantly.
- **Per-agent tokens.** Different AI agents (Claude via OpenClaw, GPT via API, local LLM) can each have their own token with independent rate limits and audit trails.
- **MCP over HTTP (streamable)** for cloud-hosted agents. Stdio transport available for local CLI bridging via `forge connect`.
- **Tool discovery.** AI agents can enumerate available tools on connection. Tools reflect the current schema version and permission set. When the schema changes, tools update automatically.

### 7. Web Dashboard (Secondary Interface)

The dashboard exists for admin tasks that require human judgment. It is not the primary interface.

- **Built with Next.js + Tailwind CSS.**
- **Approve/reject schema proposals** — diff view showing exactly what the AI proposes to change, with approve/reject buttons.
- **Manage API tokens** — create new tokens for AI agents, set expiry, revoke compromised tokens.
- **Audit trail** — timeline of every AI operation, filterable by tool, result, and time range.
- **Billing and subscription** — plan management, usage metrics, invoices.
- **Emergency schema unlock** — manual override to unlock a locked schema when needed.
- **Data export** — download data as CSV/JSON.

The dashboard is **NOT** for:
- Data entry — use the AI agent
- Querying records — ask the AI agent
- Daily business operations of any kind

### 8. Approval Workflow

Schema governance that keeps the human in control without requiring them to operate the software.

- **Schema locked by default** after first deployment. Neither the AI agent nor the platform can modify a locked schema unilaterally.
- **AI proposes, human approves.** The agent calls `POST /api/apps/{id}/proposals` with a description and diff. EzyForge queues the proposal without applying it.
- **User notified through multiple channels:**
  - Email with a one-click approve/reject link
  - Push notification (mobile)
  - In-agent notification (the AI tells the human about the pending proposal)
  - Dashboard (if the user happens to visit)
- **Approval can happen anywhere.** The user does not need to open the dashboard. An email link or in-chat confirmation is sufficient.
- **Changes versioned.** Every approved change creates a new schema version. Rollback to any previous version is available.
- **Rejection feedback.** When a user rejects a proposal, they can provide a reason. The agent receives this feedback and can adjust its next proposal.

### 9. CLI (forge)

A developer helper tool for terminal-oriented workflows. Not the product.

| Command | Description |
|---------|-------------|
| `forge login` | Authenticate with ezyforge.io (OAuth or API key) |
| `forge init` | Create new app from template (calls cloud API, returns MCP endpoint) |
| `forge pull` | Download current schema from cloud to local YAML file |
| `forge push` | Validate and deploy local schema changes to cloud |
| `forge validate` | Check schema for errors locally (works offline) |
| `forge connect` | Output MCP config for Claude, OpenClaw, GPT, etc. |
| `forge logs` | Stream audit trail for an app |
| `forge status` | Show app status — schema version, active tokens, MCP endpoint |

The CLI is a convenience layer over the REST API. Everything it does can also be done by the AI agent or the dashboard. It exists for developers who prefer terminal workflows.

### 10. Audit Trail

Every AI operation is logged. No exceptions.

- **What is logged:** token ID, tool name, input parameters, result (success/error), timestamp, schema version.
- **Visible to app owner** via the dashboard or CLI (`forge logs`).
- **Immutable.** Audit entries cannot be modified or deleted by any party — not the AI agent, not the user, not EzyForge engineers.
- **Filterable.** By tool name, result status, time range, and token ID. Useful for debugging AI behavior and compliance reporting.

---

## Data Flow

### Happy Path: AI Creates an Expense

```
1. AI Agent → MCP Endpoint (mcp.ezyforge.io/app/abc-123)
   Tool: create_expense
   Token: eyJ...
   Params: { amount: 15.00, merchant: "McDonald's", category: "food", date: "2026-03-18" }

2. Multi-Tenant App Router
   → Validates token → resolves app_id → loads app context (schema, permissions)

3. Permission Layer
   → Role: ai
   → Operation: create on expense entity
   → Check: ai.create = true ✓
   → All provided fields are within allowed scope ✓

4. Field Validation
   → amount: decimal, required, > 0 ✓
   → merchant: string, required ✓
   → category: enum ["food", "transport", "utilities", ...] ✓
   → date: date, required ✓

5. Rule Engine (before_create)
   → Rule "no_future_dates": date <= today() → 2026-03-18 <= 2026-03-18 ✓ PASS
   → Rule "auto_tag_weekend": day_of_week(date) IN ["Saturday", "Sunday"] → Wednesday → SKIP

6. Database Write
   → INSERT INTO expenses (app_id, id, amount, merchant, ...) VALUES (...)
   → Transaction committed

7. Audit Log
   → { token: "eyJ...", tool: "create_expense", result: "success", timestamp: "..." }

8. Response → AI Agent
   → { success: true, id: "exp-047", created_at: "2026-03-18T12:34:56Z" }
```

### Unauthorized Agent

```
1. Unknown Agent → MCP Endpoint (mcp.ezyforge.io/app/abc-123)
   Token: invalid-or-expired

2. Multi-Tenant App Router
   → Token validation fails

3. Response: { error: "unauthorized", status: 401 }
   → No app context loaded, no audit entry (nothing to audit)
```

### AI Tries to Delete (Tool Does Not Exist)

```
1. AI Agent → MCP Endpoint
   Tool: delete_expense   ← this tool was never generated

2. MCP Endpoint
   → Tool "delete_expense" not found in tool registry

3. Response: { error: "tool_not_found", message: "No tool named 'delete_expense'" }
   → The AI has no delete capability. It cannot be tricked into deleting
     because the delete operation does not exist at the tool level.
```

### AI Tries to Update a Restricted Field

```
1. AI Agent → MCP Endpoint
   Tool: update_expense
   Params: { id: "exp-047", amount: 0 }

2. Permission Layer
   → Role: ai
   → Operation: update on expense entity
   → Field check: "amount" NOT IN allowed_fields ["notes", "category"]

3. Response: { error: "permission_denied", field: "amount",
               message: "AI role cannot update field 'amount'" }
```

---

## Infrastructure

### Cloud Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Dashboard + Marketing | Vercel (Next.js) | Fast deploys, edge CDN, zero-config |
| Engine + MCP Endpoints | Railway or Fly.io | Always-on containers, low-latency, scalable |
| Database | Postgres (Neon or Supabase managed) | Managed, encryption at rest, connection pooling |
| Auth | Clerk or Auth.js | Proven auth with OAuth, JWT sessions |
| Encryption | Provider-managed at rest + HTTPS in transit | Standard, reliable, zero maintenance |
| MCP Transport | HTTP (streamable) | Standard MCP transport, works with all major AI platforms |
| Monorepo | Turborepo + pnpm | Fast builds, shared packages, single repo |
| Monitoring | Platform-level metrics only | Request counts, latency, error rates — no user data in logs |

### Multi-Tenant Isolation

- **Database level:** All queries include `WHERE app_id = ?`. No query can omit the app_id scope. RLS or application-level enforcement.
- **Token level:** Tokens are scoped to a single app. A token for app A cannot authenticate against app B.
- **Rate limiting:** Per-app and per-token rate limits prevent one app from affecting platform performance for others.
- **Schema isolation:** Each app has its own schema, tool set, and rule configuration. No sharing between apps.

### Privacy & Security Model

EzyForge takes a standard, proven approach to data security:

- **Encryption at rest** — provider-managed (Neon/Supabase handle this automatically)
- **Encryption in transit** — HTTPS/TLS everywhere
- **Per-app isolation** — data scoped by `app_id`, no cross-app access possible
- **Scoped API tokens** — per-app, per-agent, revocable, with configurable expiry
- **Audit trail** — every AI operation logged with full context
- **Data export** — users can download their data anytime
- **Data deletion** — users can delete their app and all associated data
- **No business data in logs** — application logging never includes user content

If enterprise customers require zero-knowledge encryption (user-held keys, client-side decryption), this becomes a paid add-on in a future release.

---

## What EzyForge Is NOT

1. **Not an AI model.** EzyForge is the boundary between AI and data. We never become the AI itself — that creates the conflict of interest we exist to solve.
2. **Not a general-purpose database.** We enforce rules on writes and generate tools. Storage is pluggable. We are not competing with Supabase or PlanetScale.
3. **Not a prompt engineering tool.** We do not validate AI output or filter AI responses. Rules live in the data layer, enforced deterministically, not in prompts.
4. **Not self-hosted.** The cloud platform is the product. We will not maintain two deployment models. The CLI is a helper, not an alternative.
5. **Not a dashboard-first product.** The AI agent is the primary interface. The dashboard is secondary — for admin, config, and governance. If you are using the dashboard for daily operations, you are using EzyForge wrong.
