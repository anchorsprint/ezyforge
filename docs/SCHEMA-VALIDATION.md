# EzyForge — Schema Object Model Validation

> 3 realistic business apps stress-testing all 10 schema objects.
> Goal: find gaps, awkwardness, and missing primitives before building.

---

## Use Case 1: Personal Expenses App

A solo user (Jazz) tracks daily expenses via AI agent across multiple currencies, categories, payment methods, and budgets.

### Complete YAML Schema

```yaml
app:
  name: personal-expenses
  description: "Personal expense tracker with budgets, receipts, and multi-currency support"
  version: 1

# ─────────────────────────────────────────────
# 1. ENTITIES — the nouns
# ─────────────────────────────────────────────
entities:
  expense:
    fields:
      id:            { type: uuid, generated: true }
      amount:        { type: decimal, required: true, min: 0.01 }
      currency:      { type: enum, values: [MYR, SGD, USD, EUR, GBP, JPY, THB], default: MYR, required: true }
      amount_myr:    { type: decimal, description: "Amount converted to MYR for reporting" }
      merchant:      { type: string, required: true, max_length: 200 }
      description:   { type: string, max_length: 500 }
      date:          { type: date, required: true }
      category_id:   { type: uuid, required: true }
      subcategory:   { type: string, max_length: 100 }
      payment_method_id: { type: uuid, required: true }
      receipt_url:   { type: string, max_length: 500 }
      receipt_notes: { type: string, max_length: 500 }
      is_reimbursable: { type: boolean, default: false }
      reimbursement_status: { type: enum, values: [pending, submitted, approved, paid, rejected], default: pending }
      reimbursed_date: { type: date }
      tags:          { type: string, max_length: 200, description: "Comma-separated tags" }
      notes:         { type: string, max_length: 1000 }
      locked:        { type: boolean, default: false }
      created_at:    { type: datetime, auto: now }
      updated_at:    { type: datetime, auto: now_on_update }

  category:
    fields:
      id:            { type: uuid, generated: true }
      name:          { type: string, required: true, max_length: 50 }
      icon:          { type: string, max_length: 10 }
      color:         { type: string, max_length: 7, pattern: "^#[0-9a-fA-F]{6}$" }
      is_active:     { type: boolean, default: true }
      sort_order:    { type: integer, default: 0 }
      created_at:    { type: datetime, auto: now }

  payment_method:
    fields:
      id:            { type: uuid, generated: true }
      name:          { type: string, required: true, max_length: 50 }
      type:          { type: enum, values: [cash, credit_card, debit_card, e_wallet, bank_transfer, other], required: true }
      last_four:     { type: string, max_length: 4, description: "Last 4 digits of card" }
      is_active:     { type: boolean, default: true }
      created_at:    { type: datetime, auto: now }

  budget:
    fields:
      id:            { type: uuid, generated: true }
      category_id:   { type: uuid, required: true }
      month:         { type: string, required: true, pattern: "^\\d{4}-\\d{2}$", description: "YYYY-MM format" }
      amount:        { type: decimal, required: true, min: 0 }
      currency:      { type: enum, values: [MYR, SGD, USD], default: MYR }
      notes:         { type: string, max_length: 200 }
      created_at:    { type: datetime, auto: now }
      updated_at:    { type: datetime, auto: now_on_update }

  exchange_rate:
    fields:
      id:            { type: uuid, generated: true }
      from_currency: { type: enum, values: [MYR, SGD, USD, EUR, GBP, JPY, THB], required: true }
      to_currency:   { type: enum, values: [MYR], required: true }
      rate:          { type: decimal, required: true, min: 0.0001 }
      effective_date: { type: date, required: true }
      created_at:    { type: datetime, auto: now }

# ─────────────────────────────────────────────
# 2. RELATIONSHIPS — how nouns connect
# ─────────────────────────────────────────────
relationships:
  expense:
    belongs_to: [category, payment_method]
  budget:
    belongs_to: category
  # Note: exchange_rate is a lookup table, no direct FK from expense

# ─────────────────────────────────────────────
# 3. RULES — what's valid
# ─────────────────────────────────────────────
rules:
  - name: no_future_dates
    entity: expense
    when: before_create, before_update
    condition: "date <= today()"
    error: "Expense date cannot be in the future"

  - name: no_edit_locked_expense
    entity: expense
    when: before_update
    condition: "locked == false"
    error: "Cannot edit a locked expense"

  - name: positive_amount
    entity: expense
    when: before_create, before_update
    condition: "amount > 0"
    error: "Amount must be greater than zero"

  - name: reimbursed_date_requires_paid_status
    entity: expense
    when: before_update
    condition: "reimbursement_status == 'paid' OR reimbursed_date == null"
    error: "Reimbursed date can only be set when status is 'paid'"

  - name: unique_budget_per_category_month
    entity: budget
    when: before_create
    condition: "not exists(budget, category_id == $category_id AND month == $month)"
    error: "Budget already exists for this category and month"

  - name: valid_exchange_rate
    entity: exchange_rate
    when: before_create, before_update
    condition: "rate > 0"
    error: "Exchange rate must be positive"

# ─────────────────────────────────────────────
# 4. PERMISSIONS — who can do what
# ─────────────────────────────────────────────
permissions:
  ai:
    expense:
      create: true
      read: true
      update: [notes, description, category_id, subcategory, tags, receipt_notes, is_reimbursable]
      delete: false
    category:
      create: true
      read: true
      update: [name, icon, color, sort_order]
      delete: false
    payment_method:
      create: true
      read: true
      update: [name]
      delete: false
    budget:
      create: true
      read: true
      update: [amount, notes]
      delete: false
    exchange_rate:
      create: true
      read: true
      update: [rate]
      delete: false

  owner:
    expense:       { create: true, read: true, update: all, delete: true }
    category:      { create: true, read: true, update: all, delete: true }
    payment_method: { create: true, read: true, update: all, delete: true }
    budget:        { create: true, read: true, update: all, delete: true }
    exchange_rate: { create: true, read: true, update: all, delete: true }

# ─────────────────────────────────────────────
# 5. VIEWS — how to see data
# ─────────────────────────────────────────────
views:
  this_month_spending:
    description: "Total spending by category this month"
    entity: expense
    filter: "month(date) == month(today()) AND year(date) == year(today())"
    group_by: category_id
    aggregate: { field: amount_myr, function: sum }
    sort: { field: _aggregate, order: desc }
    include: [category.name]

  this_month_by_payment_method:
    description: "Spending breakdown by payment method this month"
    entity: expense
    filter: "month(date) == month(today()) AND year(date) == year(today())"
    group_by: payment_method_id
    aggregate: { field: amount_myr, function: sum }
    include: [payment_method.name, payment_method.type]

  daily_spending_trend:
    description: "Daily spending totals for the current month"
    entity: expense
    filter: "month(date) == month(today()) AND year(date) == year(today())"
    group_by: date
    aggregate: { field: amount_myr, function: sum }
    sort: { field: date, order: asc }

  top_merchants:
    description: "Top 10 merchants by total spending"
    entity: expense
    group_by: merchant
    aggregate: { field: amount_myr, function: sum }
    sort: { field: _aggregate, order: desc }
    limit: 10

  recent_expenses:
    description: "Last 20 expenses"
    entity: expense
    sort: { field: date, order: desc }
    limit: 20
    include: [category.name, payment_method.name]

  budget_vs_actual:
    description: "Budget vs actual spending for current month"
    entity: budget
    filter: "month == format_date(today(), 'YYYY-MM')"
    include: [category.name]
    # NOTE: This needs a way to join with aggregated expense data
    # This exposes a limitation — views can't easily do cross-entity aggregation

  pending_reimbursements:
    description: "Expenses marked as reimbursable but not yet paid"
    entity: expense
    filter: "is_reimbursable == true AND reimbursement_status IN ['pending', 'submitted', 'approved']"
    sort: { field: date, order: asc }
    include: [category.name]

  monthly_summary:
    description: "Month-over-month spending totals"
    entity: expense
    group_by: "format_date(date, 'YYYY-MM')"
    aggregate: { field: amount_myr, function: sum }
    sort: { field: _group, order: desc }
    limit: 12

# ─────────────────────────────────────────────
# 6. ACTIONS — what you can DO
# ─────────────────────────────────────────────
actions:
  close_month:
    description: "Lock all expenses for a given month to prevent further editing"
    input:
      month: { type: string, required: true, pattern: "^\\d{4}-\\d{2}$" }
    steps:
      - validate: "all expenses where format_date(date, 'YYYY-MM') == $month have category_id != null"
      - update: { entity: expense, filter: "format_date(date, 'YYYY-MM') == $month", set: { locked: true } }
      - return: { message: "Month {$month} locked. {count} expenses finalized." }
    allowed_roles: [owner]

  submit_reimbursement:
    description: "Submit all pending reimbursable expenses for approval"
    input:
      expense_ids: { type: array, items: { type: uuid }, required: true }
    steps:
      - validate: "all expenses in $expense_ids have is_reimbursable == true AND reimbursement_status == 'pending'"
      - update: { entity: expense, filter: "id IN $expense_ids", set: { reimbursement_status: submitted } }
      - return: { message: "{count} expenses submitted for reimbursement." }
    allowed_roles: [owner, ai]

  set_exchange_rates:
    description: "Batch update exchange rates for today"
    input:
      rates: { type: array, items: { type: object, fields: { from_currency: string, rate: decimal } }, required: true }
    steps:
      - foreach: $rates
        create: { entity: exchange_rate, set: { from_currency: "$item.from_currency", to_currency: MYR, rate: "$item.rate", effective_date: "today()" } }
      - return: { message: "{count} exchange rates updated." }
    allowed_roles: [owner, ai]

  duplicate_expense:
    description: "Create a copy of an existing expense with today's date"
    input:
      expense_id: { type: uuid, required: true }
    steps:
      - read: { entity: expense, id: "$expense_id", as: source }
      - create:
          entity: expense
          set:
            amount: "$source.amount"
            currency: "$source.currency"
            merchant: "$source.merchant"
            category_id: "$source.category_id"
            payment_method_id: "$source.payment_method_id"
            date: "today()"
            description: "Copy of expense from {$source.date}"
      - return: { message: "Expense duplicated with today's date." }
    allowed_roles: [owner, ai]

# ─────────────────────────────────────────────
# 7. WORKFLOWS — lifecycle of things
# ─────────────────────────────────────────────
workflows:
  reimbursement_lifecycle:
    entity: expense
    field: reimbursement_status
    states: [pending, submitted, approved, paid, rejected]
    transitions:
      - from: pending    to: submitted  by: [owner, ai]
      - from: submitted  to: approved   by: [owner]
      - from: submitted  to: rejected   by: [owner]
      - from: approved   to: paid       by: [owner]
      - from: rejected   to: pending    by: [owner]
    on_enter:
      paid: { set: { reimbursed_date: "today()" } }

# ─────────────────────────────────────────────
# 8. COMPUTED — derived values
# ─────────────────────────────────────────────
computed:
  expense:
    amount_myr: "amount * lookup(exchange_rate, from_currency == currency AND to_currency == 'MYR', rate, default: 1.0)"
    month_key: "format_date(date, 'YYYY-MM')"

  budget:
    spent: "sum(expense, category_id == $category_id AND format_date(date, 'YYYY-MM') == $month, amount_myr)"
    remaining: "amount - spent"
    utilization_pct: "round(spent / amount * 100, 1)"

# ─────────────────────────────────────────────
# 9. AUTOMATIONS — when X happens, do Y
# ─────────────────────────────────────────────
automations:
  flag_large_expense:
    trigger: "expense.created AND expense.amount_myr > 500"
    action: tag
    config: { tag: "large-expense" }

  budget_warning_80pct:
    trigger: "expense.created AND budget.utilization_pct > 80"
    action: notify
    config: { template: budget_warning }

  budget_exceeded:
    trigger: "expense.created AND budget.utilization_pct > 100"
    action: notify
    config: { template: budget_exceeded }

  auto_categorize_recurring:
    trigger: "expense.created AND exists(expense, merchant == $merchant AND category_id != null, limit: 3)"
    action: set_field
    config:
      entity: expense
      field: category_id
      value: "most_recent(expense, merchant == $merchant, category_id)"

# ─────────────────────────────────────────────
# 10. NOTIFICATIONS — how to alert
# ─────────────────────────────────────────────
notifications:
  channels:
    owner:
      type: webhook
      url: "$WEBHOOK_URL"

  templates:
    budget_warning:
      message: "⚠️ Budget alert: {category.name} is at {budget.utilization_pct}% ({budget.spent}/{budget.amount} {budget.currency})"
      severity: warning

    budget_exceeded:
      message: "🚨 Budget exceeded: {category.name} at {budget.utilization_pct}% — over by {abs(budget.remaining)} {budget.currency}"
      severity: critical

    large_expense:
      message: "Large expense logged: {expense.amount} {expense.currency} at {expense.merchant}"
      severity: info
```

