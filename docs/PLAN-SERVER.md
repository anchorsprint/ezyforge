# PLAN-SERVER — apps/forge-server

Single Hono process hosting Platform API + per-app MCP endpoints. Node.js, Postgres, custom email OTP auth.

---

## 1. Route Structure

All routes return JSON. Auth column: `none` = public, `session` = JWT cookie or Bearer token, `api-key` = API key header, `app-token` = MCP token, `console` = session-only (no API key).

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/initiate` | none | Send OTP to email |
| POST | `/api/auth/verify` | none | Verify OTP, return session + API key |

### Apps

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/apps` | api-key | Create app from template (draft) |
| GET | `/api/apps` | session | List owner's apps |
| GET | `/api/apps/:id` | session | Get app details + status |
| POST | `/api/apps/:id/approve` | session | Owner approves → published |
| POST | `/api/apps/:id/reject` | session | Owner rejects → draft |

### Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/templates` | none | List available templates |
| GET | `/api/templates/:name` | none | Get template detail + schema preview |

### Tokens (console-only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/apps/:id/tokens` | console | Create additional app token |
| GET | `/api/apps/:id/tokens` | console | List tokens for app |
| DELETE | `/api/apps/:id/tokens/:tokenId` | console | Revoke token |

### Activity & Data (console-only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/apps/:id/activity` | console | Paginated activity log |
| GET | `/api/apps/:id/data/:entity` | console | Read entity rows (data viewer) |

### MCP

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/mcp/:appId` | app-token | Streamable HTTP MCP endpoint |

---

## 2. Auth Flow

### OTP Generation

```typescript
// POST /api/auth/initiate
interface InitiateRequest {
  email: string; // validated, lowercased, trimmed
}
interface InitiateResponse {
  ok: true;
  message: "otp_sent";
}
```

- Generate 6-digit code, hash with SHA-256 before storing
- 10 minute expiry, max 3 attempts per code
- Rate limit: 3 OTP requests per email per 15 minutes
- Send via email provider (see section 7)
- Always return `otp_sent` even if email doesn't exist (prevent enumeration)

### OTP Verification

```typescript
// POST /api/auth/verify
interface VerifyRequest {
  email: string;
  otp: string;
  client_type: "console" | "agent"; // determines what's returned
}

// client_type = "console"
interface VerifyConsoleResponse {
  ok: true;
  account_id: string;
  // + Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
}

// client_type = "agent"
interface VerifyAgentResponse {
  ok: true;
  account_id: string;
  api_key: string; // returned once, plaintext — agent stores it
}
```

- Compare SHA-256 hash of submitted OTP against stored hash
- Increment `attempts` on failure, mark `used` on success
- Create account if email doesn't exist (upsert)
- **Console:** issue JWT session token (7-day expiry), set as HttpOnly cookie
- **Agent:** generate API key (prefix `ek_`, 32 random bytes base62), store SHA-256 hash, return plaintext once

### JWT Structure

```typescript
interface SessionPayload {
  sub: string;      // account_id
  iat: number;
  exp: number;      // 7 days
}
```

Sign with HS256 using `SESSION_SECRET` env var. Middleware extracts from cookie or `Authorization: Bearer <jwt>`.

### API Key Auth

Agent sends `Authorization: ApiKey ek_...`. Middleware hashes value, looks up in `api_keys` table, resolves `account_id`. No expiry — revocable only.

---

## 3. App Lifecycle

```
draft → pending_approval → published
  ↑          │
  └──────────┘  (reject)
```

```typescript
type AppStatus = "draft" | "pending_approval" | "published";
```

**Transitions:**

| From | To | Trigger | Side Effects |
|------|----|---------|--------------|
| — | draft | `POST /api/apps` | Schema stored as YAML + parsed JSON |
| draft | pending_approval | Automatic after create | Approval email sent to owner |
| pending_approval | published | `POST /api/apps/:id/approve` | Schema locks, entity tables created, first app_token auto-issued, MCP goes live |
| pending_approval | draft | `POST /api/apps/:id/reject` | Owner can modify and resubmit |

**On publish:**
1. Parse schema YAML → validate → store frozen JSON in `schema_json`
2. Create entity tables (see section 6)
3. Generate first `app_token` with name `"onboarding-agent"`, return token in approval response AND in the approval confirmation email
4. MCP endpoint becomes active for this `appId`

**Tricky part:** The agent that created the app needs the first token. Since approval happens via console (owner clicks link in email), the approval response includes the token plaintext. Owner copies it back to the agent. Alternatively, the approval email itself contains the token — owner forwards/pastes to agent.

---

## 4. MCP Hosting

Single `POST /mcp/:appId` endpoint. No SSE, no WebSocket — streamable HTTP only.

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
```

