import { createMiddleware } from "hono/factory";
import { sign as jwtSign, verify as jwtVerify } from "hono/utils/jwt/jwt";
import { config } from "../config.js";
import { queryOne } from "../db/pool.js";
import { sha256 } from "../utils/crypto.js";
import { httpError } from "./error.js";

// ---------------------------------------------------------------------------
// Types — stored on c.var by middleware
// ---------------------------------------------------------------------------

export interface AccountVar {
  id: string;
  email: string;
}

export interface AppTokenVar {
  id: string;
  app_id: string;
  name: string;
}

// Hono env declaration for typed c.var access.
export type AuthEnv = {
  Variables: {
    account: AccountVar;
    appToken: AppTokenVar;
  };
};

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

export async function createSessionJwt(accountId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: accountId, iat: now, exp: now + 7 * 24 * 60 * 60 };
  // hono/jwt sign returns a promise
  return await jwtSign(payload, config.sessionSecret);
}

// ---------------------------------------------------------------------------
// Session auth — JWT from cookie or Authorization: Bearer <jwt>
// ---------------------------------------------------------------------------

export const authSession = createMiddleware<AuthEnv>(async (c, next) => {
  // Try cookie first, then Authorization header.
  let token: string | undefined;

  const cookie = c.req.header("Cookie");
  if (cookie) {
    const match = cookie.match(/session=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    httpError(401, "unauthorized", "Authentication required");
  }

  try {
    const payload = (await jwtVerify(token, config.sessionSecret, "HS256")) as {
      sub: string;
    };
    const account = await queryOne<AccountVar>(
      "SELECT id, email FROM accounts WHERE id = $1",
      [payload.sub],
    );
    if (!account) httpError(401, "unauthorized", "Account not found");
    c.set("account", account);
  } catch {
    httpError(401, "unauthorized", "Invalid or expired session");
  }

  await next();
});

// ---------------------------------------------------------------------------
// API key auth — Authorization: ApiKey ek_...
// ---------------------------------------------------------------------------

export const authApiKey = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("ApiKey ")) {
    httpError(401, "unauthorized", "API key required");
  }

  const key = authHeader.slice(7);
  const keyHash = sha256(key);

  const row = await queryOne<{ account_id: string; email: string }>(
    `SELECT ak.account_id, a.email
     FROM api_keys ak
     JOIN accounts a ON a.id = ak.account_id
     WHERE ak.key_hash = $1 AND ak.revoked_at IS NULL`,
    [keyHash],
  );

  if (!row) httpError(401, "unauthorized", "Invalid API key");

  c.set("account", { id: row.account_id, email: row.email });
  await next();
});

// ---------------------------------------------------------------------------
// Console auth — session-only, rejects API keys (for owner-only actions)
// ---------------------------------------------------------------------------

export const authConsole = authSession; // Same as session — console = JWT only.

// ---------------------------------------------------------------------------
// App token auth — Authorization: Bearer et_... (MCP endpoints)
// ---------------------------------------------------------------------------

export const authAppToken = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    httpError(401, "unauthorized", "App token required");
  }

  const token = authHeader.slice(7);
  const tokenHash = sha256(token);

  const row = await queryOne<AppTokenVar>(
    `SELECT t.id, t.app_id, t.name
     FROM app_tokens t
     JOIN apps a ON a.id = t.app_id
     WHERE t.token_hash = $1
       AND t.revoked_at IS NULL
       AND a.status = 'published'`,
    [tokenHash],
  );

  if (!row) httpError(401, "unauthorized", "Invalid or revoked app token");

  c.set("appToken", row);
  await next();
});