### MCP Tools Generated

**Entity CRUD (per permissions for `ai` role):**
| Tool | Description |
|------|-------------|
| `create_expense(...)` | Create an expense (all fields except amount/date/currency locked after create) |
| `get_expense(id)` | Read single expense |
| `list_expenses(filter?, sort?, limit?)` | List expenses with optional filtering |
| `update_expense(id, {notes, description, category_id, subcategory, tags, receipt_notes, is_reimbursable})` | Update allowed fields only |
| `create_category(...)` | Create a spending category |
| `get_category(id)` | Read category |
| `list_categories()` | List all categories |
| `update_category(id, {name, icon, color, sort_order})` | Update category details |
| `create_payment_method(...)` | Create payment method |
| `get_payment_method(id)` | Read payment method |
| `list_payment_methods()` | List payment methods |
| `update_payment_method(id, {name})` | Update name only |
| `create_budget(...)` | Create monthly budget |
| `get_budget(id)` | Read budget |
| `list_budgets(filter?)` | List budgets |
| `update_budget(id, {amount, notes})` | Update budget amount |
| `create_exchange_rate(...)` | Add exchange rate |
| `get_exchange_rate(id)` | Read rate |
| `list_exchange_rates()` | List rates |
| `update_exchange_rate(id, {rate})` | Update rate |

**View Tools:**
| Tool | Description |
|------|-------------|
| `get_this_month_spending()` | Category breakdown for current month |
| `get_this_month_by_payment_method()` | Payment method breakdown |
| `get_daily_spending_trend()` | Daily totals this month |
| `get_top_merchants()` | Top 10 merchants by spend |
| `get_recent_expenses()` | Last 20 expenses |
| `get_budget_vs_actual()` | Budget utilization this month |
| `get_pending_reimbursements()` | Outstanding reimbursements |
| `get_monthly_summary()` | 12-month trend |

**Action Tools:**
| Tool | Description |
|------|-------------|
| `close_month({month})` | Lock expenses for a month (owner only) |
| `submit_reimbursement({expense_ids})` | Submit expenses for reimbursement |
| `set_exchange_rates({rates})` | Batch update exchange rates |
| `duplicate_expense({expense_id})` | Copy expense with today's date |

**Workflow Tools:**
| Tool | Description |
|------|-------------|
| `transition_expense_reimbursement({id, to_state})` | Move reimbursement through lifecycle |

**Total: 29 tools** (20 CRUD + 8 views + 4 actions + 1 workflow transition — minus delete tools = 24 for AI role)

### Critique

**What worked well:**
- Entity definitions are clean and readable. Field types + constraints cover 95% of what's needed.
- Rules are expressive enough for date validation, locked-record protection, and basic uniqueness.
- Permissions elegantly prevent AI from touching amount/date/currency — the core safety guarantee.
- Views give the AI rich reporting capability without raw SQL.
- The reimbursement workflow is a natural fit for the state machine model.
- Automations for budget warnings feel right — reactive, not polling.

**What felt awkward:**
- **Tags as comma-separated string** is a hack. Real apps need array/list field types or a many-to-many relationship to a `tag` entity. The current model has no `type: array`.
- **Budget vs. actual view** needs cross-entity aggregation (join budget with sum of expenses). The view object only references one entity. This is a significant gap for any reporting use case.
- **Computed fields referencing other entities** (`budget.spent` queries `expense`) — the syntax `sum(expense, ...)` is powerful but implies cross-entity queries in computed fields. Is this actually supported? The spec shows `sum(line_items.total)` which implies traversing relationships, not arbitrary entity queries.
- **Exchange rate lookup in computed** — `lookup(exchange_rate, ...)` is a function I invented because the spec doesn't define one. Real currency conversion needs some kind of lookup/join mechanism.
- **Auto-categorization automation** — `most_recent()` and the conditional `exists()` with limit are functions I needed but aren't in the spec. The automation trigger language needs more power.
- **No array/list field type** — can't model tags, multiple receipt URLs, or split expenses.
- **No `type: url`** — receipt_url is just a string. URL validation would be useful.
- **`auto: now_on_update`** — I invented this for `updated_at`. The spec only shows `auto: now`.

**What's missing:**
1. **Array field type** — tags, multi-value fields
2. **Cross-entity views** — joins, subqueries, or multi-entity aggregation
3. **Lookup/reference functions** in computed fields and rules
4. **Parameterized views** — "show me spending for 2024-02" not just "this month". Views are currently zero-parameter.
5. **`auto: now_on_update`** for updated_at timestamps
6. **Pagination controls** — limit exists but no offset/cursor
7. **Currency/money field type** — amount + currency as a compound type
8. **Soft delete** — `deleted_at` pattern is common but not first-class

**Suggested improvements:**
- Add `type: array` with `items` definition
- Add parameterized views: `input: { month: { type: string } }` with `filter: "month(date) == $month"`
- Add cross-entity aggregation syntax in views
- Add `auto: now_on_update` for timestamp fields
- Consider a `type: money` compound type (amount + currency)

---

## Use Case 2: Small Team CRM

A 3-person sales team (owner + 2 reps) manages contacts, companies, deals, and activities. AI agent logs interactions, manages follow-ups, and reports on pipeline.

### Complete YAML Schema