### Per-Request Flow

1. Extract `appId` from path, `token` from `Authorization: Bearer <token>` header
2. Hash token → lookup in `app_tokens` → verify not revoked, app is published
3. Load app's `schema_json` (cache in memory with TTL)
4. Generate MCP tools from schema + permissions (via engine kernel)
5. Create `McpServer` instance, register tools, attach `StreamableHTTPServerTransport`
6. Handle request, log to `activity_log`

### Tool Generation

Engine kernel reads schema and generates tools like:
- `create_expense` — insert row, enforce rules
- `list_expenses` — query with filters
- `update_expense` — partial update, field-level permission check
- (no `delete_expense` if schema doesn't permit)

Each tool call runs through: **permissions check → field validation → rule engine → SQL execution → structured response**.

### Caching

- Schema + generated tool definitions: in-memory Map keyed by `appId`, invalidated on schema change (publish only, so effectively immutable)
- No per-connection state — each POST is independent (stateless streamable HTTP)

**Tricky part:** `@modelcontextprotocol/sdk` expects a server instance per transport. Create a fresh `McpServer` + `StreamableHTTPServerTransport` per request. Tool definitions are generated once and cached, but server instances are cheap. Profile this — if slow, pool them.

---

## 5. Database Schema — Platform Tables

```sql
CREATE TABLE accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID NOT NULL REFERENCES accounts(id),
  token_hash    TEXT UNIQUE NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);

CREATE TABLE otp_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  code_hash     TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  used          BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_codes_email ON otp_codes(email);

CREATE TABLE apps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID NOT NULL REFERENCES accounts(id),
  name          TEXT NOT NULL,
  template      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'published')),
  schema_yaml   TEXT NOT NULL,
  schema_json   JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ
);
CREATE INDEX idx_apps_account_id ON apps(account_id);

CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID NOT NULL REFERENCES accounts(id),
  key_hash      TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT 'default',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

CREATE TABLE app_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        UUID NOT NULL REFERENCES apps(id),
  token_hash    TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  created_by    TEXT NOT NULL DEFAULT 'system', -- 'system' | 'owner'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);
CREATE INDEX idx_app_tokens_token_hash ON app_tokens(token_hash);
CREATE INDEX idx_app_tokens_app_id ON app_tokens(app_id);

CREATE TABLE activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        UUID NOT NULL REFERENCES apps(id),
  token_id      UUID REFERENCES app_tokens(id),
  tool          TEXT NOT NULL,
  input_hash    TEXT NOT NULL, -- SHA-256 of input JSON (no business data in logs)
  result        TEXT NOT NULL CHECK (result IN ('ok', 'error')),
  error         TEXT,          -- error code only, never business data
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_log_app_id ON activity_log(app_id, created_at DESC);
```

---

## 6. App Data Tables

On publish, engine reads `schema_json` entities and creates tables dynamically.

Naming convention: `app_{appId_short}_{entity}` where `appId_short` is first 8 chars of UUID (no hyphens).

Example for expenses template:

```sql
CREATE TABLE app_a1b2c3d4_expense (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount      NUMERIC(12,2) NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'MYR',
  category    TEXT NOT NULL,
  date        DATE NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Column types derived from schema field types: `string→TEXT`, `number→NUMERIC`, `integer→INTEGER`, `date→DATE`, `datetime→TIMESTAMPTZ`, `boolean→BOOLEAN`, `enum→TEXT+CHECK`.

**Tricky part:** SQL injection via schema field names. All entity and field names must be validated against `^[a-z][a-z0-9_]{0,62}$` before use in DDL. Use `pg_escape_ident` equivalent — never string-interpolate identifiers raw.

---

## 7. Email Sending

```typescript
interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<void>;
}
```

Two implementations:

- **MailpitProvider** — local dev, sends to Mailpit SMTP on `localhost:1025`, UI at `localhost:8025`
- **ResendProvider** — production, uses Resend HTTP API with `RESEND_API_KEY`

Emails sent:

| Trigger | Subject | Content |
|---------|---------|---------|
| OTP requested | "Your EzyForge code: 123456" | Code + 10 min expiry note |
| App pending approval | "Approve your new app: {name}" | Link to `{CONSOLE_URL}/apps/{id}/review` |
| App published | "App published: {name}" | Confirmation + first token (plaintext) |

**Tricky part:** The approval email is the bridge between agent and owner. It must be clear, non-technical, and include a direct action link. The published email contains the MCP token — it must warn the owner to keep it private.

---

## 8. Middleware

```typescript
// Auth middleware — resolves account from session JWT, API key, or app token
const authSession = createMiddleware(/* extract JWT from cookie/bearer, set c.var.account */);
const authApiKey = createMiddleware(/* extract from ApiKey header, set c.var.account */);
const authAppToken = createMiddleware(/* extract from Bearer on /mcp, set c.var.appToken */);
const authConsole = createMiddleware(/* session-only, rejects API keys */);

