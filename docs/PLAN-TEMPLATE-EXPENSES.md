# PLAN-TEMPLATE-EXPENSES — templates/expenses.yaml

The expenses template is EzyForge's first and only MVP 1.0 template. It is the dogfood test: Jazz deploys it, connects OpenClaw via MCP, and the AI agent operates it. Every engine module gets exercised through this single template.

---

## 1. Complete YAML Schema

```yaml
template:
  name: expenses
  description: Personal and small-business expense tracking
  version: "1.0.0"
  author: ezyforge

entities:
  expense:
    description: A single expense record

    fields:
      id:
        type: uuid
        required: true
        auto: generate
        description: Unique expense identifier

      date:
        type: date
        required: true
        description: Date the expense occurred

      amount:
        type: decimal
        required: true
        min: 0.01
        precision: 2
        description: Expense amount

      currency:
        type: enum
        values: [MYR, USD, SGD]
        default: MYR
        required: true
        description: Currency code

      merchant:
        type: string
        required: true
        max_length: 200
        description: Where the money was spent

      category:
        type: enum
        values: [food, transport, utilities, entertainment, healthcare, shopping, education, other]
        required: false
        description: Expense category

      payment_method:
        type: enum
        values: [cash, card, e-wallet, bank_transfer]
        required: false
        description: How the expense was paid

      notes:
        type: text
        required: false
        max_length: 1000
        description: Optional notes or context

      created_at:
        type: datetime
        auto: now
        description: Record creation timestamp

      updated_at:
        type: datetime
        auto: now
        description: Last update timestamp

    rules:
      no_future_dates:
        hooks: [before_create, before_update]
        condition: "date > today()"
        action: reject
        message: "Expense date cannot be in the future"

      positive_amount:
        hooks: [before_create]
        condition: "amount <= 0"
        action: reject
        message: "Amount must be greater than zero"

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [notes, category, payment_method]
      delete: false
```

### Schema Design Decisions

- **`id`, `created_at`, `updated_at`** are auto-generated. AI supplies them on create: never. Engine fills them.
- **`category` and `payment_method`** are optional — the AI can create an expense with just date, amount, merchant. It can categorize later via update.
- **`currency` defaults to MYR** — Jazz is in Malaysia. AI only needs to specify it for foreign expenses.
- **`no_future_dates` fires on both create and update** — prevents backdating workarounds via update (even though `date` is not in `allowed_fields`, defense in depth).
- **`positive_amount` fires on create only** — amount is not updateable by AI, so before_update is unnecessary.
- **`delete: false`** — no delete tool is generated. The AI literally cannot express a delete operation.

---

## 2. Generated MCP Tools

The engine reads the schema + permissions and generates exactly five tools. No hand-coding.

### 2.1 `create_expense`

```json
{
  "name": "create_expense",
  "description": "Create a new expense record. Required: date, amount, merchant. Optional: currency (default MYR), category, payment_method, notes.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "date": { "type": "string", "format": "date", "description": "Expense date (YYYY-MM-DD)" },
      "amount": { "type": "number", "minimum": 0.01, "description": "Amount spent (2 decimal places)" },
      "currency": { "type": "string", "enum": ["MYR", "USD", "SGD"], "default": "MYR" },
      "merchant": { "type": "string", "maxLength": 200, "description": "Where the money was spent" },
      "category": { "type": "string", "enum": ["food", "transport", "utilities", "entertainment", "healthcare", "shopping", "education", "other"] },
      "payment_method": { "type": "string", "enum": ["cash", "card", "e-wallet", "bank_transfer"] },
      "notes": { "type": "string", "maxLength": 1000 }
    },
    "required": ["date", "amount", "merchant"]
  },
  "returns": {
    "type": "object",
    "description": "The created expense record with id, created_at, and updated_at populated"
  }
}
```

### 2.2 `get_expense`

```json
{
  "name": "get_expense",
  "description": "Retrieve a single expense by its ID.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "format": "uuid", "description": "Expense ID" }
    },
    "required": ["id"]
  },
  "returns": {
    "type": "object",
    "description": "The expense record, or error if not found"
  }
}
```

### 2.3 `list_expenses`

```json
{
  "name": "list_expenses",
  "description": "List expenses with optional filters, sorting, and pagination.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filter": {
        "type": "object",
        "properties": {
          "category": { "type": "string", "enum": ["food", "transport", "utilities", "entertainment", "healthcare", "shopping", "education", "other"] },
          "payment_method": { "type": "string", "enum": ["cash", "card", "e-wallet", "bank_transfer"] },
          "merchant": { "type": "string", "description": "Partial match on merchant name" },
          "date_from": { "type": "string", "format": "date" },
          "date_to": { "type": "string", "format": "date" },
          "currency": { "type": "string", "enum": ["MYR", "USD", "SGD"] }
        }
      },
      "sort": { "type": "string", "enum": ["date_asc", "date_desc", "amount_asc", "amount_desc"], "default": "date_desc" },
      "limit": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 },
      "offset": { "type": "integer", "minimum": 0, "default": 0 }
    }
  },
  "returns": {
    "type": "object",
    "properties": {
      "items": { "type": "array", "description": "List of expense records" },
      "total": { "type": "integer", "description": "Total matching records" }
    }
  }
}
```

