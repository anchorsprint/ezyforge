# EzyForge — Feature List

> **Guiding principle:** Schema is Law. AI is Operator. Owner is Governor. Your data is yours — not even we can read it. Agents are the primary interface. Dashboards are for exceptions.

---

## P1 — Agentic Core (prove the agent-first model works)

The minimum needed for an AI agent to create an app, operate data, and propose schema changes — with zero-knowledge privacy from day one.

### Agentic App Lifecycle

This is the key differentiator. The AI agent is the primary interface — not a web dashboard.

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **Agentic App Creation** | AI agent calls REST API to create app from template. No web UI needed. | The agent is the primary interface | POST /api/apps with template name, returns app_id + MCP endpoint + token + tool list within 30 seconds. Agent can immediately start operating. |
| **Agentic Onboarding** | Agent discovers available templates, creates app, auto-configures MCP connection, reports capabilities to human. | Zero-friction setup through conversation | Agent can list templates (GET /api/templates), create app, connect, and confirm readiness in a single conversation turn. Human never opens a browser. |
| **Agentic Schema Proposals** | Agent proposes schema changes (add field, add rule), human approves via notification. | Schema evolves through usage, not dashboard editing | POST /api/apps/{id}/proposals with change spec. Human notified via email/push/in-chat. Approve/reject without opening dashboard. Schema versioned on approval. |
| **MCP Endpoint Hosting** | Always-on MCP endpoint per deployed app. | AI agents need a persistent connection point | mcp.ezyforge.io/app/{app_id}, token-authenticated, MCP over HTTP (streamable), tools discoverable. |
| **AI Token Management** | Create, revoke, and scope tokens for AI agents. | Control which AIs can access which apps | Per-app tokens with expiry, one-click revoke, token activity visible in audit log. |
| **Activity Log** | Log every AI tool call with parameters and result. | Transparency — user sees what the AI did | Filterable by tool, result, and time. Encrypted with app's data key. |

### Engine (runs server-side)

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **Schema Parser** | YAML → validated, immutable schema object. | Foundation of the engine | Strict validation with clear error messages. Pure function, no side effects. |
| **Business Rules** | Deterministic before/after CRUD rules with FEEL-inspired conditions. | The killer feature — rules in schema, not prompts | `when: before_create/before_update/after_create` hooks. Conditions: comparisons, boolean ops, `today()`, `IN`. Actions: `reject`, `warn`, `require_approval`, `tag`, `set_field`. |
| **AI Permissions** | Field-level access control for AI agents per entity. | What no other product offers | CRUD-level toggles (create/read/update/delete: true/false). `update: { allowed_fields: [...] }`. `delete: false` → no delete tool generated. |
| **FEEL-Inspired Evaluator** | Sandboxed expression language for rule conditions. | Safe, readable, LLM-friendly conditions | Comparisons, boolean logic, arithmetic. `today()`, `now()`, `day_of_week()`, `contains()`, `IN`. Sandboxed — no file I/O, no network, no code execution. |
| **Permission Enforcement** | Dedicated layer checking AI permissions on every operation. | Defense in depth | CRUD-level and field-level checks. Runs before validation and rules. Cannot be bypassed. |
| **MCP Tool Generation** | Auto-generate MCP tool definitions from schema. | Primary AI integration path | Permission-aware: no tool for forbidden operations. Input schemas include field constraints. Valid MCP JSON output. |
| **Tool Execution Runtime** | Execute tool calls through permission → validation → rules → DB pipeline. | The enforcement loop | Single execution path for all callers. Structured errors: `permission_denied`, `rule_violation`, `validation_error`. Atomic transactions. |
| **Field Validation** | Validate every field against schema constraints before write. | Data integrity at the type level | Required, type, range, length, enum, pattern checks. Multiple errors returned together. |

### Platform

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **User Auth** | Sign up / login via email + OAuth (Google, GitHub). | Can't have a platform without accounts | Clerk or Auth.js integration. JWT session tokens. Password-derived master encryption key generated on signup. |
| **Agent Authentication** | API key auth for agents to create and manage apps. | Agents need programmatic access | API keys with scopes. Agents create apps via REST API. No browser required. |
| **App Deployment** | Deploy schema → spin up MCP endpoint + REST API. | The product's core value | Endpoint live within 30 seconds. Tools generated and discoverable. |
| **Multi-Tenant Isolation** | Each app is logically isolated — schema, data, tokens. | Security foundation | All queries scoped by `app_id`. No cross-app data access. Per-app encryption keys. |

### Privacy & Security

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **Envelope Encryption** | Per-app encryption keys, encrypted with user's master key. | Zero-knowledge foundation | AES-256-GCM for sensitive fields. AES-SIV for filterable fields. App Data Key never stored in plaintext. |
| **Zero-Knowledge Architecture** | Platform cannot decrypt user business data. | The core privacy promise | Engineers cannot read user data. DB contains only ciphertext for business fields. No admin panel for viewing user data. |
| **Master Key Derivation** | User's master key derived from password, stays client-side. | User holds the only key | PBKDF2 or Argon2 derivation. Key never sent to server in plaintext. Optional recovery phrase. |

