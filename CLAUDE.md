# EzyForge — Agent Instructions

## What This Project Is

EzyForge is a schema-first runtime for AI agents. Developers define business entities, rules, and AI permissions in a YAML schema file. EzyForge generates MCP-compatible tools, enforces business rules deterministically at the data layer, and ensures AI agents can never touch fields or operations not explicitly allowed.

**Core principle:** Schema is Law. AI is Operator. Owner is Governor.

## Key Docs (read before working)

- `docs/NORTH-STAR.md` — product mission, beliefs, what we never build
- `docs/PROBLEM.md` — the problem we solve and who we solve it for
- `docs/ARCHITECTURE.md` — system components and data flow
- `docs/FEATURES.md` — P1/P2/P3 feature list with acceptance criteria

## Project Structure

```
ezyforge/
├── CLAUDE.md           ← you are here
├── README.md           ← public GitHub landing page
├── docs/               ← all product documentation
│   ├── NORTH-STAR.md
│   ├── PROBLEM.md
│   ├── ARCHITECTURE.md
│   ├── FEATURES.md
│   └── ...
├── src/                ← source code (to be created)
├── packages/           ← monorepo packages (to be created)
└── templates/          ← built-in schema templates (to be created)
```

## What to Build

### P1 — Core Loop (build this first)
1. **Schema Parser** — YAML → validated schema object
2. **SQLite Data Layer** — auto-create tables from schema
3. **Rule Engine** — FEEL-like condition evaluator + before/after hooks
4. **Permission Layer** — AI field-level access enforcement
5. **MCP Tool Generator** — auto-generate tools from schema + permissions
6. **Tool Execution Runtime** — tool call → permissions → rules → DB → response
7. **CLI** — `forge init`, `forge validate`, `forge serve`, `forge lock`
8. **Expenses Template** — dogfood test schema

### The Dogfood Test
Build must pass this: Jazz runs `forge init my-expenses --template expenses`, then `forge serve`, connects Claude via MCP, and:
- AI can create expenses ✅
- AI can update notes and category only ✅
- AI cannot change amount or date ❌ (rejected)
- AI cannot delete ❌ (no tool generated)
- AI cannot write future dates ❌ (rule engine blocks)
- Schema stays exactly as defined ✅

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Schema format:** YAML (authoring) → JSON Schema (runtime)
- **Database:** SQLite (MVP), Postgres (Phase 2)
- **MCP:** Model Context Protocol (primary AI integration)
- **Package manager:** pnpm
- **Build:** tsup or tsc

## Code Rules

- **No prompt-based guardrails.** Rules must live in the data layer. Never rely on telling an LLM to "be careful."
- **Deterministic first.** Same input always produces same output. No randomness in rule evaluation.
- **Fail loudly.** Errors must be structured and explicit: `{ error: "rule_violation", rule: "no_future_dates", message: "..." }`. Never silent failures.
- **Schema is immutable at runtime.** Once parsed, the schema object cannot be modified. Treat it as frozen.
- **Tools are generated, not hand-coded.** Never write a tool definition by hand — always generate from the schema.
- **No raw SQL access for AI.** AI agents must go through the tool execution pipeline. Never expose a raw query tool.

## Testing

- Unit test the rule evaluator with at least: comparisons, date functions, boolean logic, null handling, invalid expressions
- Integration test the full pipeline: schema → tool generation → tool execution → DB → rules enforced
- The expenses template schema must be the canonical integration test

## What We Never Build (from NORTH-STAR.md)

1. An AI model or AI wrapper
2. A general-purpose database
3. Prompt-based guardrails

## Git Conventions

- Branch: `feat/`, `fix/`, `chore/`
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- PRs: one feature per PR, must include tests

## Before You Commit

- `pnpm typecheck` passes
- `pnpm test` passes
- `pnpm lint` passes
- The expenses dogfood test works end-to-end