```yaml
app:
  name: team-crm
  description: "Small team CRM with contacts, deals, pipeline management, and AI-assisted follow-ups"
  version: 1

# ─────────────────────────────────────────────
# 1. ENTITIES
# ─────────────────────────────────────────────
entities:
  company:
    fields:
      id:            { type: uuid, generated: true }
      name:          { type: string, required: true, max_length: 200 }
      industry:      { type: enum, values: [technology, manufacturing, retail, services, finance, healthcare, logistics, education, other] }
      website:       { type: string, max_length: 500 }
      phone:         { type: string, max_length: 20 }
      email:         { type: string, max_length: 200 }
      address:       { type: string, max_length: 500 }
      city:          { type: string, max_length: 100 }
      country:       { type: string, max_length: 100, default: "Malaysia" }
      employee_count: { type: enum, values: [1-10, 11-50, 51-200, 201-500, 500+] }
      notes:         { type: string, max_length: 2000 }
      source:        { type: enum, values: [referral, website, cold_outreach, event, social_media, inbound, other] }
      assigned_to:   { type: string, max_length: 100, description: "Sales rep name or email" }
      created_at:    { type: datetime, auto: now }
      updated_at:    { type: datetime, auto: now_on_update }

  contact:
    fields:
      id:            { type: uuid, generated: true }
      first_name:    { type: string, required: true, max_length: 100 }
      last_name:     { type: string, required: true, max_length: 100 }
      email:         { type: string, max_length: 200 }
      phone:         { type: string, max_length: 20 }
      whatsapp:      { type: string, max_length: 20 }
      job_title:     { type: string, max_length: 100 }
      company_id:    { type: uuid }
      is_decision_maker: { type: boolean, default: false }
      lead_score:    { type: integer, min: 0, max: 100, default: 0 }
      lead_status:   { type: enum, values: [new, contacted, qualified, unqualified, nurturing], default: new }
      tags:          { type: string, max_length: 200 }
      notes:         { type: string, max_length: 2000 }
      last_contacted: { type: date }
      assigned_to:   { type: string, max_length: 100 }
      created_at:    { type: datetime, auto: now }
      updated_at:    { type: datetime, auto: now_on_update }

  deal:
    fields:
      id:            { type: uuid, generated: true }
      title:         { type: string, required: true, max_length: 200 }
      value:         { type: decimal, min: 0 }
      currency:      { type: enum, values: [MYR, SGD, USD], default: MYR }
      stage:         { type: enum, values: [lead, qualified, proposal, negotiation, won, lost], default: lead }
      probability:   { type: integer, min: 0, max: 100, description: "Win probability percentage" }
      contact_id:    { type: uuid, required: true }
      company_id:    { type: uuid }
      assigned_to:   { type: string, max_length: 100, required: true }
      source:        { type: enum, values: [referral, website, cold_outreach, event, social_media, inbound, partner, other] }
      expected_close_date: { type: date }
      actual_close_date:   { type: date }
      lost_reason:   { type: enum, values: [price, competitor, no_budget, no_need, timing, no_response, other] }
      lost_notes:    { type: string, max_length: 500 }
      notes:         { type: string, max_length: 2000 }
      created_at:    { type: datetime, auto: now }
      updated_at:    { type: datetime, auto: now_on_update }

  activity:
    fields:
      id:            { type: uuid, generated: true }
      type:          { type: enum, values: [call, email, meeting, whatsapp, note, task], required: true }
      subject:       { type: string, required: true, max_length: 200 }
      description:   { type: string, max_length: 2000 }
      contact_id:    { type: uuid }
      deal_id:       { type: uuid }
      company_id:    { type: uuid }
      performed_by:  { type: string, max_length: 100, required: true }
      activity_date: { type: datetime, required: true }
      duration_mins: { type: integer, min: 0 }
      outcome:       { type: enum, values: [positive, neutral, negative, no_answer] }
      next_action:   { type: string, max_length: 500 }
      next_action_date: { type: date }
      created_at:    { type: datetime, auto: now }

  follow_up:
    fields:
      id:            { type: uuid, generated: true }
      contact_id:    { type: uuid, required: true }
      deal_id:       { type: uuid }
      assigned_to:   { type: string, max_length: 100, required: true }
      due_date:      { type: date, required: true }
      priority:      { type: enum, values: [low, medium, high, urgent], default: medium }
      type:          { type: enum, values: [call, email, meeting, whatsapp, other], required: true }
      subject:       { type: string, required: true, max_length: 200 }
      notes:         { type: string, max_length: 1000 }
      status:        { type: enum, values: [pending, completed, cancelled, overdue], default: pending }
      completed_date: { type: date }
      created_at:    { type: datetime, auto: now }
      updated_at:    { type: datetime, auto: now_on_update }

# ─────────────────────────────────────────────
# 2. RELATIONSHIPS
# ─────────────────────────────────────────────
relationships:
  contact:
    belongs_to: company
    has_many: [activities, follow_ups, deals]
  deal:
    belongs_to: [contact, company]
    has_many: activities
  activity:
    belongs_to: [contact, deal, company]
  follow_up:
    belongs_to: [contact, deal]

# ─────────────────────────────────────────────
# 3. RULES
# ─────────────────────────────────────────────
rules:
  - name: deal_value_required_for_proposal
    entity: deal
    when: before_update
    condition: "stage IN ['proposal', 'negotiation', 'won'] IMPLIES value != null AND value > 0"
    error: "Deal value is required once it reaches proposal stage"

  - name: lost_reason_required
    entity: deal
    when: before_update
    condition: "stage == 'lost' IMPLIES lost_reason != null"
    error: "Lost reason is required when marking a deal as lost"

  - name: actual_close_date_on_won_lost
    entity: deal
    when: before_update
    condition: "stage IN ['won', 'lost'] IMPLIES actual_close_date != null"
    error: "Actual close date must be set when deal is won or lost"

  - name: no_edit_won_lost_deals
    entity: deal
    when: before_update
    condition: "NOT (old.stage IN ['won', 'lost'] AND stage != old.stage)"
    error: "Cannot change the stage of a won or lost deal — reopen first"
    # NOTE: This needs access to old.stage (previous value). The spec doesn't define this.

  - name: follow_up_due_date_not_past
    entity: follow_up
    when: before_create
    condition: "due_date >= today()"
    error: "Follow-up due date cannot be in the past"

  - name: activity_date_not_future
    entity: activity
    when: before_create
    condition: "activity_date <= now()"
    error: "Cannot log an activity in the future"

  - name: contact_requires_email_or_phone
    entity: contact
    when: before_create, before_update
    condition: "email != null OR phone != null OR whatsapp != null"
    error: "Contact must have at least one contact method (email, phone, or WhatsApp)"

# ─────────────────────────────────────────────
# 4. PERMISSIONS
# ─────────────────────────────────────────────
permissions:
  ai:
    company:
      create: true
      read: true
      update: [notes, phone, email, website, assigned_to]
      delete: false
    contact:
      create: true
      read: true
      update: [notes, phone, whatsapp, email, job_title, lead_status, lead_score, last_contacted, tags, assigned_to]
      delete: false
    deal:
      create: true
      read: true
      update: [notes, stage, probability, expected_close_date, value]
      delete: false
    activity:
      create: true
      read: true
      update: [description, outcome, next_action, next_action_date]
      delete: false
    follow_up:
      create: true
      read: true
      update: [notes, due_date, priority, status, completed_date]
      delete: false

  sales_rep:
    company:
      create: true
      read: true
      update: all
      delete: false
    contact:
      create: true
      read: true
      update: all
      delete: false
    deal:
      create: true
      read: true
      update: all
      delete: false
    activity:
      create: true
      read: true
      update: all
      delete: false
    follow_up:
      create: true
      read: true
      update: all
      delete: true

  owner:
    company:   { create: true, read: true, update: all, delete: true }
    contact:   { create: true, read: true, update: all, delete: true }
    deal:      { create: true, read: true, update: all, delete: true }
    activity:  { create: true, read: true, update: all, delete: true }
    follow_up: { create: true, read: true, update: all, delete: true }

# ─────────────────────────────────────────────
# 5. VIEWS
# ─────────────────────────────────────────────
views:
  pipeline_overview:
    description: "Deal count and total value by pipeline stage"
    entity: deal
    filter: "stage NOT IN ['won', 'lost']"
    group_by: stage
    aggregate:
      - { field: value, function: sum, as: total_value }
      - { field: id, function: count, as: deal_count }

  pipeline_by_rep:
    description: "Active pipeline value per sales rep"
    entity: deal
    filter: "stage NOT IN ['won', 'lost']"
    group_by: assigned_to
    aggregate:
      - { field: value, function: sum, as: total_value }
      - { field: id, function: count, as: deal_count }

  won_this_month:
    description: "Deals won this month"
    entity: deal
    filter: "stage == 'won' AND month(actual_close_date) == month(today()) AND year(actual_close_date) == year(today())"
    sort: { field: actual_close_date, order: desc }
    include: [contact.first_name, contact.last_name, company.name]

  lost_this_month:
    description: "Deals lost this month with reasons"
    entity: deal
    filter: "stage == 'lost' AND month(actual_close_date) == month(today()) AND year(actual_close_date) == year(today())"
    sort: { field: actual_close_date, order: desc }
    include: [contact.first_name, company.name]

  overdue_follow_ups:
    description: "Follow-ups past their due date"
    entity: follow_up
    filter: "status == 'pending' AND due_date < today()"
    sort: { field: due_date, order: asc }
    include: [contact.first_name, contact.last_name, deal.title]

  today_follow_ups:
    description: "Follow-ups due today"
    entity: follow_up
    filter: "status == 'pending' AND due_date == today()"
    sort: { field: priority, order: desc }
    include: [contact.first_name, contact.last_name, deal.title]

  upcoming_follow_ups:
    description: "Follow-ups due in the next 7 days"
    entity: follow_up
    filter: "status == 'pending' AND due_date >= today() AND due_date <= date_add(today(), 7, 'days')"
    sort: { field: due_date, order: asc }
    include: [contact.first_name, contact.last_name, deal.title]

  stale_deals:
    description: "Deals with no activity in the last 14 days"
    entity: deal
    filter: "stage NOT IN ['won', 'lost'] AND updated_at < date_add(now(), -14, 'days')"
    sort: { field: updated_at, order: asc }
    include: [contact.first_name, company.name]

  hot_leads:
    description: "Contacts with lead score above 70"
    entity: contact
    filter: "lead_score >= 70 AND lead_status IN ['new', 'contacted', 'qualified']"
    sort: { field: lead_score, order: desc }
    include: [company.name]

  recent_activities:
    description: "Last 30 activities across all contacts"
    entity: activity
    sort: { field: activity_date, order: desc }
    limit: 30
    include: [contact.first_name, contact.last_name, deal.title]

  monthly_win_rate:
    description: "Win/loss ratio by month"
    entity: deal
    filter: "stage IN ['won', 'lost'] AND actual_close_date != null"
    group_by: "format_date(actual_close_date, 'YYYY-MM')"
    aggregate:
      - { field: id, function: count, as: total_closed }
      # NOTE: Cannot compute win_rate = count(won) / count(total) in a single aggregate
      # This exposes a limitation — no conditional aggregation

# ─────────────────────────────────────────────
# 6. ACTIONS
# ─────────────────────────────────────────────
actions:
  log_interaction:
    description: "Log a call/email/meeting and optionally create a follow-up"
    input:
      contact_id:    { type: uuid, required: true }
      deal_id:       { type: uuid }
      type:          { type: enum, values: [call, email, meeting, whatsapp], required: true }
      subject:       { type: string, required: true }
      description:   { type: string }
      outcome:       { type: enum, values: [positive, neutral, negative, no_answer] }
      duration_mins: { type: integer }
      follow_up_date: { type: date, description: "If set, creates a follow-up task" }
      follow_up_type: { type: enum, values: [call, email, meeting, whatsapp] }
      follow_up_subject: { type: string }
    steps:
      - create:
          entity: activity
          set:
            contact_id: "$contact_id"
            deal_id: "$deal_id"
            type: "$type"
            subject: "$subject"
            description: "$description"
            outcome: "$outcome"
            duration_mins: "$duration_mins"
            performed_by: "$current_user"
            activity_date: "now()"
      - update:
          entity: contact
          id: "$contact_id"
          set: { last_contacted: "today()" }
      - conditional:
          if: "$follow_up_date != null"
          then:
            create:
              entity: follow_up
              set:
                contact_id: "$contact_id"
                deal_id: "$deal_id"
                assigned_to: "$current_user"
                due_date: "$follow_up_date"
                type: "$follow_up_type || $type"
                subject: "$follow_up_subject || 'Follow up on: ' + $subject"
      - return: { message: "Activity logged. {follow_up_date ? 'Follow-up scheduled for ' + follow_up_date : ''}" }
    allowed_roles: [owner, sales_rep, ai]

  qualify_lead:
    description: "Qualify a contact and optionally create a deal"
    input:
      contact_id:      { type: uuid, required: true }
      qualified:       { type: boolean, required: true }
      score_adjustment: { type: integer, min: -50, max: 50 }
      notes:           { type: string }
      create_deal:     { type: boolean, default: false }
      deal_title:      { type: string }
      deal_value:      { type: decimal }
    steps:
      - update:
          entity: contact
          id: "$contact_id"
          set:
            lead_status: "$qualified ? 'qualified' : 'unqualified'"
            lead_score: "lead_score + ($score_adjustment || 0)"
            notes: "$notes ? notes + '\\n' + $notes : $notes"
      - conditional:
          if: "$create_deal AND $qualified"
          then:
            create:
              entity: deal
              set:
                title: "$deal_title || contact.first_name + ' ' + contact.last_name + ' — New Deal'"
                contact_id: "$contact_id"
                company_id: "contact.company_id"
                value: "$deal_value"
                stage: "qualified"
                assigned_to: "contact.assigned_to"
      - return: { message: "Contact {qualified ? 'qualified' : 'disqualified'}. {create_deal ? 'Deal created.' : ''}" }
    allowed_roles: [owner, sales_rep, ai]

  close_deal:
    description: "Mark a deal as won or lost with required metadata"
    input:
      deal_id:     { type: uuid, required: true }
      outcome:     { type: enum, values: [won, lost], required: true }
      lost_reason: { type: enum, values: [price, competitor, no_budget, no_need, timing, no_response, other] }
      notes:       { type: string }
    steps:
      - validate: "$outcome == 'lost' IMPLIES $lost_reason != null"
      - update:
          entity: deal
          id: "$deal_id"
          set:
            stage: "$outcome"
            actual_close_date: "today()"
            lost_reason: "$lost_reason"
            lost_notes: "$notes"
      - create:
          entity: activity
          set:
            deal_id: "$deal_id"
            contact_id: "deal.contact_id"
            type: "note"
            subject: "Deal {$outcome}: {deal.title}"
            description: "$notes"
            performed_by: "$current_user"
            activity_date: "now()"
      - return: { message: "Deal marked as {$outcome}. {$outcome == 'won' ? '🎉 Revenue: ' + deal.value + ' ' + deal.currency : ''}" }
    allowed_roles: [owner, sales_rep, ai]

  reassign_contacts:
    description: "Bulk reassign contacts and their deals to a different rep"
    input:
      from_rep:  { type: string, required: true }
      to_rep:    { type: string, required: true }
    steps:
      - update: { entity: contact, filter: "assigned_to == $from_rep", set: { assigned_to: "$to_rep" } }
      - update: { entity: deal, filter: "assigned_to == $from_rep AND stage NOT IN ['won', 'lost']", set: { assigned_to: "$to_rep" } }
      - update: { entity: follow_up, filter: "assigned_to == $from_rep AND status == 'pending'", set: { assigned_to: "$to_rep" } }
      - return: { message: "All active contacts, deals, and follow-ups reassigned from {$from_rep} to {$to_rep}." }
    allowed_roles: [owner]

# ─────────────────────────────────────────────
# 7. WORKFLOWS
# ─────────────────────────────────────────────
workflows:
  deal_pipeline:
    entity: deal
    field: stage
    states: [lead, qualified, proposal, negotiation, won, lost]
    transitions:
      - from: lead         to: qualified    by: [owner, sales_rep, ai]
      - from: lead         to: lost         by: [owner, sales_rep, ai]
      - from: qualified    to: proposal     by: [owner, sales_rep, ai]
      - from: qualified    to: lost         by: [owner, sales_rep, ai]
      - from: proposal     to: negotiation  by: [owner, sales_rep, ai]
      - from: proposal     to: lost         by: [owner, sales_rep, ai]
      - from: negotiation  to: won          by: [owner, sales_rep]
      - from: negotiation  to: lost         by: [owner, sales_rep]
      # NOTE: AI cannot close deals — only humans can mark won/lost at final stage
    on_enter:
      won:  { set: { actual_close_date: "today()" } }
      lost: { set: { actual_close_date: "today()" } }

  lead_qualification:
    entity: contact
    field: lead_status
    states: [new, contacted, qualified, unqualified, nurturing]
    transitions:
      - from: new          to: contacted     by: [owner, sales_rep, ai]
      - from: contacted    to: qualified     by: [owner, sales_rep, ai]
      - from: contacted    to: unqualified   by: [owner, sales_rep, ai]
      - from: contacted    to: nurturing     by: [owner, sales_rep, ai]
      - from: qualified    to: nurturing     by: [owner, sales_rep]
      - from: unqualified  to: nurturing     by: [owner, sales_rep]
      - from: nurturing    to: contacted     by: [owner, sales_rep, ai]

  follow_up_lifecycle:
    entity: follow_up
    field: status
    states: [pending, completed, cancelled, overdue]
    transitions:
      - from: pending    to: completed  by: [owner, sales_rep, ai]
      - from: pending    to: cancelled  by: [owner, sales_rep]
      - from: pending    to: overdue    by: [system]
      - from: overdue    to: completed  by: [owner, sales_rep, ai]
      - from: overdue    to: cancelled  by: [owner, sales_rep]
    # NOTE: "system" role for automated transitions — not defined in the spec

# ─────────────────────────────────────────────
# 8. COMPUTED
# ─────────────────────────────────────────────
computed:
  contact:
    full_name: "first_name + ' ' + last_name"
    days_since_contact: "date_diff(today(), last_contacted, 'days')"
    activity_count: "count(activity, contact_id == $id)"
    open_deal_count: "count(deal, contact_id == $id AND stage NOT IN ['won', 'lost'])"

  deal:
    weighted_value: "value * (probability / 100)"
    days_in_stage: "date_diff(today(), updated_at, 'days')"
    age_days: "date_diff(today(), created_at, 'days')"

  follow_up:
    is_overdue: "status == 'pending' AND due_date < today()"
    days_until_due: "date_diff(due_date, today(), 'days')"

# ─────────────────────────────────────────────
# 9. AUTOMATIONS
# ─────────────────────────────────────────────
automations:
  mark_follow_ups_overdue:
    trigger: "daily at 08:00"
    action: update
    config:
      entity: follow_up
      filter: "status == 'pending' AND due_date < today()"
      set: { status: overdue }
    # NOTE: "daily at 08:00" is a time-based trigger — the spec only shows event triggers

  auto_score_lead_on_activity:
    trigger: "activity.created"
    action: set_field
    config:
      entity: contact
      id: "$activity.contact_id"
      field: lead_score
      value: "min(contact.lead_score + 5, 100)"

  stale_deal_alert:
    trigger: "daily at 09:00"
    action: notify
    config:
      template: stale_deal_reminder
      filter: "deal.stage NOT IN ['won', 'lost'] AND deal.updated_at < date_add(now(), -7, 'days')"

  new_deal_notification:
    trigger: "deal.created AND deal.value > 10000"
    action: notify
    config: { template: high_value_deal }

  follow_up_reminder:
    trigger: "daily at 08:30"
    action: notify
    config:
      template: daily_follow_ups
      filter: "follow_up.status == 'pending' AND follow_up.due_date == today()"

# ─────────────────────────────────────────────
# 10. NOTIFICATIONS
# ─────────────────────────────────────────────
notifications:
  channels:
    owner:
      type: webhook
      url: "$OWNER_WEBHOOK_URL"
    sales_team:
      type: webhook
      url: "$TEAM_WEBHOOK_URL"

  templates:
    stale_deal_reminder:
      channel: sales_team
      message: "🔔 Stale deal: {deal.title} ({deal.stage}) — no activity for {deal.days_in_stage} days. Assigned to {deal.assigned_to}."
      severity: warning

    high_value_deal:
      channel: owner
      message: "💰 New high-value deal: {deal.title} — {deal.value} {deal.currency} from {contact.full_name}"
      severity: info

    daily_follow_ups:
      channel: sales_team
      message: "📋 You have {count} follow-ups due today. Top priority: {first.subject} with {first.contact.full_name}"
      severity: info

    deal_won:
      channel: sales_team
      message: "🎉 Deal won! {deal.title} — {deal.value} {deal.currency}. Closed by {deal.assigned_to}."
      severity: info
```

