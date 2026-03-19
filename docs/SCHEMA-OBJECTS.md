# EzyForge — Business Schema Object Model

> Schema defines business logic. Functions are the only AI interface.
> Everything else is internal implementation.

---

## Architecture

```
┌─────────────────────────────────────┐
│         YAML Schema                  │
│                                      │
│  Internal (business owner defines):  │
│    entities    rules    permissions   │
│    computed    automations            │
│                                      │
│  External (AI calls):                │
│    functions ← THE ONLY MCP tools    │
│                                      │
└──────────────┬───────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         MCP Tools                    │
│                                      │
│  log_expense()                       │
│  show_this_month()                   │
│  mark_reimbursed()                   │
│  budget_status()                     │
│                                      │
│  AI sees ONLY functions.             │
│  No entities. No CRUD. No SQL.       │
└─────────────────────────────────────┘
```

---

## Schema Objects

### Internal Objects (business logic, AI never sees these directly)

**1. Entities** — what data exists
```yaml
entities:
  expense:
    fields:
      id:       { uuid, auto }
      amount:   { decimal, req, min: 0.01 }
      merchant: { str, req, max: 100 }
```

**2. Rules** — what's valid
```yaml
rules:
  - no_future_dates: { on: expense, when: create|update, if: "date <= today()", err: "No future dates" }
```

**3. Permissions** — who can do what (enforced per function)
```yaml
permissions:
  ai:
    expense: { c: true, r: true, u: [notes, category], d: false }
  owner:
    expense: { c, r, u, d }
```

**4. Computed** — derived values
```yaml
computed:
  budget:
    spent: "sum(expense, category == self.category AND date >= som(), amount)"
    remaining: "limit - spent"
```

**5. Automations** — when X happens, do Y
```yaml
automations:
  budget_warning: { on: expense.created, if: "budget.pct_used >= 80", notify: "⚠️ {category} at {pct_used}%" }
```

---

### External Object (the ONLY thing AI touches)

**6. Functions** — what AI can call via MCP

Functions are the **sole interface** between AI and the business app. Each function becomes one MCP tool. AI never sees entities, rules, or permissions directly — only functions.

```yaml
functions:

  # Auto-generate basic CRUD functions from entities + permissions
  auto: true

  # Custom functions (override auto or add new)
  custom:
    log_expense:
      desc: "Record a new expense"
      input:
        amount:   { decimal, req }
        currency: { enum: [MYR, SGD, USD], default: MYR }
        category: { enum: [food, transport, housing, ...], req }
        merchant: { str, req }
        date:     { date, req }
        notes:    { text }
        payment:  { enum: [cash, card, e_wallet, transfer] }
      does: create(expense)

    show_this_month:
      desc: "Spending breakdown for current month"
      does: query(expense, filter: "date >= som()", group: category, agg: sum(amount))

    mark_reimbursed:
      desc: "Mark an expense as reimbursed"
      input:
        id:            { uuid, req }
        reimbursed_by: { str, req }
      does:
        - update(expense, id: $id, set: { reimbursed: true, reimbursed_by: $reimbursed_by })

    budget_status:
      desc: "Show all budgets with current spend"
      does: query(budget, include: [spent, remaining, pct_used])
```

### How `auto: true` works

When `auto: true`, EzyForge generates default functions from entities + permissions:

| Entity + Permission | Generated Function | Tool Name |
|---|---|---|
| expense + create: true | Create an expense | `create_expense` |
| expense + read: true | Get expense by ID | `get_expense` |
| expense + read: true | List expenses with filters | `list_expenses` |
| expense + update: [notes, category] | Update allowed fields | `update_expense` |
| expense + delete: false | *(nothing generated)* | — |

Custom functions **override** auto-generated ones with the same entity. If you define `log_expense` with `does: create(expense)`, it replaces the auto-generated `create_expense`.

### Function operations

| Operation | What it does |
|---|---|
| `create(entity)` | Insert a new record |
| `update(entity, id, set)` | Update fields on a record |
| `delete(entity, id)` | Delete a record |
| `query(entity, filter, sort, limit)` | Query with filters |
| `query(entity, group, agg)` | Aggregate query |
| `query(entity, include: [computed])` | Include computed fields |

---

## System Entities (provided by platform — zero config)

Every app gets these automatically. Business owner never defines them.

| System Entity | What it does | AI can access? |
|---|---|---|
| `_audit_log` | Every data operation with old/new values | Read only (via system function) |
| `_access_log` | Every connection — who, when, from where | Console only |
| `_schema_history` | Every schema version for rollback | Console only |
| `_proposals` | AI schema change proposals | Via propose function |
| `_tokens` | API/MCP token management | Console only |
| `_app_meta` | App status and config | Console only |

System functions (auto-provided, not in schema):

```
get_audit_log()      ← AI can review its own activity
propose_change()     ← AI can propose schema changes
get_schema()         ← AI can read current schema
```

---

## Design Principles

**1. Business logic only — no UI concerns**
- No multi-select widgets, file uploads, form layouts
- If you need tags → model as separate entity with relationship

**2. Functions are the only AI interface**
- AI never sees entities, SQL, or CRUD operations
- Functions use business language: `log_expense` not `create_expense`
- Each function = one MCP tool

**3. Internal objects are invisible to AI**
- Entities, rules, permissions → enforced silently
- AI calls `log_expense` → engine checks permissions, validates, runs rules, writes to DB
- AI only sees: success or structured error

**4. Auto-generate + override**
- `auto: true` gives sensible defaults
- Custom functions override or extend
- Business owner controls exactly what AI can do

---

## Short Syntax Reference

| Verbose | Short |
|---|---|
| `type: string` | `str` |
| `type: decimal` | `decimal` |
| `type: boolean` | `bool` |
| `type: integer` | `int` |
| `type: text` | `text` |
| `required: true` | `req` |
| `generated: true, auto: now` | `auto` |
| `max_length: 100` | `max: 100` |
| `description` | `desc` |
| `create: true, read: true, ...` | `c, r, u, d` |
| `start_of_month()` | `som()` |
| `sort: amount_desc` | `sort: -amount` |
| `aggregate: sum` | `agg: sum(field)` |

---

## MVP Priority

| Object | P1 (MVP) | P2 | P3 |
|---|---|---|---|
| Entities | ✅ | | |
| Rules | ✅ | | |
| Permissions | ✅ | | |
| Functions (auto + custom) | ✅ | | |
| System entities | ✅ | | |
| Relationships | | ✅ | |
| Computed | | ✅ | |
| Workflows (state machines) | | ✅ | |
| Automations | | | ✅ |
| Notifications | | | ✅ |
