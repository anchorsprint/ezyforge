# EzyForge MVP 1.0 — Feature Scope

**Goal:** One user (Jazz) signs up, creates an expenses app from template, connects OpenClaw via MCP, and operates it daily. Everything works. Nothing breaks.

**Timeline:** 4 weeks
**Team:** 1-2 developers

---

## What MVP 1.0 IS

A cloud platform where a user connects their AI agent to a schema-enforced business app via MCP.

## What MVP 1.0 IS NOT

- Not a CLI tool
- Not self-hosted
- Not multi-user/team
- Not a marketplace
- Not enterprise

---

## Features

### 1. Auth & Account

| Feature | Description | Done when |
|---|---|---|
| **Sign up / Login** | Email + password or OAuth (Google) | User can create account and log in |
| **Account dashboard** | List of user's apps | User sees all their apps after login |

Tech: Clerk or Supabase Auth

---

### 2. App Management

| Feature | Description | Done when |
|---|---|---|
| **Create app from template** | User picks a template → app is provisioned | App has: schema, database, MCP endpoint, tokens |
| **Templates: Expenses** | Pre-built personal expenses schema | Entities: expense (amount, currency, category, merchant, date, notes) + budget |
| **App detail page** | Shows: MCP URL, API tokens, schema, status | User can copy MCP URL and token |
| **Delete app** | User can delete their app and all data | Clean teardown |

---

### 3. Schema Engine (Core)

| Feature | Description | Done when |
|---|---|---|
| **YAML parser + validator** | Parse schema, reject invalid schemas with clear errors | All field types, constraints, rules, permissions validated |
| **Supported field types** | string, integer, decimal, boolean, date, datetime, uuid, enum, url, text | All types map correctly to Postgres columns |
| **Field constraints** | required, optional, default, min, max, min_length, max_length, pattern, precision | Constraints enforced at validation and write time |
| **Generated fields** | id (uuid), created_at, updated_at with auto values | Auto-populated, not user-supplied |
| **Schema lock / unlock** | locked: true prevents schema modification | Locked schema rejects all change attempts |

---

### 4. Rule Engine

| Feature | Description | Done when |
|---|---|---|
| **Lifecycle hooks** | before_create, before_update, after_create, after_update | Rules run at correct hook points |
| **Condition evaluator** | FEEL-inspired: comparisons, AND/OR/NOT, today(), now() | `date <= today()` works correctly |
| **Actions** | reject (block operation), warn (allow with warning) | Rule violation returns structured error |
| **Unique constraints** | Single and composite field uniqueness | Duplicate detection works |

Expressions supported in 1.0:
- Comparisons: `<`, `<=`, `>`, `>=`, `==`, `!=`
- Boolean: `AND`, `OR`, `NOT`
- Functions: `today()`, `now()`
- Null: `is null`, `is not null`

NOT in 1.0: arithmetic, string functions, IN operator, cross-entity rules.

---

### 5. Permission Layer

| Feature | Description | Done when |
|---|---|---|
| **AI permissions per entity** | create, read, update, delete: true/false | CRUD gating works |
| **Field-level update restriction** | `update: { allowed_fields: [notes, category] }` | AI can only update listed fields |
| **No tool generation for denied ops** | delete: false → no delete tool exists | AI literally cannot discover the operation |
| **Two roles** | owner (full access), ai (restricted per schema) | Role determined by token type |

---

### 6. AI Integration (MCP)

| Feature | Description | Done when |
|---|---|---|
| **MCP server per app** | Always-on MCP endpoint | AI agent connects and discovers tools |
| **Auto-generated tools from schema** | create, read, list, update (per permissions) | Tools match schema exactly |
| **Tool descriptions from schema** | Field descriptions included in tool definitions | AI understands what each field means |
| **List with filters** | Filter by field values, sort, pagination | `list_expenses({ category: "food", limit: 20 })` works |
| **Aggregation tools** | sum, count, avg with group_by | `summarize_expenses({ aggregation: "sum", group_by: "category" })` works |

---

### 7. REST API

| Feature | Description | Done when |
|---|---|---|
| **CRUD endpoints per entity** | POST, GET, GET/:id, PATCH, DELETE | Standard REST operations |
| **Same enforcement pipeline** | Permissions → validation → rules → DB | REST and MCP have identical enforcement |
| **Token auth** | Bearer token in header | Scoped to app, role-aware |

---

### 8. Token Management

| Feature | Description | Done when |
|---|---|---|
| **Create AI token** | Scoped to one app, role = ai | Token enforces AI permissions |
| **Create owner token** | Scoped to one app, role = owner | Full access |
| **Revoke token** | Instantly disable a token | Revoked token gets rejected |
| **View active tokens** | List all tokens for an app | User sees who has access |

---

### 9. Data Storage

