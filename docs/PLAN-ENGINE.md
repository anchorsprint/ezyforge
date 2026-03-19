# PLAN-ENGINE — packages/engine

Implementation plan for `packages/engine` — the shared core library. Zero infra dependencies: takes a Postgres connection and a parsed schema, does everything else.

## Module Structure

```
packages/engine/src/
├── parser/        # YAML → validated immutable schema object
├── rules/         # Expression evaluator + before/after hook runner
├── permissions/   # Role-based CRUD + field-level access enforcement
├── tools/         # MCP tool definition generator from schema + permissions
├── runtime/       # Tool execution pipeline (orchestrates everything)
├── db/            # Postgres adapter — table creation, CRUD, queries
├── errors.ts      # Structured error types
└── types.ts       # Shared interfaces
```

---

## 1. Parser

**Purpose:** Parse and validate YAML schema into a frozen TypeScript object. This is the single source of truth for all other modules.

### Public API

```typescript
function parseSchema(yaml: string): SchemaParseResult;

type SchemaParseResult =
  | { ok: true; schema: AppSchema }
  | { ok: false; errors: SchemaError[] };

interface SchemaError {
  path: string;       // e.g. "entities.expense.fields.amount"
  message: string;
}
```

### Key Types

```typescript
interface AppSchema {
  readonly name: string;
  readonly version: string;
  readonly entities: Readonly<Record<string, Entity>>;
  readonly permissions: Readonly<Record<string, RolePermissions>>;
}

interface Entity {
  readonly label: string;
  readonly fields: Readonly<Record<string, Field>>;
  readonly rules: readonly Rule[];
}

type FieldType = 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'uuid' | 'enum' | 'text';

interface Field {
  readonly type: FieldType;
  readonly label: string;
  readonly required?: boolean;
  readonly default?: unknown;
  readonly min?: number;
  readonly max?: number;
  readonly min_length?: number;
  readonly max_length?: number;
  readonly precision?: number;
  readonly pattern?: string;
  readonly values?: readonly string[];  // enum only
}

interface Rule {
  readonly name: string;
  readonly hook: 'before_create' | 'before_update';
  readonly condition: string;           // expression string
  readonly action: 'reject';
  readonly message: string;
}

interface RolePermissions {
  readonly entities: Readonly<Record<string, EntityPermission>>;
}

interface EntityPermission {
  readonly create: boolean;
  readonly read: boolean;
  readonly update: boolean | readonly string[];  // true, false, or field list
  readonly delete: boolean;
}
```

### Implementation

1. Parse YAML with `yaml` package.
2. Validate structure against a Zod schema (catches missing fields, wrong types, invalid enum references, unknown field types).
3. Validate all rule expressions parse correctly (dry-run through expression parser).
4. Validate permission field references exist in their entity.
5. `Object.freeze()` recursively on the result.

### Edge Cases
- `update: []` (empty array) means update is permitted but no fields are writable — effectively read-only. Treat as `update: false` for tool generation.
- Duplicate field/entity names after case normalization — reject at parse time.
- Rule condition referencing fields that don't exist — reject at parse time.

---

## 2. Rules

**Purpose:** Evaluate FEEL-like expressions and run before/after hooks against record data.

### Public API

```typescript
function evaluateExpression(
  expr: string,
  context: ExpressionContext
): boolean;

function runHooks(
  hooks: readonly Rule[],
  hookType: Rule['hook'],
  context: ExpressionContext
): HookResult;

interface ExpressionContext {
  record: Record<string, unknown>;      // current field values
  original?: Record<string, unknown>;   // previous values (updates only)
}

type HookResult =
  | { ok: true }
  | { ok: false; error: RuleViolationError };
```

### Expression Evaluator Design

**Supported operators (MVP):** `<`, `<=`, `>`, `>=`, `==`, `!=`, `AND`, `OR`, `NOT`

**Supported functions:** `today()` (returns current date string `YYYY-MM-DD`), `now()` (returns current ISO datetime)

**Null checks:** `field is null`, `field is not null`

**Field references:** bare names resolve against `context.record`. Prefix `original.` resolves against `context.original`.

