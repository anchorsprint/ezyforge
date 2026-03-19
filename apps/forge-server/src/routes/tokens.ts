import { Hono } from "hono";
import { query, queryOne, queryOneOrThrow } from "../db/pool.js";
import { authConsole, type AuthEnv } from "../middleware/auth.js";
import { httpError } from "../middleware/error.js";
import { sha256, generateAppToken } from "../utils/crypto.js";

export const tokenRoutes = new Hono<AuthEnv>();

// All token routes require console (session) auth.
tokenRoutes.use("/*", authConsole);

// ---------------------------------------------------------------------------
// Ownership check helper
// ---------------------------------------------------------------------------

async function verifyAppOwnership(appId: string, accountId: string) {
  return queryOneOrThrow<{ id: string }>(
    `SELECT id FROM apps WHERE id = $1 AND account_id = $2`,
    [appId, accountId],
    "App not found",
  );
}

// ---------------------------------------------------------------------------
// POST /api/apps/:appId/tokens — create new AI token
// ---------------------------------------------------------------------------

tokenRoutes.post("/", async (c) => {
  const account = c.var.account;
  const appId = c.req.param("appId")!;
  const body = await c.req.json<{ name?: string }>();

  const name = body.name?.trim();
  if (!name) httpError(400, "missing_name", "Token name is required");

  await verifyAppOwnership(appId, account.id);

  const tokenPlaintext = generateAppToken();
  const tokenHash = sha256(tokenPlaintext);

  const row = await queryOne<{ id: string }>(
    `INSERT INTO app_tokens (app_id, token_hash, name, created_by)
     VALUES ($1, $2, $3, 'owner')
     RETURNING id`,
    [appId, tokenHash, name],
  );

  return c.json(
    {
      ok: true,
      token_id: row!.id,
      name,
      token: tokenPlaintext,
      message: "Token created. Store it securely — it won't be shown again.",
    },
    201,
  );
});

// ---------------------------------------------------------------------------
// GET /api/apps/:appId/tokens — list tokens (no plaintext)
// ---------------------------------------------------------------------------

tokenRoutes.get("/", async (c) => {
  const account = c.var.account;
  const appId = c.req.param("appId")!;

  await verifyAppOwnership(appId, account.id);

  const tokens = await query<{
    id: string;
    name: string;
    created_by: string;
    created_at: string;
    revoked_at: string | null;
  }>(
    `SELECT id, name, created_by, created_at, revoked_at
     FROM app_tokens WHERE app_id = $1 ORDER BY created_at DESC`,
    [appId],
  );

  return c.json({
    ok: true,
    tokens: tokens.map((t) => ({
      ...t,
      active: t.revoked_at === null,
    })),
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/apps/:appId/tokens/:tokenId — revoke token
// ---------------------------------------------------------------------------

tokenRoutes.delete("/:tokenId", async (c) => {
  const account = c.var.account;
  const appId = c.req.param("appId")!;
  const tokenId = c.req.param("tokenId");

  await verifyAppOwnership(appId, account.id);

  const result = await query(
    `UPDATE app_tokens SET revoked_at = now()
     WHERE id = $1 AND app_id = $2 AND revoked_at IS NULL`,
    [tokenId, appId],
  );

  // pg returns rowCount on the result, but our query helper returns rows.
  // Just confirm the token exists.
  const token = await queryOne(
    `SELECT id FROM app_tokens WHERE id = $1 AND app_id = $2`,
    [tokenId, appId],
  );

  if (!token) httpError(404, "not_found", "Token not found");

  return c.json({ ok: true, message: "Token revoked" });
});
