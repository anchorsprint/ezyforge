You are a senior product architect. Read ALL docs in docs/ folder first, plus CLAUDE.md and README.md.

## Major Direction Change

EzyForge is now a **cloud-first SaaS platform**, NOT a CLI/self-hosted tool.

Key decisions from the founder:
1. No local database, no local engine, no self-hosted option
2. Cloud-only: sign up → pick template → deploy → get MCP endpoint
3. `forge` CLI is a helper only (login, pull/push schema, connect LLM) — not the product
4. Strong privacy: only approved LLM tokens can access data. EVEN THE PLATFORM OWNER (EzyForge team) CANNOT read user data.

## The Product Flow (confirmed by founder)

1. User signs up at ezyforge.io
2. Picks template (expenses, CRM, booking, etc.)
3. Reviews/edits schema (web UI or YAML via CLI)
4. Deploys → gets MCP endpoint + API token
5. Connects AI agent (e.g. OpenClaw) using the MCP URL + token
6. AI operates within schema rules
7. AI can propose schema changes → user approves via UI or email
8. User sees data + AI activity in dashboard

## Critical Privacy Requirement

Jazz specifically said: "only approved LLM can access, and even platform owner unable to read the data"

This means:
- **End-to-end encryption at rest** — user data encrypted with user's key
- **Zero-knowledge architecture** — EzyForge platform cannot decrypt user data
- **Per-app encryption keys** — each app has its own key, held by the user
- **Approved AI tokens only** — each AI agent gets a scoped token, revocable
- **Audit log** — every AI access is logged, visible to app owner
- **No platform backdoor** — EzyForge engineers cannot access user business data, period

Research how to implement this practically:
- Envelope encryption (AWS KMS / user-held keys)
- Client-side encryption before storage
- Encrypted Postgres columns (pgcrypto / application-level)
- How does this affect query/search/aggregation capabilities?
- Tradeoffs: full E2E encryption vs searchable encryption vs column-level encryption
- What do similar platforms do? (Basecamp, ProtonMail, Tresorit, Standard Notes)

## Your Task — Update These Documents

### 1. docs/ARCHITECTURE.md — Full Rewrite
New architecture for cloud platform:
- Cloud infrastructure (hosting, databases, auth)
- Multi-tenant isolation
- Zero-knowledge privacy model
- MCP hosting (always-on endpoints per app)
- Web UI / Dashboard
- CLI as helper tool
- Approval workflow system
- The engine kernel (same: parser → rules → permissions → tools → DB)

Include ASCII architecture diagram.

### 2. docs/PROBLEM.md — Update
Add privacy as a pain point:
- Current SaaS vendors CAN read your data
- When AI operates your business, the data is even MORE sensitive
- Business owners need to trust that their data is truly private

### 3. docs/NORTH-STAR.md — Update
- Add privacy belief: "Your data is yours. Not even we can read it."
- Update "What We Never Build": add "A platform that can access user data"
- Update promise to include privacy
- Add winning signal: "A user asks 'can you see my data?' and the honest answer is 'no, we literally can't'"

### 4. docs/FEATURES.md — Rewrite
Reorganize for cloud platform. New feature categories:
- Platform (auth, multi-tenant, billing)
- Schema Management (editor, versioning, approval workflow)
- Engine (parser, rules, permissions, tools — same as before)
- AI Integration (MCP hosting, token management, activity log)
- Privacy & Security (encryption, zero-knowledge, audit trail)
- Dashboard (data viewer, AI activity, rule violations)
- CLI (login, pull, push, connect, logs)
- Templates (marketplace)

Keep P1/P2/P3 prioritization. P1 must include basic cloud deployment.

### 5. README.md — Rewrite
Cloud-first landing page. Show the user flow:
- Sign up → template → deploy → connect AI → done
- Emphasize: "Even we can't read your data"
- No npm install in quick start — it's a web signup

### 6. CLAUDE.md — Update
Update tech stack, project structure, and build priorities for cloud platform.

## Output
Overwrite all 6 files in place. Save to their existing paths.

When done:
openclaw system event --text "Done: EzyForge docs fully updated to cloud-first with zero-knowledge privacy" --mode now
