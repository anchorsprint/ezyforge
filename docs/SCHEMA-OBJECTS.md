# EzyForge — Business Schema Object Model

> A complete business app defined in YAML. No code. No UI. Business logic only.
> Schema defines what the business does, not what the screen looks like.

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

---

## Design Principle: Business Logic Only

The schema defines **what the business does**, not UI concerns.

**IN scope (business logic):**
- Entities, fields, types, constraints
- Business rules and validation
- Permissions and access control
- Queries and aggregations
- Business operations
- State machines
- Computed values
- Automated triggers

**OUT of scope (UI/storage concerns):**
- Multi-select / tag widgets → model as a separate entity with relationship
- File uploads / attachments → handled by platform storage, not schema
- Form layouts / field ordering → not business logic
- Drag-and-drop / sorting → UI concern
- Color coding / icons → UI concern

---

## System Entities (provided by platform)

Every app gets these automatically. The business owner never defines them. They just exist.

```yaml
# These are NOT in the user's schema — EzyForge provides them for every app.

system_entities:

  _audit_log:
    description: "Every data operation recorded automatically"
    fields:
      id:          { type: uuid, generated: true }
      timestamp:   { type: datetime, auto: now }
      actor:       { type: string }          # token ID or "owner" or "system"
      actor_role:  { type: enum, values: [owner, ai, system] }
      entity:      { type: string }          # which entity was affected
      record_id:   { type: uuid }            # which record
      operation:   { type: enum, values: [create, read, update, delete] }
      fields_changed: { type: text }         # JSON of what changed
      old_values:  { type: text }            # JSON of previous values
      new_values:  { type: text }            # JSON of new values
      status:      { type: enum, values: [success, rejected, error] }
      rejection_reason: { type: text }       # rule name + error if rejected
    notes: "Immutable. AI cannot modify or delete audit records."

  _access_log:
    description: "Every API/MCP connection and tool discovery"
    fields:
      id:          { type: uuid, generated: true }
      timestamp:   { type: datetime, auto: now }
      token_id:    { type: uuid }
      ip_address:  { type: string }
      action:      { type: enum, values: [connect, discover_tools, disconnect] }
      user_agent:  { type: string }
    notes: "Tracks who connected, when, from where."

  _schema_history:
    description: "Every schema version stored"
    fields:
      id:          { type: uuid, generated: true }
      version:     { type: string }          # semver
      schema_yaml: { type: text }            # full YAML snapshot
      changed_by:  { type: enum, values: [owner, ai_proposal] }
      change_summary: { type: text }
      created_at:  { type: datetime, auto: now }
    notes: "Immutable. Complete schema history for rollback."

  _proposals:
    description: "AI-proposed schema changes awaiting approval"
    fields:
      id:          { type: uuid, generated: true }
      proposed_by: { type: uuid }            # token ID
      changes:     { type: text }            # JSON of proposed changes
      reason:      { type: text }
      status:      { type: enum, values: [pending, approved, rejected] }
      reviewed_at: { type: datetime }
      created_at:  { type: datetime, auto: now }

  _tokens:
    description: "API/MCP tokens and their permissions"
    fields:
      id:          { type: uuid, generated: true }
      name:        { type: string }          # "OpenClaw", "Claude Desktop"
      role:        { type: enum, values: [owner, ai] }
      token_hash:  { type: string }          # hashed, never stored plain
      last_used:   { type: datetime }
      active:      { type: boolean, default: true }
      created_at:  { type: datetime, auto: now }
      revoked_at:  { type: datetime }
    notes: "First token auto-created on publish. Additional tokens via console."

  _app_meta:
    description: "App configuration and status"
    fields:
      id:          { type: uuid, generated: true }
      name:        { type: string }
      template:    { type: string }
      status:      { type: enum, values: [draft, published, locked, suspended] }
      schema_version: { type: string }
      owner_email: { type: string }
      created_at:  { type: datetime, auto: now }
      published_at: { type: datetime }
      locked_at:   { type: datetime }
```

### What System Entities Give You for Free

| System Entity | What it does | Business owner action needed |
|---|---|---|
| `_audit_log` | Records every create/update/delete with old/new values | None — automatic |
| `_access_log` | Records every connection and tool discovery | None — automatic |
| `_schema_history` | Stores every schema version for rollback | None — automatic |
| `_proposals` | Manages AI schema change proposals | Owner reviews in console |
| `_tokens` | Manages API/MCP tokens | Owner manages in console |
| `_app_meta` | App status, config, deployment info | None — automatic |

**The business owner writes ZERO lines for audit, access logging, schema history, or token management.** It all comes free with every app.

---

## MVP Priority

| Object | P1 (MVP) | P2 | P3 |
|---|---|---|---|
| Entities | ✅ | | |
| Rules | ✅ | | |
| Permissions | ✅ | | |
| Views | ✅ | | |
| System Entities | ✅ | | |
| Relationships | | ✅ | |
| Computed | | ✅ | |
| Actions | | ✅ | |
| Workflows | | ✅ | |
| Automations | | | ✅ |
| Notifications | | | ✅ |
