You are a senior product manager writing a feature specification document.

Read these files first (in order):
1. DISCOVERY.md — product discovery findings
2. RESEARCH.md — market research
3. PROTOCOL-RESEARCH.md — schema format decision
4. RESEARCH-VALIDATION.md — pain point validation

## Context
EzyBusiness is a schema-first platform where developers define an entire business app in a YAML file — entities, fields, business rules, workflows, and permissions. The AI is NOT part of the schema. The schema is the business app definition. EzyBusiness enforces it at the data layer.

Core principle: **Schema is Law. AI is Operator. Owner is Governor.**

The corrected mental model:
- YAML schema = pure business app (data + rules + workflows + permissions)
- EzyBusiness runtime = reads schema, enforces rules, generates tools
- AI / App = just a consumer of the generated tools, cannot break the rules

## Your Task
Write FEATURES.md — a feature definition document that:

1. Lists all features EzyBusiness needs
2. For each feature: clearly defines what it does, why it exists, and what "done" looks like
3. Marks each feature as: MVP | Phase 2 | Phase 3 | Future
4. Keeps features honest — do not add features just to look complete

## Feature Categories to Cover

### Category 1: Schema Definition
What can a developer define in the YAML schema?
- Entity definition (fields, types, validations)
- Relationships between entities
- Business rules (pre/post hooks, conditions, actions)
- Workflow / state machines
- Permissions (owner, staff, AI roles)
- Schema metadata (version, lock status, owner)
- Template inheritance (extend a base schema)

### Category 2: Schema Compiler
How does YAML become a usable app?
- YAML parser and validator
- Schema version control
- Schema lock / unlock mechanism
- Schema diff / migration generator
- Template resolution

### Category 3: Rule Engine
How are business rules enforced?
- Before-create / before-update / before-delete hooks
- After-create / after-update hooks
- Condition evaluation (FEEL-like expressions)
- Actions: reject, warn, require_approval, set_field, notify
- Cross-entity rules (e.g. budget checks across two entities)
- Computed / formula fields

### Category 4: AI Tool Generator
How are tools generated for AI agents?
- Auto-generate MCP tool definitions from schema
- Auto-generate OpenAI function calling definitions
- Field-level permission enforcement in tools
- AI cannot get tools it has no permission to use
- No raw DB access for AI — only through generated tools

### Category 5: Data Layer
How is data stored?
- SQLite support (local, file-based)
- Postgres support (production)
- Auto-create tables from schema
- Migration management (apply schema changes safely)
- Data validation at write time (not just schema validation)

### Category 6: Permission System
Who can do what?
- Role definitions (owner, staff, ai, public)
- Entity-level permissions (CRUD per role)
- Field-level permissions (which fields each role can read/write)
- Row-level permissions (filter by ownership, tenant, etc.)
- Schema-change permissions (only owner can unlock)

### Category 7: Developer Tooling (CLI)
How does a developer use EzyBusiness?
- `ezybiz init` — create new app from template
- `ezybiz validate` — validate schema file
- `ezybiz migrate` — apply schema changes to DB
- `ezybiz generate` — output MCP tools, TypeScript types, etc.
- `ezybiz lock` / `ezybiz unlock` — lock/unlock schema
- `ezybiz serve` — run local dev server with REST API

### Category 8: Template Library
What pre-built schemas exist?
- Personal Expenses
- CRM (contacts, deals, pipeline)
- Appointment Booking
- Order Management
- Inventory
- Invoice / Billing
- Project / Task Tracking
- HR / Leaves

### Category 9: Import / Export
How does EzyBusiness connect to existing tools?
- Import from Prisma schema
- Import from Postgres (introspect tables)
- Import from CSV / Airtable
- Export to MCP tools
- Export to TypeScript types
- Export to OpenAPI spec
- Export to SQL DDL

### Category 10: Schema Governance
How is change managed?
- Schema versioning (semver)
- Lock mechanism (locked: true = AI cannot modify)
- Owner approval workflow for schema changes
- AI can propose changes (queued, not auto-applied)
- Schema change audit log

## For Each Feature Write:

```
### Feature Name
**Category:** [which category]
**Phase:** MVP | Phase 2 | Phase 3 | Future
**Summary:** One sentence — what this does
**Why:** Why this feature exists / what problem it solves
**Input:** What the developer provides
**Output:** What EzyBusiness produces
**Done when:** Specific, testable acceptance criteria (2-4 bullets)
**Dependencies:** What other features this needs
**Out of scope:** What this feature explicitly does NOT do
```

## Important Constraints
- MVP must be small enough to build in 1-2 weeks solo
- Be honest about what is truly needed vs nice-to-have
- No web UI in MVP — CLI + SDK only
- No multi-tenant in MVP — single app, single owner
- No cloud hosting in MVP — local only
- The dogfood test: Jazz must be able to use MVP for his personal expenses app

## Output
Save to: /mnt/d/openclaw-workspace/projects/ezybusiness/FEATURES.md

When done:
openclaw system event --text "Done: EzyBusiness FEATURES.md is ready" --mode now