**AST approach:**
1. Tokenizer splits expression into tokens: identifiers, operators, literals (string, number, boolean, null), parens, function calls.
2. Recursive descent parser builds an AST. Operator precedence: NOT > comparison > AND > OR.
3. Evaluator walks the AST, resolving field references from context.

```typescript
type ASTNode =
  | { type: 'literal'; value: unknown }
  | { type: 'field'; path: string }
  | { type: 'function'; name: string }
  | { type: 'binary'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'unary'; op: 'NOT'; operand: ASTNode }
  | { type: 'null_check'; field: ASTNode; negated: boolean };
```

**Sandboxing:** The evaluator is a pure function over the AST. No dynamic code execution, no access to globals. Field references only resolve against the provided context object — property access is done via explicit lookup, not dynamic evaluation.

### Tricky Parts
- Date comparison: `record.date > today()` requires coercing both sides to comparable values. Compare as strings since `YYYY-MM-DD` sorts lexicographically.
- Decimal comparison: use `Number()` coercion, compare with tolerance for floating point (`Math.abs(a - b) < 1e-10`).
- Short-circuit evaluation: `AND`/`OR` must short-circuit to avoid null reference errors in chained conditions like `field is not null AND field > 0`.

---

## 3. Permissions

**Purpose:** Check whether a role can perform a given operation on an entity/field.

### Public API

```typescript
function checkPermission(
  schema: AppSchema,
  role: string,
  entity: string,
  operation: 'create' | 'read' | 'update' | 'delete'
): PermissionResult;

function getWritableFields(
  schema: AppSchema,
  role: string,
  entity: string,
  operation: 'create' | 'update'
): string[];

function filterFields(
  record: Record<string, unknown>,
  allowedFields: string[]
): Record<string, unknown>;

type PermissionResult =
  | { allowed: true }
  | { allowed: false; error: PermissionDeniedError };
```

### Implementation
- `checkPermission`: look up `schema.permissions[role].entities[entity][operation]`. If `update` is an array, treat as `true` for the operation check (field filtering happens separately).
- `getWritableFields`: for `create`, return all fields (owner) or all fields (ai — create is all-or-nothing). For `update`, if permission is `string[]`, return that list; if `true`, return all fields; if `false`, return `[]`.
- `filterFields`: strips any keys not in the allowed list. Used before DB write to silently drop unpermitted fields. The runtime layer rejects if required fields were stripped.

### Edge Cases
- Role not found in schema — deny all.
- Entity not found in role's permissions — deny all.

---

## 4. Tools

**Purpose:** Auto-generate MCP tool definitions from schema + permissions for a given role.

### Public API

```typescript
function generateTools(
  schema: AppSchema,
  role: string
): ToolDefinition[];

interface ToolDefinition {
  name: string;                         // e.g. "create_expense"
  description: string;
  inputSchema: Record<string, unknown>; // JSON Schema object
}
```

### Tool Generation Logic

For each entity where the role has access:

| Permission | Tool generated | Input schema |
|---|---|---|
| `create: true` | `create_[entity]` | All fields as properties; `required` from field constraints |
| `read: true` | `list_[entity]` | `{ filters?, sort?, limit?, offset? }` |
| `read: true` | `get_[entity]` | `{ id: string }` |
| `update: true\|string[]` | `update_[entity]` | `{ id: string, ...writable_fields }` |
| `delete: true` | `delete_[entity]` | `{ id: string }` |
| `read: true` | `aggregate_[entity]` | `{ operation: "sum"\|"count"\|"avg", field?: string, group_by?: string, filters? }` |

**Field type to JSON Schema mapping:**
- `string` → `{ type: "string" }` + minLength/maxLength/pattern
- `integer` → `{ type: "integer" }` + min/max
- `decimal` → `{ type: "number" }` + min/max
- `boolean` → `{ type: "boolean" }`
- `date` → `{ type: "string", format: "date" }`
- `datetime` → `{ type: "string", format: "date-time" }`
- `uuid` → `{ type: "string", format: "uuid" }`
- `enum` → `{ type: "string", enum: [...values] }`
- `text` → `{ type: "string" }` + maxLength