### Schema Management

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **Entity Definition** | Define entities with typed fields, constraints, and validations in YAML. | Foundation — without this, nothing works | 10+ field types (string, decimal, enum, date, uuid, etc.). `required`, `default`, `min/max`, `pattern` constraints. Generated fields (id, timestamps) with `auto: now`. |
| **Schema Lock** | Lock/unlock mechanism to freeze schema from modification. | Core governance primitive | `locked: true` blocks all schema changes. Lock state logged with timestamps. |
| **Schema Versioning** | Every deploy creates a new version; rollback to any version. | Safe schema evolution from day one | Version history. One-click rollback. Diff view between versions. |

### Templates

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **Expenses Template** | Complete schema for personal expense tracking. | Dogfood test — Jazz uses this | expense entity with rules and AI permissions. Production-quality, not a toy. |
| **CRM Template** | Contacts, deals, pipeline. | Second most common business app | Contact + deal entities with relationships. AI can create/read, restricted update, no delete. |

### CLI

| Feature | Description | Why | Acceptance Criteria |
|---------|------------|-----|-------------------|
| **`forge login`** | Authenticate with ezyforge.io. | Required for all CLI operations | OAuth or API key auth. Stores session locally. |
| **`forge init`** | Create new app from template (calls cloud API). | Developer-friendly app creation | `--template expenses` creates full app. Returns MCP endpoint URL. |
| **`forge pull` / `forge push`** | Sync schema between local YAML and cloud. | Edit schema locally, deploy to cloud | Pull downloads current schema. Push validates and deploys. Conflict detection. |
| **`forge validate`** | Check schema for errors locally. | Fast feedback loop, works offline | Errors with field paths. Exit code 0/1 for CI integration. |
| **`forge connect`** | Configure local LLM to use cloud MCP endpoint. | Quick AI setup | Outputs MCP config for Claude, OpenClaw, etc. |

---

## P2 — Growth (real-world readiness)

Needed for early adopters building real apps and for business viability. Dashboard features live here — useful but not the primary interface.

| Feature | Description | Why |
|---------|------------|-----|
| **Web Dashboard** | Admin interface for token management, audit trail, schema review, billing. | Some tasks need visual UI. NOT for daily operations — admin/config only. |
| **Dashboard Data Viewer** | Browse app data (decrypted client-side). | Users occasionally need to see raw data. Table view, pagination, filter/sort, client-side decrypt. |
| **Schema Editor** | Web-based YAML editor with validation and preview. | Not everyone edits YAML locally. Syntax highlighting, validation, preview of generated tools. |
| **Approval Workflow UI** | Review and approve schema proposals in dashboard. | Visual diff for complex changes. Diff view, approve/reject, notification settings. |
| **Entity Relationships** | `belongs_to`, `has_many` with foreign keys and cascade config. | Real apps have related entities. |
| **Cross-Entity Rules** | Rules spanning multiple entities (e.g., budget warnings). | Business logic crosses entity boundaries. |
| **Computed Fields** | Formula fields with dependency tracking (`total = qty * price`). | Common business need. |
| **Custom Roles** | Define roles beyond `owner` and `ai`. | Team-based apps. |
| **Billing & Subscriptions** | Free tier, paid plans, usage-based pricing. | Revenue. |
| **OpenAI Function Generation** | Generate tools in OpenAI function calling format. | Support GPT-based agents. |
| **Key Recovery** | Recovery phrase to restore access if password is lost. | Users will lose passwords. |
| **Webhook Notifications** | Notify external systems on events (rule violations, approvals). | Integration with existing workflows. |
| **Team Sharing** | Share an app with team members (each with their own key). | Collaborative use. |
| **REST API Docs** | Auto-generated OpenAPI spec per app. | Developer convenience. |

---

## P3 — Scale (ecosystem growth)

Needed for broader adoption and market expansion.

| Feature | Description | Why |
|---------|------------|-----|
| **Template Marketplace** | Community-contributed templates, browseable and forkable. | Lower barrier to adoption for new verticals. |
| **Workflow / State Machines** | Entity lifecycle states with valid transitions. | Draft → Submitted → Approved patterns. |
| **Additional Templates** | Booking, inventory, invoicing, project tracking. | Cover more business types. |
| **Row-Level Permissions** | Filter data access by ownership or tenant. | Multi-user apps with data isolation. |
| **Searchable Encryption** | Enable richer queries on encrypted data. | Overcome zero-knowledge search limitations. |
| **Prisma / Supabase Import** | Convert existing schemas to EzyForge format. | Onboarding from existing projects. |
| **GoRules JDM Integration** | Complex decision tables for advanced business rules. | Insurance, pricing, scoring use cases. |
| **Mobile Dashboard** | Responsive dashboard or native app. | Business owners check data on phones. |
| **Audit Trail Export** | Export audit logs for compliance reporting. | Regulated industries need this. |
| **Usage Analytics** | Platform-level analytics (no user data access). | Product improvement, not surveillance. |

---

## Out of Scope (by design)

| What | Why Not |
|------|---------|
| Self-hosted deployment | Cloud is the product. Maintaining two deployment models splits focus. |
| AI model or AI wrapper | We're the boundary between AI and data, not the AI itself. |
| Prompt-based guardrails | Rules live in the data layer, never in prompts. |
| Admin panel to view user data | Zero-knowledge means zero-knowledge. No backdoors, ever. |
| Real-time / WebSocket subscriptions | Batch CRUD is sufficient for MVP use cases. |
| Non-JS/TS runtimes | TypeScript first. Other SDKs after adoption is proven. |
| Platform-side analytics on user data | We can't read it. We won't build the ability to. |
| Dashboard-first design | Agents are the primary interface; dashboard is for exceptions. |
