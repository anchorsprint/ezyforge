# EzyForge MVP 1.0 — Refined Scope

**Goal:** A developer's AI agent can create an EzyForge account, init an app from a template, publish it with owner approval, and then operate the app (save + query data) through MCP.

**One sentence:** Agent sets it up. Owner approves. Agent operates it.

**Timeline:** 4 weeks
**Team:** 1-2 developers

---

## The MVP Flow (6 steps)

```
Step 1: Agent creates account
        Agent calls EzyForge API → account created → API key returned

Step 2: Agent inits app from template
        Agent calls API with template name → schema provisioned
        → database created → MCP endpoint + tools ready (draft mode)

Step 3: Owner reviews & approves
        Owner receives approval request (email OTP link)
        → opens review page → sees schema, entities, rules, AI permissions
        → clicks [Approve & Publish]

Step 4: App is live
        Schema locked → MCP endpoint active → AI token issued

Step 5: Agent operates the app
        Agent connects via MCP → discovers tools
        → creates records, queries data, updates allowed fields
        → rules enforced, permissions checked on every operation

Step 6: Owner monitors
        Owner can view data + AI activity via simple web page
```

---

## Features (only what's needed for this flow)

### 1. Account Management (API-first)

| Feature | Description |
|---|---|
| Create account via API | Agent sends email → EzyForge sends OTP → agent relays code → account created |
| API key management | Account gets an API key for agent to manage apps |

No web signup form. Agent initiates everything.

---

### 2. App Provisioning

| Feature | Description |
|---|---|
| Init app from template | `POST /api/apps { template: "expenses" }` → app created in draft mode |
| Templates: Expenses | Pre-built schema: expense entity (amount, currency, category, merchant, date, notes) |
| Draft mode | App exists but MCP is not active until owner approves |

---

### 3. Owner Approval Flow

| Feature | Description |
|---|---|
| Approval notification | Email sent to owner with OTP link to review page |
| Review page | Simple web page showing: schema summary, entities, fields, rules, AI permissions |
| Approve & Publish | Owner clicks approve → schema locks → MCP goes live → AI token generated |
| Reject | Owner rejects → app stays in draft, agent is notified |

This is the ONLY web UI in MVP 1.0. One page. Approve or reject.

---

### 4. Schema Engine

| Feature | Description |
|---|---|
| YAML parser | Parse template schema into validated object |
| Field types | string, integer, decimal, boolean, date, datetime, uuid, enum |
| Field constraints | required, default, min, max, min_length, max_length |
| Business rules | before_create/before_update hooks with FEEL-like conditions |
| Rule actions | reject (block operation with error message) |
| AI permissions | create/read/update/delete per entity, field-level update restriction |
| Schema lock | Once published, schema cannot be modified |

Expressions in 1.0: `<`, `<=`, `>`, `>=`, `==`, `!=`, `AND`, `OR`, `NOT`, `today()`, `now()`, `is null`, `is not null`

---

### 5. MCP Server

| Feature | Description |
|---|---|
| Per-app MCP endpoint | `mcp://app-id.ezyforge.io` — goes live after approval |
| Auto-generated tools | create, read, list, update (based on AI permissions) |
| No tool for denied ops | delete: false → no delete tool exists |
| List with filters | Filter by field values, sort, limit |
| Aggregation | sum, count, avg with group_by |

---

### 6. Tool Execution Runtime

| Feature | Description |
|---|---|
| Permission check | First gate — is this operation allowed for AI? |
| Field validation | Types, constraints, required fields |
| Rule evaluation | Run before-hooks, reject if condition fails |
| Database write | Insert/update/read from Postgres |
| Structured errors | `{ error: "rule_violation", rule: "no_future_dates", message: "..." }` |

---

### 7. Data Storage

| Feature | Description |
|---|---|
| Postgres per app | Isolated database (Neon serverless) |
| Auto-create tables | Tables created from schema on app provisioning |
| Encrypted at rest | Provider-managed |

---

### 8. Owner View (minimal web)

| Feature | Description |
|---|---|
| Data viewer | Simple table showing records |
| AI activity log | Every MCP call: tool, input, result, timestamp |
| Auth | Email OTP (same as approval flow) |

No schema editor. No token management UI. No dashboard charts. Just: see your data + see what AI did.

---

## Explicitly NOT in 1.0

| Feature | Why not | When |
|---|---|---|
| Web signup / onboarding UI | Agent handles signup | 1.1 |
| Schema editor | Templates only in 1.0, no custom schemas yet | 1.1 |
| Token management UI | One token auto-generated on publish | 1.1 |
| REST API | MCP is enough for 1.0 | 1.1 |
| Multiple templates | Expenses only | 1.1 |
| Custom roles | Owner + AI only | 1.1 |
| Schema proposals (AI-initiated) | Manual schema changes not in 1.0 | 1.1 |
| `forge` CLI | API-first, no CLI needed | 1.1 |
| Billing | Free tier only | 1.1 |
| Multi-user / teams | Single owner | 1.2 |
| Relationships between entities | Not needed for expenses | 1.2 |
| Workflows / state machines | Not needed for expenses | 1.2 |

---

## The Dogfood Test

MVP 1.0 passes when Jazz does this end-to-end:

```
1. ✅ Jazz tells OpenClaw: "Create me an expenses app on EzyForge"
2. ✅ OpenClaw calls EzyForge API → account created → app initiated from expenses template
3. ✅ Jazz receives email: "Review your new app — Personal Expenses"
4. ✅ Jazz opens link → sees schema (expense entity, rules, AI permissions)
5. ✅ Jazz clicks [Approve & Publish]
6. ✅ OpenClaw receives MCP endpoint + token → connects
7. ✅ "Log lunch at McDonald's RM 15" → expense created
8. ✅ "How much did I spend on food?" → correct sum returned
9. ✅ "Delete that expense" → refused (no tool)
10. ✅ "Change the amount to 0" → rejected (not in allowed_fields)
11. ✅ "Log dinner for next Friday" → rejected (future date rule)
12. ✅ Jazz opens ezyforge.io → sees expenses + AI activity log
```

12 steps. All must pass.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Platform API | Hono (Node.js) |
| Auth | Supabase Auth (email OTP) |
| MCP Server | @modelcontextprotocol/sdk |
| Engine | TypeScript (parser, rules, permissions, tools) |
| Platform DB | Supabase Postgres (accounts, apps, schemas) |
| App DB | Neon serverless Postgres (user data, 1 per app) |
| Owner pages | Next.js (approval page + data viewer — 2 pages only) |
| Hosting | Vercel (pages) + Railway (API + MCP) |
| Email | Resend (approval notifications) |

---

## Build Order

```
Week 1: Engine
├── YAML parser + validator
├── Rule engine (conditions + hooks)
├── Permission layer
├── Tool generator (MCP format)
├── Tool execution runtime
└── Neon Postgres adapter

Week 2: Platform
├── Account creation API (email OTP via Supabase)
├── App provisioning API (init from template + draft mode)
├── Approval flow (email notification + review page)
├── Publish flow (lock schema, activate MCP, issue token)
├── MCP server hosting (per app)
└── Expenses template

Week 3: Owner view + integration
├── Approval review page (schema summary)
├── Data viewer page (table view)
├── AI activity log page
├── Connect OpenClaw as test agent
└── End-to-end testing

Week 4: Dogfood + fix
├── Jazz runs all 12 dogfood steps
├── Fix bugs
├── Polish error messages
├── Harden MCP server
└── Deploy to production
```

---

*MVP 1.0 — agent sets it up, owner approves, agent operates. 4 weeks. 12-step validation.*