**Example output for `create_expense` (ai role):**
```json
{
  "name": "create_expense",
  "description": "Create a new expense record",
  "inputSchema": {
    "type": "object",
    "properties": {
      "amount": { "type": "number", "minimum": 0 },
      "date": { "type": "string", "format": "date" },
      "category": { "type": "string", "enum": ["food", "transport", "utilities", "entertainment", "other"] },
      "notes": { "type": "string", "maxLength": 500 }
    },
    "required": ["amount", "date", "category"]
  }
}
```

### Tricky Parts
- `update` tool must only include writable fields in its schema, not all entity fields.
- `aggregate` tool: `field` is required for `sum`/`avg` but not `count`. Express this with a conditional note in the description, not JSON Schema conditionals (too complex for LLMs to parse).

---

## 5. DB

**Purpose:** Postgres adapter for table management and CRUD. Accepts any Postgres client that implements a simple query interface.

### Public API

```typescript
interface PgClient {
  query(sql: string, params: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

function createDbAdapter(client: PgClient, appId: string): DbAdapter;

interface DbAdapter {
  ensureTables(schema: AppSchema): Promise<void>;
  insert(entity: string, record: Record<string, unknown>): Promise<Record<string, unknown>>;
  findById(entity: string, id: string): Promise<Record<string, unknown> | null>;
  list(entity: string, opts: ListOptions): Promise<Record<string, unknown>[]>;
  update(entity: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown>>;
  delete(entity: string, id: string): Promise<void>;
  aggregate(entity: string, opts: AggregateOptions): Promise<AggregateResult[]>;
  writeAuditLog(entry: AuditEntry): Promise<void>;
}

interface ListOptions {
  filters?: Record<string, unknown>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

interface AggregateOptions {
  operation: 'sum' | 'count' | 'avg';
  field?: string;
  group_by?: string;
  filters?: Record<string, unknown>;
}
```

### Implementation
- **Table naming:** `app_{appId}_{entity}` — all lowercase, underscored. Every table gets `id` (UUID, PK, auto-generated), `created_at`, `updated_at` columns.
- **Isolation:** Every query includes `WHERE app_id = $appId`. The `app_id` column is added to every table. The adapter injects it — callers never see it.
- **`ensureTables`:** Generates `CREATE TABLE IF NOT EXISTS` DDL from schema field types. Maps `decimal` to `NUMERIC(precision)`, `enum` to `TEXT` + CHECK constraint, etc. Runs in a transaction.
- **Parameterized queries only.** All values go through `$1, $2, ...` params. Zero string interpolation of user data.
- **Audit log:** Separate `app_{appId}_audit` table with `entity`, `operation`, `record_id`, `role`, `changes` (JSONB), `timestamp`.

### Tricky Parts
- Schema migrations: MVP does NOT support schema changes after table creation. `ensureTables` is idempotent but additive only — new fields get `ALTER TABLE ADD COLUMN`, removed fields are ignored (data preserved). Type changes are rejected.
- Filter queries: `filters` is `{ field: value }` for equality. Extend later for operators. Validate filter field names against schema to prevent injection.

---

## 6. Runtime

**Purpose:** Orchestrates the full tool execution pipeline.

### Public API

```typescript
function createRuntime(
  schema: AppSchema,
  db: DbAdapter,
  role: string
): Runtime;

interface Runtime {
  getTools(): ToolDefinition[];
  executeTool(name: string, input: Record<string, unknown>): Promise<ToolResult>;
}

type ToolResult =
  | { success: true; data: unknown }
  | { success: false; error: EngineError };
```

### Execution Pipeline (step by step)

1. **Tool lookup** — Match `name` against generated tools. If not found, return `ToolNotFoundError`.
2. **Permission check** — `checkPermission(schema, role, entity, operation)`. If denied, return `PermissionDeniedError`.
3. **Field filtering** — For create/update: `filterFields(input, getWritableFields(...))`. If required fields were stripped, return `PermissionDeniedError` (AI tried to write a restricted field).
4. **Field validation** — Check each field against schema constraints (type, required, min, max, pattern, enum values). First failure returns `ValidationError`.
5. **Rule engine (before hooks)** — `runHooks(entity.rules, 'before_create'|'before_update', context)`. If rejected, return `RuleViolationError`.
6. **DB operation** — `db.insert(...)` / `db.update(...)` / `db.findById(...)` / `db.list(...)` / `db.delete(...)` / `db.aggregate(...)`.
7. **Audit log** — `db.writeAuditLog({ entity, operation, recordId, role, changes, timestamp })`.
8. **Response** — Return `{ success: true, data: record }`.