### MCP Tools Generated

**Entity CRUD (AI role):**
| Tool | Count |
|------|-------|
| `create_company`, `get_company`, `list_companies`, `update_company` | 4 |
| `create_contact`, `get_contact`, `list_contacts`, `update_contact` | 4 |
| `create_deal`, `get_deal`, `list_deals`, `update_deal` | 4 |
| `create_activity`, `get_activity`, `list_activities`, `update_activity` | 4 |
| `create_follow_up`, `get_follow_up`, `list_follow_ups`, `update_follow_up` | 4 |

**View Tools (11):**
`get_pipeline_overview`, `get_pipeline_by_rep`, `get_won_this_month`, `get_lost_this_month`, `get_overdue_follow_ups`, `get_today_follow_ups`, `get_upcoming_follow_ups`, `get_stale_deals`, `get_hot_leads`, `get_recent_activities`, `get_monthly_win_rate`

**Action Tools (4):**
`log_interaction`, `qualify_lead`, `close_deal`, `reassign_contacts`

**Workflow Tools (3):**
`transition_deal_stage`, `transition_contact_lead_status`, `transition_follow_up_status`

**Total: 38 tools** (20 CRUD + 11 views + 4 actions + 3 workflows)

### Critique

**What worked well:**
- The CRM maps naturally to the 10-object model. Entities, relationships, workflows, and views align with how sales teams actually work.
- Deal pipeline as a workflow with role-restricted transitions is exactly right — AI can move deals forward but only humans can close.
- Actions like `log_interaction` (multi-entity operation + conditional follow-up creation) show real power. This is the kind of operation that's painful in raw CRUD but natural as an action.
- The permission model letting AI update `stage` and `probability` but not `value` on deals is nuanced and correct.

