import { Hono } from "hono";
import { query, queryOneOrThrow } from "../db/pool.js";
import { authConsole, type AuthEnv } from "../middleware/auth.js";

// ---------------------------------------------------------------------------
// Ownership check
// ---------------------------------------------------------------------------

async function verifyAppOwnership(appId: string, accountId: string) {
  return queryOneOrThrow<{ id: string; status: string }>(
    `SELECT id, status FROM apps WHERE id = $1 AND account_id = $2`,
    [appId, accountId],
    "App not found",
  );
}

// ---------------------------------------------------------------------------
// Data viewer: GET /api/apps/:appId/data/:entity
// ---------------------------------------------------------------------------

export const dataRoutes = new Hono<AuthEnv>();
dataRoutes.use("/*", authConsole);

dataRoutes.get("/:entity", async (c) => {
  const account = c.var.account;
  const appId = c.req.param("appId")!;
  const entity = c.req.param("entity")!;

  const app = await verifyAppOwnership(appId, account.id);

  if (app.status !== "published") {
    return c.json(
      { error: "not_published", message: "App must be published to view data" },
      400,
    );
  }

  // Validate entity name — prevent SQL injection.
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(entity)) {
    return c.json(
      { error: "invalid_entity", message: "Invalid entity name" },
      400,
    );
  }

  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);

  // Table naming: app_{first8chars}_entity
  const appIdShort = appId.replace(/-/g, "").slice(0, 8);
  const tableName = `app_${appIdShort}_${entity}`;

  try {
    const rows = await query(
      `SELECT * FROM "${tableName}" ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const countResult = await query<{ count: string }>(
      `SELECT count(*) as count FROM "${tableName}"`,
    );

    return c.json({
      ok: true,
      entity,
      rows,
      total: parseInt(countResult[0]?.count ?? "0", 10),
      limit,
      offset,
    });
  } catch (err: any) {
    // Table might not exist yet.
    if (err.code === "42P01") {
      return c.json({ ok: true, entity, rows: [], total: 0, limit, offset });
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// Activity log: GET /api/apps/:appId/activity
// ---------------------------------------------------------------------------

export const activityRoutes = new Hono<AuthEnv>();
activityRoutes.use("/*", authConsole);

activityRoutes.get("/", async (c) => {
  const account = c.var.account;
  const appId = c.req.param("appId")!;

  await verifyAppOwnership(appId, account.id);

  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);

  const entries = await query<{
    id: string;
    tool: string;
    result: string;
    error: string | null;
    created_at: string;
    token_name: string | null;
  }>(
    `SELECT al.id, al.tool, al.result, al.error, al.created_at, t.name as token_name
     FROM activity_log al
     LEFT JOIN app_tokens t ON t.id = al.token_id
     WHERE al.app_id = $1
     ORDER BY al.created_at DESC
     LIMIT $2 OFFSET $3`,
    [appId, limit, offset],
  );

  const countResult = await query<{ count: string }>(
    `SELECT count(*) as count FROM activity_log WHERE app_id = $1`,
    [appId],
  );

  return c.json({
    ok: true,
    entries,
    total: parseInt(countResult[0]?.count ?? "0", 10),
    limit,
    offset,
  });
});