// Rate limiting — in-memory sliding window (upgrade to Redis later)
const rateLimit = (opts: { window: number; max: number; key: (c) => string }) => createMiddleware(...);

// Error handler — catches all errors, returns structured JSON
app.onError((err, c) => {
  return c.json({ error: err.code ?? "internal", message: err.message }, err.status ?? 500);
});

// CORS — allow console origin only
app.use("/api/*", cors({ origin: CONSOLE_URL, credentials: true }));
// MCP — no CORS needed (server-to-server)
```

Rate limits applied:
- `/api/auth/initiate`: 3 per email per 15 min, 10 per IP per 15 min
- `/api/auth/verify`: 5 per email per 15 min
- `/mcp/:appId`: 100 per token per minute

---

## 9. Environment Config

```bash
# .env.local (dev)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ezyforge
SESSION_SECRET=dev-secret-change-me
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_PROVIDER=mailpit
CONSOLE_URL=http://localhost:3000
PORT=4000

# .env.production
DATABASE_URL=postgresql://...@neon.tech/ezyforge?sslmode=require
SESSION_SECRET=<random-64-bytes>
RESEND_API_KEY=re_...
EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@ezyforge.io
CONSOLE_URL=https://console.ezyforge.io
PORT=4000
```

Load with `dotenv` — no framework magic. Validate all required vars at startup with a typed config loader that throws on missing values.

---

## 10. Testing Strategy

### Unit Tests (Vitest)
- **OTP logic:** generation, hashing, expiry, max attempts
- **Auth middleware:** JWT parsing, API key resolution, rejection cases
- **App state machine:** valid transitions, rejection of invalid transitions
- **Schema → DDL:** field type mapping, identifier validation, SQL generation
- **Tool generation:** schema → MCP tool definitions, permission filtering

### Integration Tests (Vitest + Testcontainers)
- Spin up Postgres in Docker via Testcontainers
- Full auth flow: initiate → verify → get API key → use API key
- Full app lifecycle: create → approve → MCP tool call → activity logged
- Multi-tenant isolation: app A's token cannot call app B's MCP endpoint
- Rate limiting: verify 4th OTP request in window is rejected

### MCP Tests
- Send valid MCP `tools/list` request to `/mcp/:appId` → returns generated tools
- Send `tools/call` for `create_expense` → row created, activity logged
- Send `tools/call` violating permission → structured error returned
- Send `tools/call` violating rule → structured error returned

### The Dogfood Test (E2E)
Automated script that runs the full MVP flow:
1. Initiate OTP → read from Mailpit API → verify as agent → get API key
2. Create expenses app → read approval email from Mailpit → approve
3. Connect MCP → create expense → verify stored
4. Attempt forbidden field update → verify rejected
5. Check activity log → verify entries

**Tricky part:** E2E test needs to read emails programmatically. Mailpit has a REST API (`GET /api/v1/messages`) — use it to extract OTP and approval links in tests.