**What felt awkward:**
- **`assigned_to` as a string** — in a real app, this would reference a user/team member entity. But EzyForge doesn't have a built-in user/team model for the app itself (distinct from platform auth). This is a significant gap for team apps.
- **`$current_user`** — actions reference the current user, but the spec doesn't define how the runtime knows who is executing. Platform needs a `$current_user` context variable.
- **`old.stage`** in rules — comparing previous vs. new values is essential for transition guards, but the spec doesn't define access to previous field values. The workflow object partially solves this, but rules also need it.
- **Time-based triggers** — `daily at 08:00` is a cron trigger, but the automation spec only shows event triggers (`expense.created`). CRMs need scheduled automations (mark overdue, send daily summaries).
- **`system` role in workflows** — automated transitions (pending → overdue) need a system/scheduled actor. Not defined.
- **Conditional aggregation** — win rate needs `count(won) / count(won + lost)`. The view aggregate model can't express conditional counts.
- **Notification routing** — `daily_follow_ups` should go to the specific rep, not a broadcast channel. Per-record notification routing isn't supported.
- **Multiple aggregates per view** — I used an array syntax `[{ field, function, as }]` but the spec only shows a single aggregate object.

**What's missing:**
1. **User/team member entity** — built-in concept for app users (not just platform users). `assigned_to` shouldn't be a freeform string.
2. **`$current_user` context** — who is executing this action/creating this record.
3. **`old.*` field access in rules** — compare previous value to new value.
4. **Time-based/cron triggers** in automations — daily jobs, hourly checks.
5. **Conditional aggregation** — `count_if`, `sum_if` in views.
6. **Per-record notification routing** — notify the assigned rep, not a broadcast channel.
7. **Multiple aggregate functions** per view.
8. **System/scheduled role** for automated transitions.
9. **Full-text search** — CRM needs to search across names, notes, descriptions.

**Suggested improvements:**
- Add a built-in `app_user` concept with `$current_user` context variable
- Add `old.*` syntax in rule conditions for previous-value comparisons
- Support cron triggers: `trigger: "schedule: daily at 08:00"`
- Support conditional aggregation: `{ field: id, function: count, where: "stage == 'won'", as: won_count }`
- Add per-entity notification routing: `notify: { role: "$record.assigned_to" }`

---

## Use Case 3: Invoice & Billing System

A freelancer or small business manages customers, invoices with line items, payments, tax, and overdue tracking. AI agent creates invoices, tracks payments, and alerts on overdue.

### Complete YAML Schema