### 2.4 `update_expense`

```json
{
  "name": "update_expense",
  "description": "Update an expense. Only notes, category, and payment_method can be changed.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "format": "uuid", "description": "Expense ID to update" },
      "notes": { "type": "string", "maxLength": 1000 },
      "category": { "type": "string", "enum": ["food", "transport", "utilities", "entertainment", "healthcare", "shopping", "education", "other"] },
      "payment_method": { "type": "string", "enum": ["cash", "card", "e-wallet", "bank_transfer"] }
    },
    "required": ["id"]
  },
  "returns": {
    "type": "object",
    "description": "The updated expense record with updated_at refreshed"
  }
}
```

**Note:** The input schema only includes `allowed_fields` + `id`. Fields like `amount`, `date`, `merchant`, `currency` are not present — the AI cannot even attempt to send them. If it does (malformed call), the permission layer rejects with:

```json
{ "error": "permission_denied", "field": "amount", "message": "Field 'amount' is not updatable by AI" }
```

### 2.5 `aggregate_expenses`

```json
{
  "name": "aggregate_expenses",
  "description": "Calculate sum, count, or average of expenses. Supports grouping by category, merchant, currency, or payment_method.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "operation": { "type": "string", "enum": ["sum", "count", "avg"] },
      "field": { "type": "string", "enum": ["amount"], "default": "amount" },
      "group_by": { "type": "string", "enum": ["category", "merchant", "currency", "payment_method"] },
      "filter": {
        "type": "object",
        "properties": {
          "category": { "type": "string" },
          "date_from": { "type": "string", "format": "date" },
          "date_to": { "type": "string", "format": "date" },
          "currency": { "type": "string", "enum": ["MYR", "USD", "SGD"] }
        }
      }
    },
    "required": ["operation"]
  },
  "returns": {
    "type": "object",
    "description": "Aggregation result. If group_by is set, returns array of { group, value }. Otherwise returns { value }."
  }
}
```

**No `delete_expense` tool is generated.** `delete: false` means the tool generator skips it entirely.

---

## 3. Test Scenarios

### 3.1 Happy Path — Create

| # | Input | Expected |
|---|-------|----------|
| 1 | `create_expense({ date: "2026-03-19", amount: 15.00, merchant: "McDonald's" })` | Created. currency=MYR (default). id, created_at, updated_at auto-filled. |
| 2 | `create_expense({ date: "2026-03-18", amount: 42.50, merchant: "Shell", category: "transport", payment_method: "card", currency: "MYR" })` | Created with all fields populated. |
| 3 | `create_expense({ date: "2026-03-19", amount: 0.01, merchant: "Parking" })` | Created. Boundary minimum amount. |

### 3.2 Validation Failures

| # | Input | Expected Error |
|---|-------|---------------|
| 4 | `create_expense({ amount: 15, merchant: "X" })` | `{ error: "validation_error", field: "date", message: "Field 'date' is required" }` |
| 5 | `create_expense({ date: "2026-03-19", merchant: "X" })` | `{ error: "validation_error", field: "amount", message: "Field 'amount' is required" }` |
| 6 | `create_expense({ date: "2026-03-19", amount: 15 })` | `{ error: "validation_error", field: "merchant", message: "Field 'merchant' is required" }` |
| 7 | `create_expense({ date: "not-a-date", amount: 15, merchant: "X" })` | `{ error: "validation_error", field: "date", message: "Invalid date format" }` |
| 8 | `create_expense({ date: "2026-03-19", amount: -5, merchant: "X" })` | `{ error: "validation_error", field: "amount", message: "Amount must be >= 0.01" }` |
| 9 | `create_expense({ date: "2026-03-19", amount: 15, merchant: "X", category: "gambling" })` | `{ error: "validation_error", field: "category", message: "Invalid enum value" }` |
| 10 | `create_expense({ date: "2026-03-19", amount: 15, merchant: "A".repeat(201) })` | `{ error: "validation_error", field: "merchant", message: "Exceeds max length 200" }` |

### 3.3 Rule Violations

| # | Input | Expected Error |
|---|-------|---------------|
| 11 | `create_expense({ date: "2026-03-26", amount: 15, merchant: "X" })` | `{ error: "rule_violation", rule: "no_future_dates", message: "Expense date cannot be in the future" }` |
| 12 | `create_expense({ date: "2026-03-19", amount: 0, merchant: "X" })` | `{ error: "rule_violation", rule: "positive_amount", message: "Amount must be greater than zero" }` (or validation catches first) |
| 13 | Today's date in create → passes `no_future_dates` | Created successfully. `date == today()` is not `> today()`. |

### 3.4 Permission Denials

| # | Input | Expected Error |
|---|-------|---------------|
| 14 | `update_expense({ id: "...", amount: 0 })` | `{ error: "permission_denied", field: "amount", message: "Field 'amount' is not updatable by AI" }` |
| 15 | `update_expense({ id: "...", date: "2026-03-18" })` | `{ error: "permission_denied", field: "date", message: "Field 'date' is not updatable by AI" }` |
| 16 | `update_expense({ id: "...", merchant: "New Name" })` | `{ error: "permission_denied", field: "merchant", message: "Field 'merchant' is not updatable by AI" }` |
| 17 | `delete_expense(...)` | Tool does not exist. MCP returns unknown tool error. |

