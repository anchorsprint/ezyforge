# EzyForge

**AI-safe business software, created and operated by your AI agent. Even we can't read your data.**

---

## The Problem

AI agents that write to your database drift, invent field names, and ignore business rules. And every SaaS platform you use can read your data — their engineers, their support staff, anyone with a subpoena.

EzyForge solves both: deterministic business rules enforced at the data layer, and zero-knowledge encryption so not even the platform can see your records.

## How It Works

**1. Tell your AI to create an app:**

```
You: "Create me a personal expenses tracker on EzyForge"

AI:  Setting up your expenses app...
     ✅ App created from expenses template
     ✅ MCP endpoint live at mcp.ezyforge.io/app/abc-123
     ✅ Connected and ready

     I can now: log expenses, update notes and categories, query spending.
     I cannot: delete expenses, change amounts, or log future dates.
     Your data is encrypted — even EzyForge engineers can't read it.
```

No browser. No signup form. No copy-paste. Your AI handles everything.

**2. Your schema defines the rules:**

```yaml
entities:
  expense:
    fields:
      amount:   { type: decimal, required: true, min: 0.01 }
      currency: { type: enum, values: [MYR, SGD, USD], default: MYR }
      category: { type: enum, values: [food, transport, utilities, other] }
      merchant: { type: string, required: true }
      date:     { type: date, required: true }
      notes:    { type: string, optional: true }

    rules:
      - name: no_future_dates
        condition: "date <= today()"
        error: "Expense date cannot be in the future"

    ai_permissions:
      create: true
      read: true
      update: { allowed_fields: [notes, category] }
      delete: false
```

**3. AI operates within your rules:**

```
You: "Log lunch at McDonald's, RM 15, yesterday."
AI:  ✅ Created expense #47.

You: "Delete that expense."
AI:  ❌ I don't have a delete tool.

You: "Change the amount to 0."
AI:  ❌ Rejected — amount is not in my allowed fields.

You: "Log a meal for next Friday."
AI:  ❌ Rejected — expense date cannot be in the future.
```

No prompt engineering. No custom middleware. The dangerous operations don't exist in the AI's toolset.

**4. AI proposes improvements:**

```
You: "I've been logging tips separately, can you add a tip field?"

AI:  I'll propose adding a tip field to your expenses schema.
     → Proposal sent to EzyForge for your approval.

[You get a notification — email, push, or in-chat]
[You approve with one tap]

AI:  ✅ Schema updated! I can now log tips on expenses.
```

Schema evolves through conversation, not dashboard editing.

## Zero-Knowledge Privacy

Your data is encrypted with a key only you hold. EzyForge uses envelope encryption (AES-256) where:

- Your master key is derived from your password and never leaves your device
- Each app has its own encryption key, encrypted with your master key
- Business data (amounts, merchants, notes) is encrypted before storage
- EzyForge engineers cannot decrypt your data — even if they wanted to

| Who | Can read your data? |
|-----|-------------------|
| You | Yes |
| Your approved AI agent | Yes (scoped token, runtime only) |
| EzyForge engineers | **No** |
| Database administrators | **No** |
| Anyone with a subpoena to EzyForge | **No** |

This isn't a privacy policy. It's a cryptographic guarantee.

## Core Concepts

- **Schema is Law** — Business logic defined in YAML, enforced at the data layer. Deterministic and unbypassable.
- **AI is Operator** — AI agents get auto-generated tools scoped to exactly what they're allowed to do.
- **Owner is Governor** — Schema changes require explicit approval. AI proposes, owner approves.
- **Agent is Primary** — The AI creates your app, operates your data, and proposes improvements. The dashboard is for exceptions.
- **Zero Knowledge** — Your data is encrypted with your key. Not even the platform can read it.

## The Interaction Model

```
Human ←→ AI Agent ←→ EzyForge Cloud       ← primary (daily operations)
Human ←→ Web Dashboard ←→ EzyForge Cloud   ← secondary (admin/config)
```

**What the agent does:** Creates apps, logs data, queries records, proposes schema changes — everything operational.

**What the dashboard does:** Manage API tokens, review audit trail, approve complex schema proposals, billing. Think: AWS Console — you *can* use it, but you usually don't need to.

## For Developers

The `forge` CLI lets you manage apps from the terminal:

```bash
forge login                          # Authenticate
forge init my-expenses --template expenses  # Create app
forge pull                           # Download schema
forge push                           # Upload changes
forge validate                       # Check locally
forge connect claude                 # Configure AI
```

## Feature Status

| Feature | Status |
|---------|--------|
| Agentic app creation (AI creates apps via API) | 📋 Planned |
| Agentic schema proposals (AI proposes, human approves) | 📋 Planned |
| MCP endpoint hosting (always-on, per-app) | 📋 Planned |
| YAML schema definition (entities, fields, rules) | 📋 Planned |
| Zero-knowledge encryption | 📋 Planned |
| FEEL-inspired rule engine | 📋 Planned |
| AI field-level permissions | 📋 Planned |
| MCP tool generation | 📋 Planned |
| AI token management | 📋 Planned |
| CLI (login, init, pull, push, validate, connect) | 📋 Planned |
| Schema versioning and rollback | 📋 Planned |
| Web dashboard (admin/config — secondary) | 📋 Planned |
| Template marketplace | 📋 Planned |

## Roadmap

1. **P1 — Agentic Core:** Agent creates apps via API, MCP endpoints, zero-knowledge encryption, rule engine, AI permissions, CLI, expenses + CRM templates.
2. **P2 — Growth:** Web dashboard (admin), approval workflow UI, entity relationships, billing, team sharing, OpenAI function support.
3. **P3 — Ecosystem:** Template marketplace, state machines, searchable encryption, import tools, mobile dashboard.

## License

MIT