```yaml
app:
  name: invoice-billing
  description: "Invoice and billing system with tax calculation, partial payments, and overdue tracking"
  version: 1

# ─────────────────────────────────────────────
# 1. ENTITIES
# ─────────────────────────────────────────────
entities:
  customer:
    fields:
      id:              { type: uuid, generated: true }
      name:            { type: string, required: true, max_length: 200 }
      company_name:    { type: string, max_length: 200 }
      email:           { type: string, required: true, max_length: 200 }
      phone:           { type: string, max_length: 20 }
      address_line1:   { type: string, max_length: 200 }
      address_line2:   { type: string, max_length: 200 }
      city:            { type: string, max_length: 100 }
      state:           { type: string, max_length: 100 }
      postcode:        { type: string, max_length: 10 }
      country:         { type: string, max_length: 100, default: "Malaysia" }
      tax_id:          { type: string, max_length: 50, description: "SST/GST registration number" }
      payment_terms_days: { type: integer, default: 30, min: 0, max: 365 }
      currency:        { type: enum, values: [MYR, SGD, USD], default: MYR }
      notes:           { type: string, max_length: 2000 }
      is_active:       { type: boolean, default: true }
      created_at:      { type: datetime, auto: now }
      updated_at:      { type: datetime, auto: now_on_update }

  invoice:
    fields:
      id:              { type: uuid, generated: true }
      invoice_number:  { type: string, required: true, max_length: 20, description: "Auto-generated: INV-YYYYMM-NNN" }
      customer_id:     { type: uuid, required: true }
      status:          { type: enum, values: [draft, sent, partially_paid, paid, overdue, cancelled, void], default: draft }
      issue_date:      { type: date, required: true }
      due_date:        { type: date, required: true }
      currency:        { type: enum, values: [MYR, SGD, USD], default: MYR }
      tax_rate:        { type: decimal, default: 0.08, min: 0, max: 1, description: "SST rate (e.g., 0.08 = 8%)" }
      discount_pct:    { type: decimal, default: 0, min: 0, max: 1, description: "Invoice-level discount" }
      notes:           { type: string, max_length: 2000 }
      terms:           { type: string, max_length: 2000, description: "Payment terms and conditions" }
      reference:       { type: string, max_length: 100, description: "PO number or reference" }
      sent_date:       { type: date }
      paid_date:       { type: date }
      cancelled_reason: { type: string, max_length: 500 }
      created_at:      { type: datetime, auto: now }
      updated_at:      { type: datetime, auto: now_on_update }

  line_item:
    fields:
      id:              { type: uuid, generated: true }
      invoice_id:      { type: uuid, required: true }
      description:     { type: string, required: true, max_length: 500 }
      quantity:        { type: decimal, required: true, min: 0.01 }
      unit_price:      { type: decimal, required: true, min: 0 }
      unit:            { type: string, max_length: 20, default: "unit", description: "e.g., hour, unit, day, kg" }
      tax_exempt:      { type: boolean, default: false, description: "Exempt this line from tax" }
      sort_order:      { type: integer, default: 0 }
      created_at:      { type: datetime, auto: now }

  payment:
    fields:
      id:              { type: uuid, generated: true }
      invoice_id:      { type: uuid, required: true }
      amount:          { type: decimal, required: true, min: 0.01 }
      currency:        { type: enum, values: [MYR, SGD, USD], default: MYR }
      payment_date:    { type: date, required: true }
      method:          { type: enum, values: [bank_transfer, cash, cheque, credit_card, e_wallet, paypal, other], required: true }
      reference:       { type: string, max_length: 100, description: "Transaction ID or cheque number" }
      notes:           { type: string, max_length: 500 }
      created_at:      { type: datetime, auto: now }

  credit_note:
    fields:
      id:              { type: uuid, generated: true }
      credit_note_number: { type: string, required: true, max_length: 20, description: "CN-YYYYMM-NNN" }
      invoice_id:      { type: uuid, required: true }
      customer_id:     { type: uuid, required: true }
      amount:          { type: decimal, required: true, min: 0.01 }
      reason:          { type: string, required: true, max_length: 500 }
      status:          { type: enum, values: [draft, issued, applied, void], default: draft }
      issue_date:      { type: date, required: true }
      notes:           { type: string, max_length: 1000 }
      created_at:      { type: datetime, auto: now }
      updated_at:      { type: datetime, auto: now_on_update }

  tax_config:
    fields:
      id:              { type: uuid, generated: true }
      name:            { type: string, required: true, max_length: 50, description: "e.g., SST, GST, No Tax" }
      rate:            { type: decimal, required: true, min: 0, max: 1 }
      is_default:      { type: boolean, default: false }
      is_active:       { type: boolean, default: true }
      effective_from:  { type: date, required: true }
      effective_to:    { type: date }
      created_at:      { type: datetime, auto: now }

  business_profile:
    fields:
      id:              { type: uuid, generated: true }
      business_name:   { type: string, required: true, max_length: 200 }
      registration_no: { type: string, max_length: 50 }
      tax_id:          { type: string, max_length: 50 }
      email:           { type: string, max_length: 200 }
      phone:           { type: string, max_length: 20 }
      address:         { type: string, max_length: 500 }
      bank_name:       { type: string, max_length: 100 }
      bank_account:    { type: string, max_length: 50 }
      logo_url:        { type: string, max_length: 500 }
      default_terms:   { type: string, max_length: 2000 }
      default_currency: { type: enum, values: [MYR, SGD, USD], default: MYR }
      next_invoice_number: { type: integer, default: 1 }
      next_credit_note_number: { type: integer, default: 1 }
      created_at:      { type: datetime, auto: now }
      updated_at:      { type: datetime, auto: now_on_update }

# ─────────────────────────────────────────────
# 2. RELATIONSHIPS
# ─────────────────────────────────────────────
relationships:
  invoice:
    belongs_to: customer
    has_many: [line_items, payments, credit_notes]
  line_item:
    belongs_to: invoice
  payment:
    belongs_to: invoice
  credit_note:
    belongs_to: [invoice, customer]

# ─────────────────────────────────────────────
# 3. RULES
# ─────────────────────────────────────────────
rules:
  - name: due_date_after_issue_date
    entity: invoice
    when: before_create, before_update
    condition: "due_date >= issue_date"
    error: "Due date must be on or after the issue date"

  - name: no_edit_paid_invoice
    entity: invoice
    when: before_update
    condition: "status NOT IN ['paid', 'void']"
    error: "Cannot edit a paid or voided invoice"

  - name: no_edit_void_invoice
    entity: line_item
    when: before_create, before_update
    condition: "invoice.status IN ['draft']"
    error: "Can only add/edit line items on draft invoices"
    # NOTE: Accessing parent entity (invoice.status) in a line_item rule.
    # The spec doesn't define cross-entity field access in rules.

  - name: payment_not_exceed_outstanding
    entity: payment
    when: before_create
    condition: "amount <= invoice.outstanding"
    error: "Payment amount cannot exceed the outstanding balance"
    # NOTE: References a computed field (invoice.outstanding) from another entity

  - name: payment_only_on_sent_invoices
    entity: payment
    when: before_create
    condition: "invoice.status IN ['sent', 'partially_paid', 'overdue']"
    error: "Can only record payments on sent, partially paid, or overdue invoices"

  - name: credit_note_not_exceed_invoice
    entity: credit_note
    when: before_create
    condition: "amount <= invoice.grand_total"
    error: "Credit note amount cannot exceed the invoice total"

  - name: invoice_must_have_line_items_to_send
    entity: invoice
    when: before_update
    condition: "status != 'sent' OR count(line_items) > 0"
    error: "Cannot send an invoice with no line items"
    # NOTE: Checking child entity count in a parent rule — is this supported?

  - name: void_requires_reason
    entity: invoice
    when: before_update
    condition: "status != 'void' OR cancelled_reason != null"
    error: "A reason is required to void an invoice"

  - name: no_future_payment_date
    entity: payment
    when: before_create
    condition: "payment_date <= today()"
    error: "Payment date cannot be in the future"

# ─────────────────────────────────────────────
# 4. PERMISSIONS
# ─────────────────────────────────────────────
permissions:
  ai:
    customer:
      create: true
      read: true
      update: [email, phone, address_line1, address_line2, city, state, postcode, notes, payment_terms_days]
      delete: false
    invoice:
      create: true
      read: true
      update: [notes, terms, reference, due_date]
      delete: false
    line_item:
      create: true
      read: true
      update: [description, quantity, unit_price, unit, sort_order, tax_exempt]
      delete: true  # AI can remove line items from draft invoices
    payment:
      create: true
      read: true
      update: [notes]
      delete: false
    credit_note:
      create: true
      read: true
      update: [notes, reason]
      delete: false
    tax_config:
      create: false
      read: true
      update: false
      delete: false
    business_profile:
      create: false
      read: true
      update: false
      delete: false

  owner:
    customer:        { create: true, read: true, update: all, delete: true }
    invoice:         { create: true, read: true, update: all, delete: true }
    line_item:       { create: true, read: true, update: all, delete: true }
    payment:         { create: true, read: true, update: all, delete: true }
    credit_note:     { create: true, read: true, update: all, delete: true }
    tax_config:      { create: true, read: true, update: all, delete: true }
    business_profile: { create: true, read: true, update: all, delete: true }

# ─────────────────────────────────────────────
# 5. VIEWS
# ─────────────────────────────────────────────
views:
  outstanding_invoices:
    description: "All unpaid invoices sorted by due date"
    entity: invoice
    filter: "status IN ['sent', 'partially_paid', 'overdue']"
    sort: { field: due_date, order: asc }
    include: [customer.name, customer.company_name]

  overdue_invoices:
    description: "Invoices past due date and not yet fully paid"
    entity: invoice
    filter: "status == 'overdue' OR (status IN ['sent', 'partially_paid'] AND due_date < today())"
    sort: { field: due_date, order: asc }
    include: [customer.name, customer.email]

  revenue_this_month:
    description: "Total revenue collected this month"
    entity: payment
    filter: "month(payment_date) == month(today()) AND year(payment_date) == year(today())"
    aggregate:
      - { field: amount, function: sum, as: total_collected }
      - { field: id, function: count, as: payment_count }

  revenue_by_month:
    description: "Monthly revenue trend (last 12 months)"
    entity: payment
    filter: "payment_date >= date_add(today(), -12, 'months')"
    group_by: "format_date(payment_date, 'YYYY-MM')"
    aggregate: { field: amount, function: sum }
    sort: { field: _group, order: asc }

  revenue_by_customer:
    description: "Total revenue per customer"
    entity: payment
    group_by: "invoice.customer_id"
    aggregate:
      - { field: amount, function: sum, as: total_paid }
      - { field: id, function: count, as: payment_count }
    sort: { field: total_paid, order: desc }
    include: [invoice.customer.name]
    # NOTE: Nested include (payment → invoice → customer) — is this supported?

  invoices_aging:
    description: "Aging report: outstanding amounts by 30/60/90/90+ day buckets"
    entity: invoice
    filter: "status IN ['sent', 'partially_paid', 'overdue']"
    # NOTE: Aging buckets need conditional aggregation:
    #   0-30 days: due_date within last 30 days
    #   31-60 days: due_date 31-60 days ago
    #   etc.
    # This CANNOT be expressed with the current view model.
    # Would need: custom_columns or conditional_aggregate support.
    sort: { field: due_date, order: asc }
    include: [customer.name]

  recent_invoices:
    description: "Last 20 invoices created"
    entity: invoice
    sort: { field: created_at, order: desc }
    limit: 20
    include: [customer.name]

  draft_invoices:
    description: "Invoices in draft status"
    entity: invoice
    filter: "status == 'draft'"
    sort: { field: created_at, order: desc }
    include: [customer.name]

  customer_outstanding:
    description: "Outstanding balance per customer"
    entity: invoice
    filter: "status IN ['sent', 'partially_paid', 'overdue']"
    group_by: customer_id
    aggregate: { field: outstanding, function: sum }
    sort: { field: _aggregate, order: desc }
    include: [customer.name, customer.email]
    # NOTE: Aggregating a computed field (outstanding) — is this supported?

  payments_this_month:
    description: "All payments received this month"
    entity: payment
    filter: "month(payment_date) == month(today()) AND year(payment_date) == year(today())"
    sort: { field: payment_date, order: desc }
    include: [invoice.invoice_number, invoice.customer.name]

  credit_notes_issued:
    description: "All issued credit notes"
    entity: credit_note
    filter: "status IN ['issued', 'applied']"
    sort: { field: issue_date, order: desc }
    include: [invoice.invoice_number, customer.name]

# ─────────────────────────────────────────────
# 6. ACTIONS
# ─────────────────────────────────────────────
actions:
  create_invoice:
    description: "Create a new invoice with line items for a customer"
    input:
      customer_id: { type: uuid, required: true }
      issue_date:  { type: date, default: "today()" }
      items:       { type: array, required: true, min_items: 1, items: { type: object, fields: { description: string, quantity: decimal, unit_price: decimal, unit: string, tax_exempt: boolean } } }
      notes:       { type: string }
      reference:   { type: string }
    steps:
      - read: { entity: customer, id: "$customer_id", as: customer }
      - read: { entity: business_profile, filter: "true", limit: 1, as: profile }
      - create:
          entity: invoice
          set:
            customer_id: "$customer_id"
            invoice_number: "format('INV-{}-{:03d}', format_date(today(), 'YYYYMM'), $profile.next_invoice_number)"
            issue_date: "$issue_date"
            due_date: "date_add($issue_date, $customer.payment_terms_days, 'days')"
            currency: "$customer.currency"
            tax_rate: "default_tax_rate()"
            notes: "$notes"
            reference: "$reference"
            terms: "$profile.default_terms"
          as: invoice
      - foreach: "$items"
        create:
          entity: line_item
          set:
            invoice_id: "$invoice.id"
            description: "$item.description"
            quantity: "$item.quantity"
            unit_price: "$item.unit_price"
            unit: "$item.unit || 'unit'"
            tax_exempt: "$item.tax_exempt || false"
            sort_order: "$index"
      - update:
          entity: business_profile
          id: "$profile.id"
          set: { next_invoice_number: "$profile.next_invoice_number + 1" }
      - return: { message: "Invoice {$invoice.invoice_number} created for {$customer.name}. Total: {$invoice.grand_total} {$invoice.currency}. Due: {$invoice.due_date}." }
    allowed_roles: [owner, ai]

  send_invoice:
    description: "Mark an invoice as sent (would trigger email in production)"
    input:
      invoice_id: { type: uuid, required: true }
    steps:
      - validate: "invoice.status == 'draft'"
      - validate: "count(line_items, invoice_id == $invoice_id) > 0"
      - update:
          entity: invoice
          id: "$invoice_id"
          set: { status: sent, sent_date: "today()" }
      - return: { message: "Invoice {invoice.invoice_number} sent to {invoice.customer.name} at {invoice.customer.email}." }
    allowed_roles: [owner, ai]

  record_payment:
    description: "Record a payment against an invoice and update invoice status"
    input:
      invoice_id:   { type: uuid, required: true }
      amount:       { type: decimal, required: true, min: 0.01 }
      payment_date: { type: date, default: "today()" }
      method:       { type: enum, values: [bank_transfer, cash, cheque, credit_card, e_wallet, paypal, other], required: true }
      reference:    { type: string }
      notes:        { type: string }
    steps:
      - read: { entity: invoice, id: "$invoice_id", as: invoice }
      - validate: "$invoice.status IN ['sent', 'partially_paid', 'overdue']"
      - validate: "$amount <= $invoice.outstanding"
      - create:
          entity: payment
          set:
            invoice_id: "$invoice_id"
            amount: "$amount"
            currency: "$invoice.currency"
            payment_date: "$payment_date"
            method: "$method"
            reference: "$reference"
            notes: "$notes"
      - update:
          entity: invoice
          id: "$invoice_id"
          set:
            status: "$invoice.outstanding - $amount <= 0 ? 'paid' : 'partially_paid'"
            paid_date: "$invoice.outstanding - $amount <= 0 ? today() : null"
      - return: { message: "Payment of {$amount} {$invoice.currency} recorded. {$invoice.outstanding - $amount <= 0 ? 'Invoice fully paid!' : 'Outstanding: ' + ($invoice.outstanding - $amount) + ' ' + $invoice.currency}" }
    allowed_roles: [owner, ai]

  void_invoice:
    description: "Void an invoice that should not be collected"
    input:
      invoice_id: { type: uuid, required: true }
      reason:     { type: string, required: true }
    steps:
      - read: { entity: invoice, id: "$invoice_id", as: invoice }
      - validate: "$invoice.status NOT IN ['paid', 'void']"
      - validate: "sum(payment, invoice_id == $invoice_id, amount) == 0"
      - update:
          entity: invoice
          id: "$invoice_id"
          set: { status: void, cancelled_reason: "$reason" }
      - return: { message: "Invoice {$invoice.invoice_number} voided. Reason: {$reason}" }
    allowed_roles: [owner]

  issue_credit_note:
    description: "Issue a credit note against an invoice"
    input:
      invoice_id: { type: uuid, required: true }
      amount:     { type: decimal, required: true, min: 0.01 }
      reason:     { type: string, required: true }
    steps:
      - read: { entity: invoice, id: "$invoice_id", as: invoice }
      - read: { entity: business_profile, filter: "true", limit: 1, as: profile }
      - validate: "$amount <= $invoice.grand_total"
      - create:
          entity: credit_note
          set:
            credit_note_number: "format('CN-{}-{:03d}', format_date(today(), 'YYYYMM'), $profile.next_credit_note_number)"
            invoice_id: "$invoice_id"
            customer_id: "$invoice.customer_id"
            amount: "$amount"
            reason: "$reason"
            status: "issued"
            issue_date: "today()"
      - update:
          entity: business_profile
          id: "$profile.id"
          set: { next_credit_note_number: "$profile.next_credit_note_number + 1" }
      - return: { message: "Credit note {credit_note_number} issued for {$amount} {$invoice.currency} against invoice {$invoice.invoice_number}." }
    allowed_roles: [owner, ai]

  monthly_invoice_summary:
    description: "Generate a summary of all invoicing activity for a month"
    input:
      month: { type: string, required: true, pattern: "^\\d{4}-\\d{2}$" }
    steps:
      - return:
          view: revenue_by_month
          # NOTE: This action just returns a view — feels redundant.
          # Really what's needed is a parameterized view.
    allowed_roles: [owner, ai]

# ─────────────────────────────────────────────
# 7. WORKFLOWS
# ─────────────────────────────────────────────
workflows:
  invoice_lifecycle:
    entity: invoice
    field: status
    states: [draft, sent, partially_paid, paid, overdue, cancelled, void]
    transitions:
      - from: draft           to: sent             by: [owner, ai]
      - from: draft           to: cancelled        by: [owner]
      - from: sent            to: partially_paid   by: [system]  # auto on partial payment
      - from: sent            to: paid             by: [system]  # auto on full payment
      - from: sent            to: overdue          by: [system]  # auto when past due
      - from: sent            to: cancelled        by: [owner]
      - from: sent            to: void             by: [owner]
      - from: partially_paid  to: paid             by: [system]
      - from: partially_paid  to: overdue          by: [system]
      - from: partially_paid  to: void             by: [owner]
      - from: overdue         to: partially_paid   by: [system]
      - from: overdue         to: paid             by: [system]
      - from: overdue         to: void             by: [owner]
      - from: cancelled       to: draft            by: [owner]   # reopen
    on_enter:
      paid: { set: { paid_date: "today()" } }
    # NOTE: Most transitions are [system] — triggered by payment recording or overdue detection.
    # The workflow transitions by roles is less useful here; the transitions happen
    # as side effects of actions and automations, not direct human/AI invocation.

  credit_note_lifecycle:
    entity: credit_note
    field: status
    states: [draft, issued, applied, void]
    transitions:
      - from: draft   to: issued  by: [owner, ai]
      - from: issued  to: applied by: [owner]
      - from: issued  to: void    by: [owner]
      - from: draft   to: void    by: [owner]

# ─────────────────────────────────────────────
# 8. COMPUTED
# ─────────────────────────────────────────────
computed:
  line_item:
    line_total: "quantity * unit_price"
    line_tax: "tax_exempt ? 0 : quantity * unit_price * invoice.tax_rate"
    line_total_with_tax: "line_total + line_tax"

  invoice:
    subtotal: "sum(line_items.line_total)"
    discount_amount: "subtotal * discount_pct"
    taxable_amount: "subtotal - discount_amount"
    tax_amount: "sum(line_items.line_tax)"
    grand_total: "taxable_amount + tax_amount"
    total_paid: "sum(payments.amount)"
    total_credits: "sum(credit_notes, status IN ['issued', 'applied'], amount)"
    outstanding: "grand_total - total_paid - total_credits"
    is_overdue: "status IN ['sent', 'partially_paid'] AND due_date < today()"
    days_overdue: "is_overdue ? date_diff(today(), due_date, 'days') : 0"

  customer:
    total_invoiced: "sum(invoice, customer_id == $id AND status NOT IN ['draft', 'cancelled', 'void'], grand_total)"
    total_paid: "sum(invoice, customer_id == $id, total_paid)"
    outstanding_balance: "total_invoiced - total_paid"
    invoice_count: "count(invoice, customer_id == $id AND status NOT IN ['draft', 'cancelled', 'void'])"
    average_days_to_pay: "avg(invoice, customer_id == $id AND status == 'paid', date_diff(paid_date, issue_date, 'days'))"

# ─────────────────────────────────────────────
# 9. AUTOMATIONS
# ─────────────────────────────────────────────
automations:
  mark_overdue:
    trigger: "daily at 00:05"
    action: update
    config:
      entity: invoice
      filter: "status IN ['sent', 'partially_paid'] AND due_date < today()"
      set: { status: overdue }

  overdue_reminder_7_days:
    trigger: "daily at 09:00"
    action: notify
    config:
      template: overdue_reminder
      filter: "invoice.status == 'overdue' AND invoice.days_overdue == 7"

  overdue_reminder_30_days:
    trigger: "daily at 09:00"
    action: notify
    config:
      template: overdue_escalation
      filter: "invoice.status == 'overdue' AND invoice.days_overdue == 30"

  payment_received:
    trigger: "payment.created"
    action: notify
    config: { template: payment_confirmation }

  large_invoice_created:
    trigger: "invoice.created AND invoice.grand_total > 10000"
    action: tag
    config: { tag: "high-value" }

  auto_set_overdue_on_payment:
    trigger: "payment.created AND invoice.outstanding > 0 AND invoice.status == 'overdue'"
    action: set_field
    config:
      entity: invoice
      id: "$payment.invoice_id"
      field: status
      value: "partially_paid"
    # NOTE: This automation corrects an overdue invoice back to partially_paid
    # when a payment comes in. This is a transition that should maybe be
    # handled by the workflow + action, not a separate automation.

# ─────────────────────────────────────────────
# 10. NOTIFICATIONS
# ─────────────────────────────────────────────
notifications:
  channels:
    owner:
      type: webhook
      url: "$OWNER_WEBHOOK_URL"
    customer_email:
      type: email
      # NOTE: The spec only shows webhook. Email notifications are critical
      # for invoicing but not defined in the notification channel types.

  templates:
    overdue_reminder:
      channel: owner
      message: "⏰ Invoice {invoice.invoice_number} to {invoice.customer.name} is 7 days overdue. Outstanding: {invoice.outstanding} {invoice.currency}"
      severity: warning

    overdue_escalation:
      channel: owner
      message: "🚨 Invoice {invoice.invoice_number} is 30 days overdue! Outstanding: {invoice.outstanding} {invoice.currency}. Customer: {invoice.customer.name} ({invoice.customer.email})"
      severity: critical

    payment_confirmation:
      channel: owner
      message: "💰 Payment received: {payment.amount} {payment.currency} for invoice {invoice.invoice_number} from {invoice.customer.name}. {invoice.outstanding > 0 ? 'Remaining: ' + invoice.outstanding : 'Fully paid!'}"
      severity: info

    invoice_sent:
      channel: owner
      message: "📤 Invoice {invoice.invoice_number} sent to {invoice.customer.name} ({invoice.customer.email}). Total: {invoice.grand_total} {invoice.currency}. Due: {invoice.due_date}"
      severity: info
```

