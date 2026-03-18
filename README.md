# EzyForge

**Define your business schema once. AI operates within it — never outside it.**

---

## The Problem

AI agents that write to databases drift, invent field names, ignore business rules, and can't be constrained to specific fields. Every team building agentic apps ends up writing custom guardrails from scratch. No product combines schema enforcement, AI field-level permissions, and deterministic business rules in one package.

## The Solution

EzyForge is a schema-first runtime for AI agents. You define your entities, rules, and AI permissions in a YAML file. EzyForge generates MCP-compatible tools that AI agents can call, enforces every rule deterministically at the data layer, and ensures AI can never touch fields or operations you haven't explicitly allowed.

## How It Works

**1. Define your schema:**

```yaml
# ezybusiness.schema.yaml
app: personal-expenses
version: "1.0.0"
locked: true

storage:
  engine: sqlite
  path: ./data/expenses.db

entities:
  expense:
    table: expenses
    fields:
      id:       { type: uuid, generated: true, primary_key: true }
      amount:   { type: decimal, required: true, min: 0.01, max: 999999.99 }
      currency: { type: enum, values: [MYR, SGD, USD], default: MYR }
      category: { type: enum, values: [food, transport, entertainment, utilities, other] }
      merchant: { type: string, required: true, max_length: 100 }
      date:     { type: date, required: true }
      notes:    { type: string, optional: true }

    rules:
      - name: no_future_dates
        when: before_create, before_update
        condition: "date <= today()"
        error: "Expense date cannot be in the future"

    ai_permissions:
      create: true
      read: true
      update: { allowed_fields: [notes, category] }  # AI can't change amount or date
      delete: false                                    # AI can never delete
      can_change_schema: false
```

**2. Start the server:**

```bash
forge serve
# ✓ Schema valid (1 entity, 4 rules)
# ✓ Database ready (./data/expenses.db)
# ✓ MCP server listening on localhost:3737
# ✓ 4 tools generated: create_expense, get_expense, list_expenses, update_expense
#   (delete_expense not generated — ai_permissions.delete is false)
```

**3. AI agents call the generated tools.** Rules are enforced. Permissions are checked. Schema cannot drift.

## Quick Start

```bash
npm install -g forge
forge init my-expenses --template expenses
cd my-expenses
forge serve
```

## Core Concepts

- **Schema is Law** — Business logic is defined in YAML, not in prompts. Rules are deterministic and cannot be bypassed by any AI model.
- **AI is Operator** — AI agents get auto-generated tools scoped to exactly what they're allowed to do. No delete tool? The AI doesn't even know deletion is possible.
- **Owner is Governor** — Schema changes require explicit unlock. The AI proposes, the owner approves. Lock the schema and sleep soundly.

## Feature Status

| Feature | Status |
|---------|--------|
| YAML schema definition (entities, fields, rules) | 📋 Planned |
| FEEL-inspired rule engine | 📋 Planned |
| AI field-level permissions | 📋 Planned |
| MCP tool generation | 📋 Planned |
| Tool execution runtime (permission → validation → rules → DB) | 📋 Planned |
| SQLite data layer | 📋 Planned |
| CLI (init, validate, generate, serve, lock/unlock) | 📋 Planned |
| Expenses template | 📋 Planned |
| TypeScript type generation | 📋 Planned |
| Entity relationships | 📋 Planned |
| PostgreSQL support | 📋 Planned |
| Schema versioning & migrations | 📋 Planned |
| OpenAI function calling generation | 📋 Planned |

## Roadmap

1. **MVP (P1):** Schema definition, rule engine, AI permissions, MCP tool generation, SQLite, CLI, expenses template — prove the core loop works.
2. **Real-World (P2):** Entity relationships, Postgres, migrations, schema versioning, OpenAI/OpenAPI output, Prisma import — ready for early adopters.
3. **Ecosystem (P3):** State machines, GoRules decision tables, template library, row-level permissions, audit trail — ready for open-source community.

## Contributing

EzyForge is open source (MIT). Contributions welcome — especially:
- Schema templates for new business domains
- Database adapter implementations
- AI framework integrations

## License

MIT
