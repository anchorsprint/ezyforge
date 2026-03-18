# EzyForge — Feature List

> **Guiding principle:** Schema is Law. AI is Operator. Owner is Governor.

---

## P1 — Core (prove it works, 2 weeks solo)

The minimum needed to define a schema, enforce rules, generate tools, and run Jazz's expenses app.

### Schema & Rules

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **Entity Definition** | Define entities with typed fields, constraints, and validations in YAML | Foundation — without this, nothing works | • 10+ field types (string, decimal, enum, date, uuid, etc.) • `required`, `default`, `min/max`, `pattern` constraints • Generated fields (id, timestamps) with `auto: now` |
| **Business Rules** | Deterministic before/after CRUD rules with FEEL-inspired conditions | The killer feature — rules in schema, not prompts | • `when: before_create/before_update/after_create` hooks • Conditions: comparisons, boolean ops, `today()`, `IN` • Actions: `reject`, `warn`, `require_approval`, `tag`, `set_field` |
| **AI Permissions** | Field-level access control for AI agents per entity | What no other product offers | • CRUD-level toggles (create/read/update/delete: true/false) • `update: { allowed_fields: [...] }` — AI can only write listed fields • `delete: false` → no delete tool generated |
| **Schema Lock** | Lock/unlock mechanism to freeze schema from modification | Core governance primitive | • `locked: true` blocks all schema changes • `forge lock` / `forge unlock` CLI commands • Lock state logged with timestamps |
| **Schema Metadata** | App name, version (semver), owner, storage config | Identity and governance foundation | • Version validated as semver • Storage engine + path configurable |

### Expression Engine

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **FEEL-Inspired Evaluator** | Sandboxed expression language for rule conditions | Safe, readable, LLM-friendly conditions | • Comparisons, boolean logic, arithmetic • `today()`, `now()`, `day_of_week()`, `contains()`, `IN` • Sandboxed — no file I/O, no network, no code execution |
| **Unique Constraints** | Enforce uniqueness across one or multiple fields | Prevents AI from creating duplicate records | • Single and composite unique constraints • Clear error messages (not raw SQL errors) |

### Tool Generation & Runtime

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **MCP Tool Generation** | Auto-generate MCP tool definitions from schema | Primary AI integration path | • Permission-aware: no tool for forbidden operations • Input schemas include field constraints (min/max, enum values) • Valid MCP JSON output |
| **Tool Execution Runtime** | Execute tool calls through permission → validation → rules → DB pipeline | The enforcement loop | • Single execution path for all callers • Structured errors: `permission_denied`, `rule_violation`, `validation_error` • Atomic transactions |
| **Permission Enforcement** | Dedicated layer checking AI permissions on every operation | Defense in depth | • CRUD-level and field-level checks • Runs before validation and rules • Cannot be bypassed |

### Data & Storage

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **SQLite Support** | Auto-create tables from schema, execute CRUD operations | Zero-setup database for MVP | • Tables created automatically on first run • Correct type mapping • Transactions wrap each operation |
| **Field Validation** | Validate every field against schema constraints before write | Data integrity at the type level | • Required, type, range, length, enum, pattern checks • Multiple errors returned together |

### Developer Tooling

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **`forge init`** | Create new project with schema file and directory structure | First-run experience | • `--template expenses` creates full expenses schema • Generated schema passes validation |
| **`forge validate`** | Check schema for errors, no side effects | Fast feedback loop | • Errors with line numbers and field paths • Exit code 0/1 for CI integration |
| **`forge generate`** | Output MCP tools and TypeScript types from schema | Static artifact generation | • `--format mcp` and `--format types` • Idempotent output to `./generated/` |
| **`forge serve`** | Run local server with REST API + MCP endpoint | Brings the schema to life | • REST CRUD endpoints per entity • MCP tool discovery + execution • Full pipeline enforcement on every request |
| **`forge status`** | Show project state — version, lock, entities, DB | Quick sanity check | • Runs in under 1 second |

### Template

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **Expenses Template** | Complete schema for personal expense tracking | Dogfood test — Jazz uses this daily | • expense + budget entities with rules and AI permissions • Production-quality, not a toy |

### Export

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **TypeScript Types** | Generate `.d.ts` interfaces from schema | Type safety for app code | • Correct type mapping • Optional fields use `?`, generated fields are `readonly` |

---

## P2 — Complete (real-world readiness, 2-4 weeks after MVP)

Needed for early adopters building real apps. Multi-entity, production databases, interop.

| Feature | Description | Why |
|---------|------------|-----|
| **Entity Relationships** | `belongs_to`, `has_many` with foreign keys and cascade config | Real apps have related entities |
| **Cross-Entity Rules** | Rules spanning multiple entities (e.g., budget warnings) | Business logic crosses entity boundaries |
| **Postgres Support** | PostgreSQL adapter with native types and connection pooling | Production deployment |
| **Schema Versioning** | Version history, diff, rollback | Safe schema evolution |
| **Migration Generator** | Schema diff → SQL migration with review step | Apply changes to existing databases |
| **YAML → JSON Schema Compiler** | Compile to standard JSON Schema with custom vocabularies | Ecosystem interoperability |
| **OpenAI Function Generation** | Same as MCP generation but in OpenAI format | Support GPT-based agents |
| **Computed Fields** | Formula fields with dependency tracking | `total = quantity * price` |
| **Custom Roles** | Define roles beyond `owner` and `ai` | Team-based apps |
| **Prisma Import** | Convert Prisma schema → EzyForge YAML | Onboarding from existing projects |
| **SQL DDL Export** | Export schema as CREATE TABLE statements | Transparency and DBA handoff |
| **OpenAPI Export** | Generate OpenAPI 3.1 spec from schema | API documentation for free |

---

## P3 — Scale (open-source launch, 2-3 months after Phase 2)

Needed for community adoption and ecosystem growth.

| Feature | Description | Why |
|---------|------------|-----|
| **Workflow / State Machines** | Entity lifecycle states with valid transitions | Draft → Submitted → Approved patterns |
| **GoRules JDM Integration** | Complex decision tables for advanced business rules | Insurance, pricing, scoring use cases |
| **Template Inheritance** | Extend base templates with custom fields and rules | Customize without starting from scratch |
| **CRM Template** | Contacts, deals, pipeline, activities | Second most common business app |
| **Additional Templates** | Booking, inventory, invoicing, project tracking | Lower barrier to adoption |
| **Row-Level Permissions** | Filter data access by ownership or tenant | Multi-user apps |
| **Audit Trail** | Log every operation with caller, timestamp, changes | Compliance and debugging |
| **Supabase Import** | Import from Supabase schema introspection | Onboarding from Supabase projects |

---

## Out of Scope (by design)

| What | Why Not |
|------|---------|
| Web UI / visual schema editor | Developer-first. YAML is the interface. UI is a future community project. |
| Multi-tenant SaaS hosting | Ship the library/CLI first. Hosting comes after product-market fit. |
| Template marketplace | Start with built-in templates. Marketplace needs critical mass. |
| AI-generated schema suggestions | The AI is the operator, not the architect. Schema is human-defined. |
| Real-time / WebSocket subscriptions | Batch CRUD is sufficient for MVP use cases. |
| Custom action plugins | Built-in actions (reject, warn, tag, set_field) cover MVP needs. |
| Non-JS/TS runtimes | TypeScript first. Python SDK after Node adoption is proven. |