| Feature | Description | Done when |
|---|---|---|
| **Postgres per app** | Isolated database (Neon or Turso) | Each app's data is fully separated |
| **Auto-create tables** | Tables created from schema on app creation | No manual SQL needed |
| **Encrypted at rest** | Provider-managed encryption | Standard security |

---

### 10. Dashboard (Minimal)

| Feature | Description | Done when |
|---|---|---|
| **View data** | Table view of entity records | User can see all their expenses |
| **AI activity log** | Every MCP/REST call logged: tool, input, result, timestamp | User can see what AI did |
| **Rule violation log** | Every blocked operation logged | User can see what AI tried and was rejected |

NOT in 1.0: edit data via dashboard, charts, analytics, export.

---

### 11. Schema Editor (Minimal)

| Feature | Description | Done when |
|---|---|---|
| **View schema** | Display current YAML schema in browser | Read-only view |
| **Edit schema** | Edit YAML in Monaco editor, validate, deploy | User can add a field and redeploy |
| **Lock / unlock** | Toggle lock from dashboard | Lock button works |

NOT in 1.0: visual drag-and-drop editor, AI-assisted schema creation.

---

## Explicitly NOT in 1.0

| Feature | Why not | When |
|---|---|---|
| Multi-user / team | Complexity. Single owner per app is enough to validate. | 1.1 |
| Custom roles | Owner + AI is enough for 1.0 | 1.1 |
| Schema proposals (AI-initiated) | Requires approval workflow. Manual edit is fine for 1.0. | 1.1 |
| Workflows / state machines | Not needed for expenses | 1.2 |
| Entity relationships | Not needed for expenses (expense + budget are independent) | 1.1 |
| Template marketplace | One template (expenses) is enough | 1.2 |
| Import (Prisma, CSV, Postgres) | Not needed for new users | 1.2 |
| Export (data download) | Nice to have, not critical for validation | 1.1 |
| Custom domains | `your-app.ezyforge.io` is fine | 2.0 |
| Billing / payments | Free tier only for 1.0 | 1.1 |
| `forge` CLI | Web UI + MCP is enough | 1.1 |
| Notifications (email/push) | Not needed for solo user | 1.1 |
| Zero-knowledge encryption | Enterprise feature | 2.0+ |

---

## The Dogfood Test

MVP 1.0 passes when Jazz can do ALL of this:

```
1. ✅ Sign up at ezyforge.io
2. ✅ Create "My Expenses" from expenses template
3. ✅ Copy MCP URL + AI token
4. ✅ Add to OpenClaw config
5. ✅ "Log lunch at McDonald's RM 15" → expense created
6. ✅ "How much did I spend on food this month?" → correct sum returned
7. ✅ "Delete that expense" → refused (no delete tool)
8. ✅ "Change the amount to 0" → rejected (amount not in allowed_fields)
9. ✅ "Log dinner for next Friday" → rejected (future date rule)
10. ✅ Open dashboard → see all expenses + AI activity log
11. ✅ Add "payment_method" field via schema editor → redeploy
12. ✅ "Log coffee RM 8, paid by e-wallet" → works with new field
13. ✅ Lock schema → AI cannot change anything about the structure
```

---

## Tech Stack (1.0)

| Layer | Tech |
|---|---|
| **Frontend** | Next.js 15 + Tailwind + shadcn |
| **Auth** | Clerk |
| **Platform API** | Hono (on Node.js) |
| **Engine** | TypeScript (parser, rules, permissions, tools) |
| **MCP Server** | @modelcontextprotocol/sdk |
| **Database (platform)** | Supabase Postgres (users, apps, schemas, tokens) |
| **Database (user apps)** | Neon (serverless Postgres, one DB per app) |
| **Hosting** | Vercel (frontend) + Railway or Fly.io (engine + MCP) |
| **Monitoring** | Basic logging to start |

---

## Build Order

```
Week 1: Engine core
├── YAML parser + validator
├── Rule engine (conditions + hooks)
├── Permission layer
├── Tool generator (MCP format)
├── Tool execution runtime
└── Postgres adapter (auto-create tables)

Week 2: Cloud platform
├── Auth (Clerk)
├── App creation from template
├── Token management (create, revoke)
├── MCP server hosting (per app)
├── REST API endpoints
└── Expenses template

Week 3: Dashboard + polish
├── App detail page (MCP URL, tokens)
├── Data viewer (table view)
├── AI activity log
├── Schema viewer + editor (Monaco)
├── Lock / unlock

Week 4: Dogfood + fix
├── Jazz connects OpenClaw
├── Run all 13 dogfood tests
├── Fix bugs
├── Polish error messages
└── Deploy to production
```

---

*MVP 1.0 — ship in 4 weeks, validate with 1 user (Jazz), then open to early adopters.*
