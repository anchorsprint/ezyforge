# EzyForge — Business Schema Object Model

> A complete business app defined in YAML. No code. No UI. 10 objects.

---

## The 10 Schema Objects

### 1. Entities — the nouns
What the business tracks. Tables with typed fields and constraints.

```yaml
entities:
  expense:
    fields:
      id:       { type: uuid, generated: true }
      amount:   { type: decimal, required: true, min: 0.01 }
      merchant: { type: string, required: true, max_length: 100 }
```

### 2. Relationships — how nouns connect
Foreign keys, ownership, and cardinality.

```yaml
relationships:
  invoice:
    belongs_to: customer
    has_many: line_items
```

### 3. Rules — what's valid
Deterministic constraints enforced on every write. Before/after hooks.

```yaml
rules:
  - name: no_future_dates
    entity: expense
    when: before_create, before_update
    condition: "date <= today()"
    error: "Date cannot be in the future"
```

### 4. Permissions — who can do what
CRUD + field-level access per role.

```yaml
permissions:
  ai:
    expense: { create: true, read: true, update: [notes, category], delete: false }
  owner:
    expense: { create: true, read: true, update: all, delete: true }
```

### 5. Views — how to see data
Named queries with business meaning. Each generates an MCP tool.

```yaml
views:
  this_month_spending:
    entity: expense
    filter: "date >= start_of_month()"
    group_by: category
    aggregate: { field: amount, function: sum }
```

### 6. Actions — what you can DO
Business operations beyond CRUD. Multi-step, validated, atomic.

```yaml
actions:
  close_month:
    description: "Lock all expenses for the month"
    input: { month: { type: string, required: true } }
    steps:
      - validate: "all expenses in month have category"
      - update: { entity: expense, filter: "month(date) == $month", set: { locked: true } }
      - return: { view: this_month_spending }
    allowed_roles: [owner]
```

### 7. Workflows — lifecycle of things
State machines with valid transitions and role-based triggers.

```yaml
workflows:
  invoice_lifecycle:
    entity: invoice
    field: status
    states: [draft, sent, paid, cancelled]
    transitions:
      - from: draft  to: sent   by: [owner, ai]
      - from: sent   to: paid   by: [owner, ai]
      - from: sent   to: cancelled by: [owner]
```

### 8. Computed — derived values
Auto-calculated fields with dependency tracking.

```yaml
computed:
  invoice:
    subtotal: "sum(line_items.total)"
    tax: "subtotal * 0.06"
    grand_total: "subtotal + tax"
```

### 9. Automations — when X happens, do Y
Event-driven triggers. Reactive, not polling.

```yaml
automations:
  flag_big_expense:
    trigger: "expense.created AND expense.amount > 5000"
    action: tag
    config: { tag: "needs-review" }
```

### 10. Notifications — how to alert
Channels and templates for system communication.

```yaml
notifications:
  channels:
    owner: { type: webhook, url: "$WEBHOOK_URL" }
  templates:
    big_expense:
      message: "Large expense: {amount} at {merchant}"
```

---

## How Objects Map to MCP Tools

| Object | Tools Generated |
|---|---|
| Entity | `create_X`, `get_X`, `list_X`, `update_X` (per permissions) |
| View | `get_[view_name]()` — no params needed |
| Action | `[action_name]({ inputs })` — validated, multi-step |
| Workflow | `transition_X({ id, to_state })` — enforced transitions |
| Computed | Included in entity read responses — not separate tools |
| Automations | No tools — runs automatically on triggers |
| Notifications | No tools — triggered by automations or actions |

---

## MVP Priority

| Object | P1 (MVP) | P2 | P3 |
|---|---|---|---|
| Entities | ✅ | | |
| Rules | ✅ | | |
| Permissions | ✅ | | |
| Views | ✅ | | |
| Relationships | | ✅ | |
| Computed | | ✅ | |
| Actions | | ✅ | |
| Workflows | | ✅ | |
| Automations | | | ✅ |
| Notifications | | | ✅ |