### MCP Tools Generated

**Entity CRUD (AI role):**
| Tool | Count |
|------|-------|
| `create_customer`, `get_customer`, `list_customers`, `update_customer` | 4 |
| `create_invoice`, `get_invoice`, `list_invoices`, `update_invoice` | 4 |
| `create_line_item`, `get_line_item`, `list_line_items`, `update_line_item`, `delete_line_item` | 5 |
| `create_payment`, `get_payment`, `list_payments`, `update_payment` | 4 |
| `create_credit_note`, `get_credit_note`, `list_credit_notes`, `update_credit_note` | 4 |
| `get_tax_config`, `list_tax_configs` | 2 (read-only for AI) |
| `get_business_profile` | 1 (read-only for AI) |

**View Tools (11):**
`get_outstanding_invoices`, `get_overdue_invoices`, `get_revenue_this_month`, `get_revenue_by_month`, `get_revenue_by_customer`, `get_invoices_aging`, `get_recent_invoices`, `get_draft_invoices`, `get_customer_outstanding`, `get_payments_this_month`, `get_credit_notes_issued`

**Action Tools (6):**
`create_invoice` (the action, not CRUD), `send_invoice`, `record_payment`, `void_invoice`, `issue_credit_note`, `monthly_invoice_summary`

**Workflow Tools (2):**
`transition_invoice_status`, `transition_credit_note_status`