For read operations (list, get, aggregate), steps 3-5 are skipped — go straight from permission check to DB query.

---

## 7. Error Types

```typescript
type EngineError =
  | RuleViolationError
  | PermissionDeniedError
  | ValidationError
  | ToolNotFoundError;

interface RuleViolationError {
  error: 'rule_violation';
  rule: string;
  message: string;
}

interface PermissionDeniedError {
  error: 'permission_denied';
  role: string;
  entity: string;
  operation: string;
  message: string;
}

interface ValidationError {
  error: 'validation_error';
  field: string;
  constraint: string;
  message: string;
}

interface ToolNotFoundError {
  error: 'tool_not_found';
  tool: string;
  message: string;
}
```

---

## 8. YAML Schema Format

Canonical reference — the full structure with all supported features:

```yaml
name: expense-tracker
version: "1.0"

entities:
  expense:
    label: Expense
    fields:
      amount:
        type: decimal
        label: Amount
        required: true
        min: 0
        precision: 2
      date:
        type: date
        label: Date
        required: true
      category:
        type: enum
        label: Category
        required: true
        values: [food, transport, utilities, entertainment, other]
      notes:
        type: text
        label: Notes
        max_length: 500
      receipt_ref:
        type: string
        label: Receipt Reference
        pattern: "^REC-[0-9]{6}$"
      is_recurring:
        type: boolean
        label: Recurring
        default: false

    rules:
      - name: no_future_dates
        hook: before_create
        condition: "date > today()"
        action: reject
        message: "Expense date cannot be in the future"
      - name: no_future_date_update
        hook: before_update
        condition: "date > today()"
        action: reject
        message: "Cannot update expense to a future date"

permissions:
  owner:
    entities:
      expense:
        create: true
        read: true
        update: true
        delete: true
  ai:
    entities:
      expense:
        create: true
        read: true
        update: [notes, category]
        delete: false
```

---

## 9. Testing Strategy

### Unit Tests (per module)

**Parser:** valid schema parses correctly, missing required fields rejected, invalid field types rejected, invalid rule expressions caught, frozen output.

**Rules:** comparison operators (`<`, `<=`, `>`, `>=`, `==`, `!=`), boolean logic (`AND`, `OR`, `NOT`), `today()`/`now()` functions, `is null`/`is not null`, short-circuit behavior, nested parentheses, invalid expressions throw.

**Permissions:** owner gets full access, ai gets restricted access, unknown role denied, field-level update filtering, empty update array treated as no-update.

**Tools:** correct tools generated per role, update tool only includes writable fields, delete tool absent when `delete: false`, JSON Schema types match field types.

**DB:** table creation DDL is correct, app_id isolation enforced, parameterized queries (no injection), audit log written.

### Integration Tests

**Full pipeline:** parse schema, create runtime, execute tool, verify DB state + audit log.

**Dogfood test (expenses):** AI creates expense (passes), AI updates notes (passes), AI updates amount (rejected by permission), AI deletes (rejected, no tool), AI creates future-dated expense (rejected by rule), owner updates amount (passes), owner deletes (passes).

**Multi-tenant isolation:** runtime for app A cannot read/write app B data even with same Postgres connection.

### Tricky Parts (project-wide)

- **Expression parser is the hardest module.** Budget 40% of engine time here. Edge cases: operator precedence, whitespace sensitivity, string literals containing keywords, field names that look like keywords (`not`, `and`).
- **Decimal precision:** Postgres `NUMERIC` and JS `Number` behave differently. Use string representation for decimal fields in the DB layer and parse to number only for comparisons.
- **Schema validation completeness:** Every constraint must be validated at parse time AND at runtime. Missing either creates a gap.
- **Audit log performance:** Write audit asynchronously (fire-and-forget after response) to avoid slowing tool execution. Accept the small risk of missing audit entries on crash.