### 3.5 Happy Path — Update

| # | Input | Expected |
|---|-------|----------|
| 18 | `update_expense({ id: "...", notes: "Team lunch" })` | Updated. `updated_at` refreshed. |
| 19 | `update_expense({ id: "...", category: "food", payment_method: "e-wallet" })` | Updated. Multiple allowed fields at once. |

### 3.6 Read & List

| # | Input | Expected |
|---|-------|----------|
| 20 | `get_expense({ id: "..." })` | Returns full expense record. |
| 21 | `get_expense({ id: "nonexistent" })` | `{ error: "not_found", message: "Expense not found" }` |
| 22 | `list_expenses({})` | Returns up to 20 expenses, sorted by date_desc. |
| 23 | `list_expenses({ filter: { category: "food" } })` | Only food expenses. |
| 24 | `list_expenses({ filter: { date_from: "2026-03-01", date_to: "2026-03-31" } })` | March 2026 expenses. |
| 25 | `list_expenses({ filter: { merchant: "McDonald" } })` | Partial match on merchant. |
| 26 | `list_expenses({ sort: "amount_desc", limit: 5 })` | Top 5 by amount. |

### 3.7 Aggregation

| # | Input | Expected |
|---|-------|----------|
| 27 | `aggregate_expenses({ operation: "sum", filter: { category: "food" } })` | `{ value: 15.00 }` (after test 1) |
| 28 | `aggregate_expenses({ operation: "count" })` | `{ value: N }` — total expense count. |
| 29 | `aggregate_expenses({ operation: "sum", group_by: "category" })` | `[{ group: "food", value: 15.00 }, { group: "transport", value: 42.50 }, ...]` |
| 30 | `aggregate_expenses({ operation: "avg", group_by: "payment_method" })` | Average amount per payment method. |

### 3.8 Edge Cases

| # | Scenario | Expected |
|---|----------|----------|
| 31 | Create with `notes: ""` (empty string) | Created. Empty string is valid for optional text. |
| 32 | Create with `notes: null` | Created. Null is valid for optional field. |
| 33 | Create with `amount: 0.01` | Created. Exact minimum boundary. |
| 34 | Create with `amount: 999999.99` | Created. No max constraint defined. |
| 35 | Update nonexistent ID | `{ error: "not_found" }` |
| 36 | List with no results matching filter | `{ items: [], total: 0 }` |
| 37 | Aggregate with no data | `{ value: 0 }` (sum/count) or `{ value: null }` (avg). |

---

## 4. Engine Module Coverage

Each test scenario exercises specific engine modules. This is why expenses is the canonical integration test.

| Engine Module | Exercised By |
|---------------|-------------|
| **Schema Parser** | Loading `expenses.yaml`, validating field types, constraints, enums, auto fields. All tests. |
| **Field Validation** | Tests 4-10, 31-34. Type checking, required enforcement, min/max, max_length, enum membership. |
| **Rule Engine** | Tests 11-13. FEEL expression evaluation: `date > today()`, `amount <= 0`. Hook dispatch (before_create, before_update). |
| **Permission Layer** | Tests 14-17, 18-19. Field-level write control on update. Delete tool suppression. Reject disallowed fields. |
| **MCP Tool Generator** | Verifying exactly 5 tools generated. No delete tool. Input schemas match allowed fields. Descriptions populated. |
| **Tool Execution Runtime** | All create/read/update/list/aggregate calls. Pipeline: parse input → validate → check permissions → evaluate rules → execute DB op → return result. |
| **Auto-field Handling** | Tests 1-3, 18-19. `id` auto-generated as UUID. `created_at` set on create. `updated_at` refreshed on update. |
| **Error Response Format** | All failure tests. Structured errors with `error` type, `field`/`rule` identifier, human-readable `message`. |
| **Query & Filter** | Tests 22-26. Filter translation to SQL WHERE. Partial string match. Sort mapping. Pagination via limit/offset. |
| **Aggregation** | Tests 27-30, 37. SQL aggregation (SUM, COUNT, AVG). GROUP BY support. Empty dataset handling. |

---

## 5. Dogfood Checklist Mapping

| Dogfood Step | Template Feature | Test # |
|-------------|-----------------|--------|
| "Log lunch at McDonald's RM 15" | `create_expense` with defaults | 1 |
| "How much did I spend on food?" | `aggregate_expenses` with category filter | 27 |
| "Delete that expense" | No delete tool generated | 17 |
| "Change the amount to 0" | Permission layer blocks `amount` update | 14 |
| "Log dinner for next Friday" | `no_future_dates` rule rejects | 11 |
| Jazz opens console | `list_expenses` + `get_expense` power the data viewer | 20-26 |

Every dogfood requirement maps to a concrete test. If all 37 tests pass, the template — and therefore the engine — is MVP-complete.