**Total: 43 tools** (24 CRUD + 11 views + 6 actions + 2 workflows)

**Name collision note:** `create_invoice` exists as both a CRUD tool and an action. The action version is richer (creates invoice + line items + auto-numbers). The spec needs a convention for when an action replaces a CRUD tool.

### Critique

**What worked well:**
- **Computed fields are the star here.** Invoice subtotal → tax → grand_total → outstanding is exactly what computed fields are designed for. The dependency chain (line_item.line_total → invoice.subtotal → invoice.outstanding) is clear and readable.
- **Workflows model invoice lifecycle well** — the state machine with role-restricted transitions is a natural fit.
- **Actions for multi-step operations** — `create_invoice` (with line items), `record_payment` (with status update) show the power of atomic multi-step operations.
- **Rules preventing invalid states** — no editing paid invoices, payments can't exceed outstanding, void requires a reason. These are the exact kinds of rules that prompt-based guardrails can't enforce.

**What felt awkward:**
- **Workflow vs. automation overlap** — invoice status transitions mostly happen as side effects (payment recorded → update status). The workflow defines valid transitions, but the actual transition happens inside the `record_payment` action and the `mark_overdue` automation. The workflow `by: [system]` role is needed but not formally defined.
- **Action/CRUD naming collision** — `create_invoice` as an action does more than the CRUD `create_invoice`. Need a convention: when an action exists, does it replace the CRUD tool? Or coexist with a different name?
- **Cross-entity field access in rules** — `line_item` rule checking `invoice.status`, `payment` rule checking `invoice.outstanding`. The spec doesn't clearly define how to traverse relationships in rule conditions.
- **Nested includes in views** — `payment → invoice → customer.name` is a 2-hop join. The spec only shows 1-hop includes.
- **Aging report is impossible** — the current view model can't express conditional date-range bucketing. This is a standard accounting report that every invoicing system needs.
- **Email notification channel** — the spec only defines `webhook`. Invoicing systems need email as a first-class notification channel.
- **Auto-incrementing invoice numbers** — the `business_profile.next_invoice_number` pattern works but feels hacky. Sequences/auto-increment should be a first-class field feature.

**What's missing:**
1. **Action replacing CRUD convention** — when an action does what CRUD does but better, how to suppress the raw CRUD tool
2. **System role** — for automated/scheduled state transitions
3. **Cross-entity field access in rules** — `invoice.status` from a `line_item` rule
4. **Nested relationship includes** — 2+ hop joins in views
5. **Conditional aggregation / bucketing** — aging reports, win rates
6. **Email notification channel** — not just webhooks
7. **Sequence/auto-increment field type** — for invoice numbers
8. **PDF/document generation** — invoicing apps need to generate PDF invoices. This is a fundamental gap.
9. **Recurring invoices** — a common billing need with no natural place in the model (would need a `recurring_schedule` entity + automation)
10. **Decimal precision** — financial systems need explicit decimal precision (e.g., `type: decimal, precision: 2`)

---

## Final Verdict

### 1. Are the 10 objects sufficient for real business apps?

**Mostly yes, with important gaps.** The 10 objects cover ~85% of what real business apps need. The core CRUD + Rules + Permissions + Views combination is solid and differentiating. The remaining 15% are real gaps that will surface quickly once users build beyond templates.

### 2. What objects need to be added, removed, or changed?

**No objects should be removed.** All 10 earn their place.

**Objects that need changes:**

| Object | Change | Why |
|--------|--------|-----|
| **Views** | Add parameterized inputs | "Show me spending for March" needs `input: { month: string }` |
| **Views** | Add multi-entity aggregation | Budget vs. actual, aging reports, win rates |
| **Views** | Add conditional aggregation | `count_if`, `sum_if` for bucketing and ratios |
| **Views** | Support multiple aggregates | Array of `{ field, function, as }` |
| **Rules** | Add `old.*` field access | Comparing previous to new value on update |
| **Rules** | Add cross-entity field access | `invoice.status` from `line_item` rule |
| **Automations** | Add time-based/cron triggers | `trigger: "schedule: daily at 09:00"` |
| **Workflows** | Add `system` role | For automated transitions (overdue marking, payment status) |
| **Workflows** | Add `on_enter` side effects | Setting fields when entering a state |
| **Notifications** | Add email channel type | Webhook-only is insufficient for customer-facing apps |
| **Actions** | Add CRUD-replacement convention | When an action should suppress the raw CRUD tool |
| **Entities** | Add `auto: now_on_update` | For `updated_at` fields |

**Consider adding:**

| Potential Object/Feature | Why |
|--------------------------|-----|
| **App Users / Team Members** | `assigned_to: string` is a hack. Team apps need a user model. |
| **Templates / Document Generation** | Invoice PDF, email templates, report generation |
| **Schedules / Recurrence** | Recurring invoices, periodic tasks |

### 3. What field types are missing?

| Type | Need |
|------|------|
| `array` / `list` | Tags, multi-select, multiple attachments |
| `url` | Receipt URLs, website URLs with validation |
| `email` | With format validation |
| `phone` | With format validation |
| `money` | Amount + currency compound type |
| `file` / `attachment` | Receipt images, documents |
| `sequence` | Auto-incrementing (invoice numbers) |
| `json` / `object` | Flexible structured data |
| `decimal` with `precision` | Financial amounts need explicit precision |

### 4. What expression functions are needed beyond today()/now()?

**Date functions:**
- `start_of_month()`, `end_of_month()`, `start_of_year()`
- `date_add(date, n, unit)` — add days/months/years
- `date_diff(date1, date2, unit)` — difference in days/months
- `month(date)`, `year(date)`, `day(date)`, `day_of_week(date)`
- `format_date(date, pattern)`

**Aggregation functions:**
- `sum(entity, filter, field)`, `count(entity, filter)`, `avg(entity, filter, field)`
- `min()`, `max()`
- `count_if(entity, condition)`, `sum_if(entity, condition, field)`

**Lookup functions:**
- `lookup(entity, filter, field, default)` — find single value from another entity
- `most_recent(entity, filter, field)` — most recent matching record
- `exists(entity, filter)` — boolean existence check

**String functions:**
- `contains()`, `starts_with()`, `lower()`, `upper()`, `format()`
- `concat()`, `length()`

**Logic functions:**
- `IMPLIES` — conditional logic (`A IMPLIES B` = `NOT A OR B`)
- Ternary: `condition ? then : else`
- `coalesce(a, b, c)` — first non-null

**Math functions:**
- `round(value, precision)`, `abs()`, `min()`, `max()`, `ceil()`, `floor()`

**Context variables:**
- `$current_user` — who is executing
- `$current_role` — what role they have
- `old.*` — previous field values on update

### 5. Object Model Rating

## **Needs Refinement** (but close to Ready to Build)

The core architecture is sound. The 10-object decomposition is the right abstraction level — it's expressive enough for real apps without being overwhelming. The philosophy of "schema is law" comes through clearly.

**What's ready to build now (P1):**
- Entities + field types + constraints ✅
- Rules with basic conditions ✅
- Permissions (CRUD + field-level) ✅
- Basic views (single-entity, no params) ✅

**What needs design work before building:**
1. **Expression language spec** — the functions, operators, and context variables need formal definition. Every schema I wrote invented functions that don't exist yet.
2. **Cross-entity access patterns** — how rules, computed fields, and views traverse relationships. This is the #1 source of ambiguity.
3. **Parameterized views** — without these, every "show me X for month Y" becomes an action that wraps a view, which is wasteful.
4. **System/scheduled actor model** — automations and workflows need a `system` role for time-triggered events.
5. **Action/CRUD interaction model** — when an action exists, what happens to the overlapping CRUD tool?

**The dogfood test will pass.** The expenses schema works cleanly. But the CRM and invoicing schemas exposed real gaps that will matter for early adopters building anything beyond simple single-entity tracking.

The object model is **architecturally correct** and **practically ~85% complete**. The remaining 15% is specification detail — expression functions, cross-entity patterns, view parameters — not fundamental redesign.
