# EzyBusiness — Research Report

**Date:** 2026-03-17
**Author:** Jazz Tong (CTO, Anchor Sprint) + AI Research
**Status:** Initial Research Complete

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem](#2-the-problem)
3. [Market Landscape Analysis](#3-market-landscape-analysis)
4. [The Gap — What Nobody Solves](#4-the-gap--what-nobody-solves)
5. [Problem Validation](#5-problem-validation)
6. [Refined Problem Statement](#6-refined-problem-statement)
7. [Solution Concept: EzyBusiness](#7-solution-concept-ezybusiness)
8. [Schema Format Design](#8-schema-format-design)
9. [Architecture Deep Dive](#9-architecture-deep-dive)
10. [Differentiation Analysis](#10-differentiation-analysis)
11. [Go-To-Market Strategy](#11-go-to-market-strategy)
12. [Risks and Mitigations](#12-risks-and-mitigations)
13. [Recommendation](#13-recommendation)
14. [Sources](#14-sources)

---

## 1. Executive Summary

**Headline:** There is no platform today that lets developers define business schemas declaratively and then safely expose them to AI agents with enforced rules, locked schemas, and owner governance.

The tools exist in **fragments**: Supabase gives you a database, Prisma gives you a schema DSL, LangChain gives you structured outputs, Superagent gives you guardrails — but **nothing combines schema-as-law + AI-as-operator + owner-as-governor** in one coherent platform.

EzyBusiness fills this gap: a schema-first platform where business logic is defined declaratively, AI agents operate strictly within those rules, and owners maintain governance over schema changes. Think **"Prisma + Supabase + AI guardrails"** — a deterministic business layer for non-deterministic AI.

**Verdict:** The problem is real, validated, growing, and unsolved. Build it.

---

## 2. The Problem

### The Founder's Pain (Jazz's Words)

> "When I want to build a personal expenses app using an agentic system, I need to harness the LLM to create proper business objects and rules. Without this, it creates unstable structures and my expenses data ends up unreliable. The LLM can invent its own schema, change field names, store data inconsistently — it is non-deterministic by nature."

### Why This Happens

LLMs are probabilistic text generators. When given database access (via MCP, function calling, or direct SQL), they can:

1. **Invent schemas on the fly** — creating `expense_amount` in one call and `cost` in the next
2. **Violate business rules** — recording a future-dated expense, storing negative amounts, using invalid currencies
3. **Drift over time** — gradually changing how they structure data as context windows rotate
4. **Bypass intended constraints** — an LLM told "don't delete records" can still run `DELETE FROM expenses` if it has raw SQL access
5. **Lose consistency across sessions** — different sessions produce different data shapes for the same entity

This is not a bug in LLMs — it's their nature. The problem is that **nothing sits between the LLM and the data layer to enforce deterministic business rules**.

---

## 3. Market Landscape Analysis

### Category A: Backend-as-a-Service / Database Platforms

| Tool | What It Does | Schema Enforcement | AI Integration | Business Rules | Lock Mechanism |
|------|-------------|-------------------|----------------|---------------|----------------|
| **Supabase** | Postgres + Auth + Storage + Realtime | DB constraints only | MCP server exposes schema as metadata | RLS policies (SQL-level) | No schema lock concept |
| **Hasura** | Auto-generates GraphQL from Postgres | Strong (introspects DB) | None native | Postgres constraints + permissions | No |
| **Appwrite** | Open-source BaaS | Collection-level schemas | None | Attribute validation | No |
| **PocketBase** | SQLite-based BaaS | Collection schemas | None | Basic validation rules | No |
| **Directus** | Database-first headless CMS | Wraps existing DB schema | Limited (content AI) | Field validation, flows | No |

**Gap:** These platforms manage data well but have **no concept of AI-specific permissions**, **no schema locking**, and **no business rule engine that runs independent of the AI**.

### Category B: Schema / ORM Tools

| Tool | What It Does | AI Tool Generation | Business Rules | Lock Mechanism |
|------|-------------|-------------------|---------------|----------------|
| **Prisma** | TypeScript ORM with schema DSL | No (but AI-friendly schema) | None beyond DB constraints | Migration-based (manual) |
| **Drizzle** | TypeScript ORM | No | None | Migration-based |
| **PostgREST** | REST API from Postgres | No | DB constraints only | No |

**Gap:** Excellent schema definition, but **no AI integration layer**, **no runtime rule engine**, **no governance**.

### Category C: AI Agent Frameworks

| Tool | What It Does | Schema Enforcement | Business Rules | Data Persistence |
|------|-------------|-------------------|---------------|-----------------|
| **LangChain** | LLM orchestration + structured outputs | Pydantic/Zod schemas for output shape | None | None (bring your own) |
| **LlamaIndex** | Data-aware LLM framework | Query-level structure | None | Index-based (not CRUD) |
| **CrewAI** | Multi-agent orchestration | Task output schemas | None | None |
| **Composio** | 1000+ tool integrations for agents | Tool-level schemas | OAuth/auth per tool | Via integrated apps |
| **Superagent** | Agent guardrails + safety | Prompt-level guardrails | Action restrictions | None |
| **OpenAI Agents SDK** | Agent building blocks | Structured outputs | Tool-level guardrails | None |

**Gap:** These frameworks enforce **output format** but not **business logic**. They validate "is this JSON valid?" but not "is this expense amount reasonable?" or "should the AI be allowed to delete this record?". They have **no persistent schema**, **no CRUD-level permissions**, and **no owner governance**.

### Category D: No-Code / Low-Code Platforms

| Tool | What It Does | Schema Control | AI Integration | Programmability |
|------|-------------|---------------|----------------|-----------------|
| **Airtable** | Structured spreadsheets + automation | Field types + validation | "Generate with AI" (limited) | Sandboxed scripts only |
| **Retool** | Internal tool builder | Connects to existing DBs | AI blocks (prompt-based) | JavaScript-level |
| **Glide** | Mobile app builder from sheets | Sheet-derived schema | Limited | No-code only |
| **Notion** | Flexible workspace | Properties on databases | AI summarization | API only |

**Gap:** Good for non-developers, but **API-limited**, **no true schema enforcement for AI**, **no programmability** for serious use cases, and **can't be embedded in agentic systems**.

### Category E: Headless CMS Platforms

| Tool | What It Does | Schema Definition | AI Integration | Business Rules |
|------|-------------|------------------|----------------|---------------|
| **Payload CMS** | TypeScript-native headless CMS | Code-defined collections | None native | Hooks + access control |
| **Strapi** | Headless CMS | Content-type builder | Plugin-based | Lifecycle hooks |
| **Sanity** | Structured content platform | GROQ-based schema | AI Assist plugin | Validation rules |

**Gap:** CMS platforms have strong schema definition and hooks, but are **designed for content management, not business data**. They lack **AI-specific permissions**, **template inheritance**, and **schema lock/publish workflows**.

---

## 4. The Gap — What Nobody Solves

After analyzing 20+ tools across 5 categories, the gap is clear:

### The Missing Platform = Schema-as-Law for AI Agents

| Capability | Exists Today? | Where? | Complete? |
|-----------|---------------|--------|-----------|
| Declarative schema definition | Yes | Prisma, Payload, Directus | Partial — no AI context |
| Auto-generated CRUD API | Yes | Hasura, Supabase, PostgREST | Yes, but no AI tools |
| Structured LLM outputs | Yes | LangChain, OpenAI, Anthropic | Format only, not business logic |
| AI guardrails | Yes | Superagent, Guardrails AI | Safety/prompt-level, not schema-level |
| AI-specific field permissions | **No** | — | — |
| Schema lock / publish workflow | **No** | — | — |
| Business rule engine for AI | **No** | — | — |
| Template library for business apps | **No** | — | — |
| Auto-generated AI tools from schema | **No** | — | — |
| Owner approval for schema changes | **No** | — | — |

**The core gap:** Nobody provides a **unified platform** where:
1. You define your business schema (entities, fields, types, validations, rules)
2. The platform auto-generates AI-compatible tools (create/read/update/delete) from that schema
3. Business rules are enforced **deterministically** regardless of what the AI says
4. The AI has **field-level permissions** (can update `notes` but not `amount`)
5. The schema can be **locked** so the AI can never modify it at runtime
6. Schema changes require **owner approval**

---

## 5. Problem Validation

### Industry Evidence

**CockroachDB (2025):** Published ["Why Agentic Applications Need Deterministic Foundations"](https://www.cockroachlabs.com/blog/agentic-applications-deterministic-foundations/) — arguing that AI agents "embrace uncertainty, but their data layer can't." They document the dual-write problem and consistency violations when agents interact with databases without proper constraints.

**Gartner (2025):** Warns that **over 40% of agentic AI projects may be canceled by 2027** without proper governance — validating that the governance gap is industry-recognized, not theoretical.

**LangChain Limitations (2025-2026):** Multiple developer reports confirm that TypedDict-based structured outputs "cannot validate or enforce business rules — it only provides a structure for the model to follow." Pydantic adds runtime validation but still requires manual integration with data persistence.

**Airtable Developer Frustration (2025):** Documented cases where Airtable's "Generate with AI" outputs objects incompatible with its own "Create Record" step — demonstrating that even no-code platforms fail at AI-to-data schema consistency.

**Authority Partners (2026):** Their production guide for AI agent guardrails emphasizes "bounded autonomy architectures with clear operational limits and escalation paths" — the exact pattern EzyBusiness would formalize.

### Developer Pain Points (Validated)

1. **Schema drift** — LLMs change field names between sessions, producing inconsistent data
2. **Rule violations** — AI ignores business constraints (future dates, negative amounts, invalid enums)
3. **Permission overreach** — AI with DB access can delete/modify anything, even when not intended
4. **Testing impossibility** — Non-deterministic outputs make traditional QA impossible for data integrity
5. **Governance vacuum** — No approval workflow for AI-initiated schema or data changes

---

## 6. Refined Problem Statement

### Headline Problem

**AI agents cannot be trusted with business data unless the business schema and rules are enforced deterministically, independent of the LLM.**

### 5 Specific Pain Points

| # | Pain Point | Real Example | Severity |
|---|-----------|-------------|----------|
| 1 | **Schema Invention** | LLM creates `expense_amount` in one session, `cost` in another, `price` in a third. SQLite database ends up with inconsistent columns. | Critical |
| 2 | **Business Rule Bypass** | LLM records an expense dated 2027-01-01 because it hallucinated the date. No validation catches it because rules exist only in the prompt, not the data layer. | Critical |
| 3 | **Permission Overreach** | LLM asked to "fix the amount" runs `UPDATE expenses SET amount = 0 WHERE id = 5` then `DELETE FROM expenses WHERE amount = 0`. Nothing prevented the delete. | High |
| 4 | **Schema Drift Over Time** | Agentic app works perfectly for 2 weeks, then a model update causes the LLM to start using `amt` instead of `amount`. All new records break downstream reports. | High |
| 5 | **No Governance** | Developer deploys an AI app. The AI decides to add a new `tax_rate` field to the schema. Nobody approved this. Now the app has undocumented fields that may break. | Medium |

### Who Has This Problem

| Persona | Context | Pain Level |
|---------|---------|------------|
| **Solo developer / Indie hacker** | Building AI-powered personal tools (expenses, CRM, bookings) | High — no time to build guardrails from scratch |
| **Startup CTO** | Shipping AI-native products quickly, needs data reliability | Critical — data quality = product quality |
| **Enterprise AI team** | Deploying agentic workflows that touch business data | Critical — compliance and audit requirements |
| **AI agent platform builder** | Building platforms like OpenClaw where agents manage user data | Critical — platform credibility depends on data integrity |
| **No-code/low-code builder** | Using AI to generate app logic, needs schema stability | High — schema changes break their apps |

### How Bad Is It Today Without This Solution?

**Terrible.** Developers currently:
- Write custom validation middleware per app (hours of boilerplate)
- Use prompt engineering to "ask nicely" that the LLM follows rules (unreliable)
- Build shadow schemas in Pydantic/Zod that duplicate DB schema (maintenance nightmare)
- Accept data quality issues and clean up manually (defeats the purpose of automation)
- Avoid giving AI write access to business data entirely (cripples the AI)

There is no off-the-shelf solution. Every team solving this is solving it from scratch.

---

## 7. Solution Concept: EzyBusiness

### Core Principle

> **Schema is Law. AI is Operator. Owner is Governor.**

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    EzyBusiness Platform                       │
│                                                               │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │   Schema     │   │    Rule      │   │    AI Tool       │  │
│  │   Registry   │──▶│    Engine    │──▶│    Generator     │  │
│  │  (YAML/JSON) │   │(deterministic│   │ (from schema)    │  │
│  └──────┬───────┘   │  pre/post    │   └────────┬─────────┘  │
│         │           │  hooks)      │            │             │
│         │           └──────────────┘            │             │
│         ▼                                       ▼             │
│  ┌─────────────┐                      ┌──────────────────┐   │
│  │   Lock       │                      │   AI Integration │   │
│  │   Manager    │                      │   Layer (MCP,    │   │
│  │  (publish/   │                      │   function call, │   │
│  │   unlock)    │                      │   REST)          │   │
│  └──────────────┘                      └────────┬─────────┘  │
│                                                  │            │
│  ┌─────────────┐   ┌──────────────┐             │            │
│  │  Template    │   │   Owner      │◀────────────┘            │
│  │  Library     │   │   Approval   │                          │
│  │  (pre-built) │   │   Workflow   │                          │
│  └─────────────┘   └──────────────┘                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              Data Layer (SQLite / Postgres)               ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
          ▲                    ▲                    ▲
          │                    │                    │
     AI Agents           Human Users          Admin / Owner
     (read/write          (full CRUD            (schema mgmt,
      within rules)        via app)              lock/unlock)
```

### Key Components

#### 1. Schema Registry
- Stores entity definitions as YAML/JSON
- Versioned (every schema change creates a new version)
- Supports inheritance from templates
- Single source of truth for all entity structures

#### 2. Rule Engine
- Deterministic pre/post hooks that execute on every CRUD operation
- Rules defined in schema, not in prompts
- Cannot be bypassed by AI — runs at the data layer
- Supports: field validation, cross-field rules, conditional logic, computed fields

#### 3. AI Tool Generator
- Reads schema → auto-generates typed tools for AI agents
- Tools respect `ai_permissions` — if AI can't delete, no delete tool is generated
- Tools include field-level restrictions in their signatures
- Supports: MCP tools, OpenAI function calling, Anthropic tool use, REST API

#### 4. Lock Manager
- `locked: false` → AI and owner can modify schema (development mode)
- `locked: true` → schema is frozen; AI operates within existing rules only
- Unlock requires owner authentication
- Lock history is auditable

#### 5. Template Library
- Pre-built schemas for common business types
- Templates can be extended (add fields, add rules, not remove base ones)
- Community-contributed templates
- Examples: expenses, CRM, bookings, inventory, invoicing, project tracking

#### 6. Owner Approval Workflow
- AI can *propose* schema changes (new field, new rule)
- Proposals are queued for owner review
- Owner approves/rejects via CLI, API, or UI
- Approved changes create a new schema version

---

## 8. Schema Format Design

### Complete Example: Personal Expenses App

```yaml
# ezybusiness.schema.yaml
app: personal-expenses
version: "1.2.0"
locked: true
template: ezybusiness/expenses  # inherits base template

metadata:
  name: "Jazz's Personal Expenses"
  description: "Track daily expenses across MYR and SGD"
  owner: jazz@anchorsprint.com
  created: 2026-03-15
  last_modified: 2026-03-17

# Database configuration
storage:
  engine: sqlite                # or postgres
  path: ./data/expenses.db      # for sqlite
  # connection: postgres://...  # for postgres

entities:
  expense:
    table: expenses

    fields:
      id:
        type: uuid
        generated: true
        primary_key: true

      amount:
        type: decimal
        required: true
        precision: 2
        min: 0.01
        max: 999999.99
        description: "Expense amount in specified currency"

      currency:
        type: enum
        values: [MYR, SGD, USD]
        required: true
        default: MYR

      category:
        type: enum
        values:
          - food
          - transport
          - accommodation
          - entertainment
          - shopping
          - utilities
          - healthcare
          - education
          - other
        required: true

      subcategory:
        type: string
        max_length: 50
        optional: true
        description: "Optional sub-classification"

      merchant:
        type: string
        required: true
        min_length: 1
        max_length: 100

      date:
        type: date
        required: true
        description: "Date the expense was incurred"

      notes:
        type: string
        max_length: 500
        optional: true

      receipt_url:
        type: url
        optional: true

      payment_method:
        type: enum
        values: [cash, credit_card, debit_card, e_wallet, bank_transfer]
        optional: true
        default: cash

      created_at:
        type: datetime
        generated: true
        auto: now

      updated_at:
        type: datetime
        generated: true
        auto: now_on_update

    # Business rules — enforced deterministically
    rules:
      - name: no_future_dates
        when: before_create, before_update
        condition: "date <= today()"
        error: "Expense date cannot be in the future"

      - name: reasonable_amount
        when: before_create, before_update
        condition: "amount <= 50000"
        error: "Single expense over 50,000 requires manual review"
        action: require_approval

      - name: weekend_entertainment_flag
        when: after_create
        condition: "category == 'entertainment' AND day_of_week(date) IN ['Saturday', 'Sunday']"
        action: tag("weekend-entertainment")

      - name: duplicate_detection
        when: before_create
        condition: |
          NOT EXISTS(
            SELECT 1 FROM expenses
            WHERE merchant = NEW.merchant
            AND amount = NEW.amount
            AND date = NEW.date
          )
        error: "Possible duplicate expense detected"
        action: warn  # warn but don't block

    # What the AI agent can and cannot do
    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [notes, category, subcategory, payment_method]
        # AI can reclassify or add notes, but cannot change amount/date/merchant
      delete: false
      list:
        max_results: 100
        default_sort: date_desc
      aggregate:
        allowed: [sum, count, avg]
        group_by: [category, currency, payment_method, date]

      # Schema-level restrictions
      can_change_schema: false
      can_propose_schema_change: true  # AI can suggest, owner approves

    # Indexes for query performance
    indexes:
      - fields: [date]
      - fields: [category, date]
      - fields: [merchant]

  # A second entity showing multi-entity apps
  budget:
    table: budgets

    fields:
      id:
        type: uuid
        generated: true
        primary_key: true
      category:
        type: enum
        values_from: expense.category  # references expense categories
        required: true
      monthly_limit:
        type: decimal
        required: true
        min: 0
        precision: 2
      currency:
        type: enum
        values: [MYR, SGD, USD]
        required: true
      active:
        type: boolean
        default: true

    rules:
      - name: unique_category_currency
        type: unique_constraint
        fields: [category, currency]
        error: "Budget already exists for this category and currency"

    ai_permissions:
      create: false       # Only owner sets budgets
      read: true           # AI can check budget limits
      update: false        # Only owner modifies
      delete: false

# Cross-entity rules
cross_entity_rules:
  - name: budget_warning
    when: after_create(expense)
    condition: |
      monthly_total(expense, category, currency) >
      budget_limit(budget, category, currency) * 0.8
    action: notify_owner("Budget 80% reached for {category} in {currency}")

  - name: budget_exceeded
    when: after_create(expense)
    condition: |
      monthly_total(expense, category, currency) >
      budget_limit(budget, category, currency)
    action:
      - notify_owner("Budget EXCEEDED for {category} in {currency}")
      - tag("over-budget")

# API configuration
api:
  type: rest           # rest | graphql | both
  auth: bearer_token
  rate_limit: 60/min
  cors: ["http://localhost:3000"]
```

### Template Inheritance

```yaml
# Base template: ezybusiness/expenses (provided by EzyBusiness)
# Located at: templates/expenses/schema.yaml

app: expenses-base
version: "1.0.0"
locked: false
template_type: base

entities:
  expense:
    fields:
      id: { type: uuid, generated: true, primary_key: true }
      amount: { type: decimal, required: true, min: 0.01 }
      currency: { type: enum, values: [USD], required: true }
      category: { type: enum, values: [food, transport, other], required: true }
      merchant: { type: string, required: true }
      date: { type: date, required: true }
      notes: { type: string, max_length: 500, optional: true }
      created_at: { type: datetime, generated: true, auto: now }

    rules:
      - name: no_future_dates
        when: before_create
        condition: "date <= today()"
        error: "Expense date cannot be in the future"

    ai_permissions:
      create: true
      read: true
      update: { allowed_fields: [notes, category] }
      delete: false

# --- User's extension ---

# In user's schema:
app: personal-expenses
template: ezybusiness/expenses  # inherits all fields and rules

entities:
  expense:
    extend: true  # extend, don't replace

    fields:
      # Add new fields
      subcategory: { type: string, max_length: 50, optional: true }
      receipt_url: { type: url, optional: true }
      payment_method: { type: enum, values: [cash, credit_card, e_wallet], optional: true }

      # Override base field values (only allowed overrides)
      currency: { values: [MYR, SGD, USD] }  # extend enum values
      category: { values: [food, transport, accommodation, entertainment, shopping, utilities, other] }

    rules:
      # Base rules are inherited automatically
      # Add new rules
      - name: reasonable_amount
        when: before_create
        condition: "amount <= 50000"
        error: "Amount too high"
```

**Template rules:**
- Base template fields cannot be removed, only extended
- Base template rules cannot be removed, only supplemented
- Enum values can be extended but base values cannot be removed
- `ai_permissions` can be made MORE restrictive but not less (AI can't gain delete access if base denies it)

---

## 9. Architecture Deep Dive

### How the Rule Engine Works

```
AI says: "Create expense: amount=150, currency=MYR, category=food,
          merchant=McDonalds, date=2026-03-18"

                    ▼
          ┌─────────────────┐
          │  Parse & Validate │  ← Schema validation (types, required fields, enums)
          │  Against Schema   │     FAIL if field doesn't exist or wrong type
          └────────┬──────────┘
                   │ ✓ Valid structure
                   ▼
          ┌─────────────────┐
          │  Check AI        │  ← Permission check: can AI create?
          │  Permissions     │     FAIL if ai_permissions.create = false
          └────────┬──────────┘
                   │ ✓ Permitted
                   ▼
          ┌─────────────────┐
          │  Run before_     │  ← Execute rules: no_future_dates → FAIL
          │  create Rules    │     (2026-03-18 > today 2026-03-17)
          └────────┬──────────┘
                   │ ✓ All rules pass (or ✗ reject with error message)
                   ▼
          ┌─────────────────┐
          │  Execute DB      │  ← INSERT INTO expenses (...)
          │  Operation       │
          └────────┬──────────┘
                   │ ✓ Committed
                   ▼
          ┌─────────────────┐
          │  Run after_      │  ← Execute post-rules: budget checks, tags, notifications
          │  create Rules    │
          └────────┬──────────┘
                   │
                   ▼
          Return success + created record to AI
```

### How AI Tools Are Auto-Generated

From the schema, EzyBusiness generates typed tools that the AI agent can call:

```typescript
// Auto-generated from schema — AI never sees raw SQL

// Tool: create_expense
{
  name: "create_expense",
  description: "Create a new expense record",
  parameters: {
    amount: { type: "number", required: true, minimum: 0.01, maximum: 999999.99 },
    currency: { type: "string", enum: ["MYR", "SGD", "USD"], required: true },
    category: { type: "string", enum: ["food", "transport", "accommodation", ...], required: true },
    merchant: { type: "string", required: true, maxLength: 100 },
    date: { type: "string", format: "date", required: true },
    notes: { type: "string", maxLength: 500 },
    receipt_url: { type: "string", format: "uri" },
    payment_method: { type: "string", enum: ["cash", "credit_card", "e_wallet"] }
  }
}

// Tool: list_expenses (read)
{
  name: "list_expenses",
  description: "List expenses with optional filters",
  parameters: {
    category: { type: "string", enum: [...] },
    currency: { type: "string", enum: [...] },
    date_from: { type: "string", format: "date" },
    date_to: { type: "string", format: "date" },
    limit: { type: "integer", maximum: 100, default: 20 },
    sort: { type: "string", enum: ["date_asc", "date_desc", "amount_asc", "amount_desc"] }
  }
}

// Tool: update_expense_notes (field-restricted update)
{
  name: "update_expense",
  description: "Update allowed fields on an expense",
  parameters: {
    id: { type: "string", format: "uuid", required: true },
    // ONLY fields listed in ai_permissions.update.allowed_fields
    notes: { type: "string", maxLength: 500 },
    category: { type: "string", enum: [...] },
    subcategory: { type: "string", maxLength: 50 },
    payment_method: { type: "string", enum: [...] }
  }
}

// Tool: expense_summary (aggregate)
{
  name: "expense_summary",
  description: "Get aggregated expense data",
  parameters: {
    aggregation: { type: "string", enum: ["sum", "count", "avg"], required: true },
    group_by: { type: "string", enum: ["category", "currency", "payment_method", "date"] },
    date_from: { type: "string", format: "date" },
    date_to: { type: "string", format: "date" }
  }
}

// NOTE: No delete_expense tool is generated because ai_permissions.delete = false
// NOTE: No tool for modifying amount, date, or merchant — AI physically cannot
```

### How Publish Lock Works

```
Development Mode (locked: false)
─────────────────────────────────
  Owner ──▶ Can modify schema freely
  AI    ──▶ Can propose + auto-apply schema changes (if permitted)
  Tools ──▶ Regenerated on every schema change

         ┌─────────────────────┐
         │   ezybiz lock       │  ← Owner runs this command
         │   --version 1.2.0   │
         └──────────┬──────────┘
                    │
                    ▼

Production Mode (locked: true)
─────────────────────────────────
  Owner ──▶ Must explicitly unlock to modify schema
  AI    ──▶ Can only operate within existing tools
  AI    ──▶ Can propose changes → queued for owner approval
  Tools ──▶ Frozen, will not change
  Schema──▶ Immutable until unlocked

         ┌─────────────────────┐
         │   ezybiz unlock     │  ← Requires owner auth
         │   --reason "add     │     Creates audit log entry
         │    tax field"       │
         └─────────────────────┘
```

### Owner Approval Workflow

```
AI Agent: "I notice you're tracking business expenses.
           Should I add a 'tax_deductible' field?"

         ┌─────────────────────┐
         │  AI calls:          │
         │  propose_schema_    │
         │  change({           │
         │    entity: expense, │
         │    action: add_field│
         │    field: {         │
         │      name: tax_     │
         │      deductible,    │
         │      type: boolean, │
         │      default: false │
         │    }                │
         │  })                 │
         └────────┬────────────┘
                  │
                  ▼
         ┌─────────────────────┐
         │  Proposal Queue     │
         │  ┌─────────────┐    │
         │  │ #1 add field │    │
         │  │ tax_deductible│   │
         │  │ Status: pending│  │
         │  └─────────────┘    │
         └────────┬────────────┘
                  │
                  ▼
         Owner gets notification (CLI, Telegram, email)

         $ ezybiz proposals list
         #1  [pending]  Add field 'tax_deductible' (boolean) to expense
             Proposed by: AI agent via Telegram session
             Reason: "Track tax-deductible business expenses"

         $ ezybiz proposals approve 1
         ✓ Schema updated to v1.3.0
         ✓ AI tools regenerated
         ✓ Database migration applied
```

---

## 10. Differentiation Analysis

### EzyBusiness vs. The 3 Closest Alternatives

#### Comparison 1: EzyBusiness vs. Supabase + LangChain (DIY Stack)

| Dimension | Supabase + LangChain | EzyBusiness |
|-----------|---------------------|-------------|
| **Schema definition** | Postgres DDL + Pydantic models (duplicate) | Single YAML source of truth |
| **AI tools** | Hand-written function definitions | Auto-generated from schema |
| **Business rules** | Postgres constraints + prompt engineering | Declarative rule engine (pre/post hooks) |
| **AI permissions** | RLS policies (row-level, not field-level) | Field-level AI permissions per entity |
| **Schema lock** | Manual migration discipline | Built-in lock/unlock with audit trail |
| **Schema governance** | Git PRs (developer-centric) | Owner approval workflow (non-technical friendly) |
| **Setup time** | Days to weeks | Minutes (template + customize) |
| **Template library** | None | Pre-built for common business types |

**Verdict:** Supabase + LangChain CAN achieve some of this, but requires **significant custom glue code**, **duplicate schema definitions**, and **no built-in AI governance**. EzyBusiness is the integrated solution.

#### Comparison 2: EzyBusiness vs. Payload CMS

| Dimension | Payload CMS | EzyBusiness |
|-----------|------------|-------------|
| **Primary use case** | Content management | Business data for AI agents |
| **Schema definition** | TypeScript collection configs | YAML/JSON (language-agnostic) |
| **AI integration** | None native | First-class AI tool generation |
| **Business rules** | Lifecycle hooks (code-based) | Declarative rules (config-based) |
| **AI permissions** | Access control (user-level) | AI-specific field-level permissions |
| **Schema lock** | No concept | Built-in publish/lock workflow |
| **Templates** | No template library | Business-type templates |
| **Data model** | Document-oriented (MongoDB-first) | Relational (SQL-first) |

**Verdict:** Payload is the closest in spirit (code-defined schemas, hooks, access control) but is **built for CMS, not AI-native business apps**. It has no AI awareness and requires full TypeScript to configure.

#### Comparison 3: EzyBusiness vs. Composio

| Dimension | Composio | EzyBusiness |
|-----------|---------|-------------|
| **Focus** | Connect AI to existing SaaS tools | Define + enforce business logic for AI |
| **Schema** | Tool-level schemas (per integration) | Business-entity schemas (your data model) |
| **Data ownership** | Data lives in SaaS tools | Data lives in your DB |
| **Business rules** | None (passes through to SaaS) | Declarative rule engine |
| **AI permissions** | OAuth-based per tool | Field-level per entity |
| **Schema governance** | None | Lock + approval workflow |
| **Use case** | "Connect AI to Slack/Gmail/Jira" | "Build AI-native business apps" |

**Verdict:** Composio connects AI to *existing* tools. EzyBusiness lets you *build* the business app that AI operates within. They're complementary, not competitive.

### Summary: EzyBusiness Unique Value

```
                    Schema     AI Tool    Business    AI Field     Schema    Owner
                    as Code    Gen        Rules       Permissions  Lock      Approval

Supabase            ◐          ✗          ◐           ✗            ✗         ✗
Payload CMS         ✓          ✗          ◐           ✗            ✗         ✗
Composio            ✗          ◐          ✗           ◐            ✗         ✗
LangChain           ✗          ✗          ✗           ✗            ✗         ✗
Prisma              ✓          ✗          ✗           ✗            ✗         ✗
Hasura              ✓          ✗          ◐           ✗            ✗         ✗

EzyBusiness         ✓          ✓          ✓           ✓            ✓         ✓

◐ = partial   ✓ = yes   ✗ = no
```

**EzyBusiness is the only platform that has ALL SIX capabilities together.**

---

## 11. Go-To-Market Strategy

### Should Anchor Sprint Build This?

**Yes.** Here's why:

1. **Jazz lives the problem daily** — OpenClaw's expenses manager is literally the first customer
2. **Anchor Sprint has the technical DNA** — AI-native systems, agent platforms, schema design
3. **The market timing is perfect** — agentic AI is exploding, but governance is lagging (Gartner's 40% cancellation warning)
4. **Small team advantage** — this is an infrastructure play that rewards depth over breadth; a focused team can outship larger competitors who treat this as a feature, not a product
5. **Open source strategy fits** — builds credibility, attracts contributors, creates adoption flywheel

### MVP — Minimum to Validate

**Scope:** 6-8 week build, single developer (Jazz)

**MVP Features:**
1. YAML schema parser + validator
2. SQLite storage engine (auto-create tables from schema)
3. Rule engine with `before_create` and `before_update` hooks
4. AI tool generator → MCP tools (for OpenClaw/Claude Code integration)
5. `ai_permissions` enforcement (create/read/update field restrictions, no delete)
6. CLI: `ezybiz init`, `ezybiz validate`, `ezybiz generate-tools`, `ezybiz lock`
7. 1 template: `expenses`

**MVP Does NOT Include:**
- Web UI
- Postgres support (SQLite only)
- Owner approval workflow (CLI-only lock/unlock)
- Template marketplace
- Multi-user / multi-tenant
- GraphQL API

**Validation Criteria:**
- Jazz uses it for his own expenses tracking via OpenClaw (**dogfooding**)
- Schema changes by AI are blocked when locked
- Business rules prevent invalid data 100% of the time
- At least 3 indie developers try it and give feedback

### First Customer / Use Case

| Priority | Customer | Use Case | Why First |
|----------|----------|----------|-----------|
| 1 | **Jazz / OpenClaw** | Personal expenses tracker | Dogfood — immediate pain, immediate feedback |
| 2 | **Indie hackers building AI tools** | CRM, bookings, inventory | Loudest pain, most vocal community |
| 3 | **AI agent framework developers** | Data layer for agents | Integration partnerships (LangChain, CrewAI) |
| 4 | **Startups shipping AI-native products** | Any structured business data | Willingness to pay for reliability |

### Strategy: Open Source Core + Cloud Service

| Component | Strategy | Rationale |
|-----------|----------|-----------|
| **Schema format** | Open standard (CC-BY) | Encourage adoption, prevent lock-in |
| **Core engine** (parser, rules, tool gen) | Open source (MIT) | Build trust, attract contributors |
| **CLI tools** | Open source (MIT) | Lower barrier to adoption |
| **Templates** | Open source (community) | Network effect |
| **Cloud hosting** | Commercial (SaaS) | Revenue — managed EzyBusiness instances |
| **Team features** | Commercial | Multi-user, approval workflows, audit logs |
| **Enterprise** | Commercial | SSO, compliance, SLAs |

**Why open source core:**
- Solo devs won't pay for a schema tool — they need to try it for free
- Open source builds trust for a platform that *controls your data layer*
- Contributors will build templates and integrations faster than a solo team
- The commercial layer (hosting + team features) is a natural upsell

### Naming and Positioning

**Name:** EzyBusiness (confirmed — domain-friendly, memorable)

**Taglines (options):**
- "Schema is law. AI is operator."
- "Deterministic business logic for non-deterministic AI."
- "The business layer your AI agents need."
- "Define once. Enforce always. Let AI operate."

**Category:** AI-native business application framework

**Comparable positioning:**
- "Prisma for AI agents" (schema definition)
- "Supabase with guardrails" (backend + rules)
- "Rails for AI-native apps" (convention over configuration)

---

## 12. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **LLM providers add schema enforcement natively** | Medium | High | Move fast; build community; focus on business-level rules (not just type validation) — providers will do format, not business logic |
| **Supabase adds AI-specific permissions** | Medium | Medium | They'll add features, not build the full schema-as-law paradigm; stay ahead on governance |
| **Adoption is slow** | Medium | Medium | Dogfood relentlessly; publish content showing real pain + solution; target AI Twitter/HN |
| **Schema format is too rigid** | Low | High | Support escape hatches (custom validators, raw SQL rules); iterate on format with community |
| **Competing open source project emerges** | Low | Medium | First-mover advantage; focus on templates + integrations, not just the engine |
| **Jazz spreads too thin** | High | High | MVP-only mindset; don't build the cloud service until core is validated |

---

## 13. Recommendation

### Build It. Here's the Order.

**Phase 1: Core (Weeks 1-4)**
- [ ] YAML schema parser + validator (TypeScript)
- [ ] SQLite storage engine (auto-create tables)
- [ ] Rule engine (before/after hooks)
- [ ] AI tool generator (MCP format for OpenClaw)
- [ ] CLI: `ezybiz init`, `ezybiz validate`, `ezybiz serve`

**Phase 2: Governance (Weeks 5-6)**
- [ ] `ai_permissions` enforcement layer
- [ ] Lock/unlock mechanism
- [ ] Schema versioning

**Phase 3: Dogfood (Weeks 7-8)**
- [ ] Replace OpenClaw expenses manager with EzyBusiness schema
- [ ] Expenses template (pre-built)
- [ ] Integration test: Claude agent → EzyBusiness → SQLite
- [ ] Write blog post: "Why Your AI Agent Needs a Schema Layer"

**Phase 4: Launch (Weeks 9-12)**
- [ ] Open source on GitHub
- [ ] 3 more templates (CRM, bookings, inventory)
- [ ] Documentation site
- [ ] Post on Hacker News, AI Twitter, Reddit r/LocalLLaMA

**Decision Point:** After Phase 3, evaluate if the product has traction. If yes → build cloud service. If no → pivot the approach but keep the core engine.

---

## 14. Sources

### Market Research
- [Agents At Work: The 2026 Playbook for Building Reliable Agentic Workflows](https://promptengineering.org/agents-at-work-the-2026-playbook-for-building-reliable-agentic-workflows/)
- [AI Agent Guardrails: Production Guide for 2026](https://authoritypartners.com/insights/ai-agent-guardrails-production-guide-for-2026/)
- [7 Agentic AI Trends to Watch in 2026](https://machinelearningmastery.com/7-agentic-ai-trends-to-watch-in-2026/)
- [Agentic Workflows in 2026: The Ultimate Guide](https://www.vellum.ai/blog/agentic-workflows-emerging-architectures-and-design-patterns)
- [The 2026 Guide to Agentic Workflow Architectures](https://www.stackai.com/blog/the-2026-guide-to-agentic-workflow-architectures)
- [Guardrails and Best Practices for Agentic Orchestration (Camunda)](https://camunda.com/blog/2026/01/guardrails-and-best-practices-for-agentic-orchestration/)

### Problem Validation
- [Why Agentic Applications Need Deterministic Foundations (CockroachDB)](https://www.cockroachlabs.com/blog/agentic-applications-deterministic-foundations/)
- [Deterministic AI Architecture: Why It Matters in 2025 (Kubiya)](https://www.kubiya.ai/blog/deterministic-ai-architecture)
- [10 Major Agentic AI Challenges and How to Fix Them (Sendbird)](https://sendbird.com/blog/agentic-ai-challenges)
- [Ensuring Reliability in AI Agents: Overcoming Drift and Inconsistencies](https://medium.com/@kuldeep.paul08/ensuring-reliability-in-ai-agents-overcoming-drift-and-inconsistencies-ed878c57155e)
- [4 Frameworks to Test Non-Deterministic AI Agent Behavior](https://datagrid.com/blog/4-frameworks-test-non-deterministic-ai-agents)
- [Agentic AI vs Deterministic Code](https://cantechit.com/2025/09/03/agentic-ai-vs-deterministic-code/)

### Schema & Structured Outputs
- [The Guide to Structured Outputs and Function Calling with LLMs](https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms)
- [How JSON Schema Works for LLM Tools & Structured Outputs](https://blog.promptlayer.com/how-json-schema-works-for-structured-outputs-and-tool-integration/)
- [LLM Structured Outputs: Schema Validation for Real Pipelines](https://collinwilkins.com/articles/structured-output)
- [Structured Output in LangChain: Building Reliable AI Systems](https://medium.com/@manasabehera5901/structured-output-in-langchain-building-reliable-ai-systems-for-regulated-environments-65af3b3ab751)

### Competitor Analysis
- [Supabase AI Integrations](https://supabase.com/features/ai-integrations)
- [Announcing Instant Prisma Postgres for AI Coding Agents](https://www.prisma.io/blog/announcing-prisma-postgres-for-ai-coding-agents)
- [Headless CMS Comparison 2026: Strapi vs Directus vs Payload](https://dasroot.net/posts/2026/01/headless-cms-comparison-strapi-directus-payload/)
- [Superagent: Open-source Framework for Guardrails Around Agentic AI](https://www.helpnetsecurity.com/2025/12/29/superagent-framework-guardrails-agentic-ai/)
- [Composio: AI Agent Integration Platform](https://composio.dev/)
- [Airtable AI Automation Frustrations](https://techresolve.blog/2025/12/23/airtable-ai-automation-frustrations/)

### AI Agent Permissions & Access Control
- [Introducing Role-Based Access Control for AI Agents (Sendbird)](https://sendbird.com/blog/ai-agent-role-based-access-control)
- [Access Control in the Era of AI Agents (Auth0)](https://auth0.com/blog/access-control-in-the-era-of-ai-agents/)
- [AI Agent Access Control: How to Manage Permissions Safely (WorkOS)](https://workos.com/blog/ai-agent-access-control)
- [Why RBAC is Not Enough for AI Agents (Oso)](https://www.osohq.com/learn/why-rbac-is-not-enough-for-ai-agents)

---

*Report generated 2026-03-17 by Jazz Tong + AI Research Assistant*
*Project: EzyBusiness | Organization: Anchor Sprint*
