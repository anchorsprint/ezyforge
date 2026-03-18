# EzyForge — Agent Instructions

## What This Project Is

EzyForge is a cloud-first SaaS platform for AI-safe business software. Users sign up, pick a template, deploy a schema, and get an MCP endpoint their AI agent connects to. The platform enforces business rules deterministically at the data layer and uses zero-knowledge encryption so not even EzyForge engineers can read user data.

**Core principle:** Schema is Law. AI is Operator. Owner is Governor. Your data is yours.

## Key Docs (read before working)

- `docs/NORTH-STAR.md` — product mission, beliefs, what we never build
- `docs/PROBLEM.md` — the problem we solve and who we solve it for
- `docs/ARCHITECTURE.md` — cloud infrastructure, zero-knowledge model, system components
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
├── apps/
│   └── web/            ← Next.js dashboard + marketing site
├── packages/
│   ├── engine/         ← core engine kernel (parser, rules, permissions, tools, runtime)
│   ├── crypto/         ← encryption layer (envelope encryption, key derivation)
│   ├── cli/            ← forge CLI
│   └── shared/         ← shared types and utilities
├── templates/          ← built-in schema templates (expenses, CRM, etc.)
└── infra/              ← deployment config (Vercel, Railway, DB)
```

## What to Build

### P1 — Core Cloud Platform (build this first)

1. **Engine Kernel** (same core, now server-side)
   - Schema Parser — YAML → validated schema object
   - Rule Engine — FEEL-like condition evaluator + before/after hooks
   - Permission Layer — AI field-level access enforcement
   - MCP Tool Generator — auto-generate tools from schema + permissions
   - Tool Execution Runtime — tool call → permissions → rules → DB → response
   - Field Validation — type, range, enum, required checks

2. **Cloud Platform**
   - User auth (Clerk or Auth.js)
   - App creation from templates
   - App deployment → MCP endpoint provisioning
   - Multi-tenant isolation (logical, per-app)
   - Postgres data layer (encrypted)

3. **Zero-Knowledge Encryption**
   - Master key derivation (PBKDF2/Argon2, client-side)
   - Per-app envelope encryption (AES-256-GCM + AES-SIV)
   - Client-side decryption for dashboard
   - Runtime decryption for AI tool execution (in-memory only)

4. **Web Dashboard**
   - Data viewer (client-side decryption)
   - AI activity log
   - Schema editor (YAML with validation)
   - AI token management

5. **CLI** (`forge`)
   - `forge login`, `forge init`, `forge pull`, `forge push`
   - `forge validate` (offline), `forge connect` (AI setup)
   - Helper tool, not the product

6. **Templates**
   - Expenses template (dogfood test)
   - CRM template

### The Dogfood Test

Build must pass this: Jazz signs up at ezyforge.io, picks the expenses template, deploys, connects OpenClaw via MCP, and:
- AI can create expenses ✅
- AI can update notes and category only ✅
- AI cannot change amount or date ❌ (rejected by permission layer)
- AI cannot delete ❌ (no tool generated)
- AI cannot write future dates ❌ (rule engine blocks)
- Schema stays exactly as defined ✅
- Jazz can view data in dashboard (decrypted client-side) ✅
- EzyForge engineers cannot read Jazz's data ✅ (zero-knowledge)

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Frontend:** Next.js + Tailwind CSS
- **Schema format:** YAML (authoring) → JSON Schema (runtime)
- **Database:** Postgres (Neon or Supabase managed) — encrypted at application level
- **Auth:** Clerk or Auth.js
- **Encryption:** AES-256-GCM (sensitive fields), AES-SIV (filterable fields), Argon2/PBKDF2 (key derivation)
- **MCP Transport:** HTTP (streamable), always-on endpoints
- **Hosting:** Vercel (dashboard/web) + Railway or Fly.io (engine/MCP endpoints)
- **Package manager:** pnpm
- **Monorepo:** Turborepo
- **Build:** tsup or tsc

## Code Rules

- **No prompt-based guardrails.** Rules must live in the data layer. Never rely on telling an LLM to "be careful."
- **Deterministic first.** Same input always produces same output. No randomness in rule evaluation.
- **Fail loudly.** Errors must be structured and explicit: `{ error: "rule_violation", rule: "no_future_dates", message: "..." }`. Never silent failures.
- **Schema is immutable at runtime.** Once parsed, the schema object cannot be modified. Treat it as frozen.
- **Tools are generated, not hand-coded.** Never write a tool definition by hand — always generate from the schema.
- **No raw SQL access for AI.** AI agents must go through the tool execution pipeline. Never expose a raw query tool.
- **Zero-knowledge always.** Never write code that stores, logs, or transmits user business data in plaintext outside of in-memory processing. No admin panels, no debug dumps, no analytics on user content.
- **Encrypt before write, decrypt after read.** All business data fields must pass through the crypto layer. Platform metadata (app_id, timestamps, token hashes) is not encrypted — only user business content.

## Testing

- Unit test the rule evaluator with at least: comparisons, date functions, boolean logic, null handling, invalid expressions
- Unit test the encryption layer: key derivation, envelope encrypt/decrypt, AES-SIV determinism, AES-GCM randomness
- Integration test the full pipeline: schema → tool generation → tool execution → encrypted DB → rules enforced
- Integration test multi-tenant isolation: app A cannot access app B's data or schema
- The expenses template schema must be the canonical integration test
- Zero-knowledge verification: write a test that proves the platform DB contains only ciphertext for business fields

## What We Never Build (from NORTH-STAR.md)

1. An AI model or AI wrapper
2. A general-purpose database
3. Prompt-based guardrails
4. A platform that can access user data
5. A self-hosted product

## Git Conventions

- Branch: `feat/`, `fix/`, `chore/`
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- PRs: one feature per PR, must include tests

## Before You Commit

- `pnpm typecheck` passes
- `pnpm test` passes
- `pnpm lint` passes
- The expenses dogfood test works end-to-end
- No plaintext user data in logs, error messages, or test fixtures
