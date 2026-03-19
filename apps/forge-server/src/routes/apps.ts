import { Hono } from "hono";
import { query, queryOne, queryOneOrThrow } from "../db/pool.js";
import {
  authApiKey,
  authSession,
  type AuthEnv,
} from "../middleware/auth.js";
import { httpError } from "../middleware/error.js";
import { getEmailProvider } from "../email/provider.js";
import { approvalEmail, publishedEmail } from "../email/templates.js";
import { sha256, generateAppToken } from "../utils/crypto.js";
import { getTemplate } from "./templates.js";
import { pool } from "../db/pool.js";
import { Engine, parseSchema } from "@ezyforge/engine";
import { invalidateAppCache } from "../mcp/handler.js";

export const appRoutes = new Hono<AuthEnv>();

// ---------------------------------------------------------------------------
// POST /api/apps — create app from template (API key auth)
// ---------------------------------------------------------------------------

appRoutes.post("/", authApiKey, async (c) => {
  const account = c.var.account;
  const body = await c.req.json<{ template?: string; name?: string }>();

  const templateName = body.template;
  if (!templateName) {
    httpError(400, "missing_template", "Template name is required");
  }

  const template = getTemplate(templateName);
  if (!template) {
    httpError(400, "unknown_template", `Template "${templateName}" not found`);
  }

  const name = body.name ?? template.defaultName;

  // Insert app in pending_approval state.
  const app = await queryOne<{ id: string }>(
    `INSERT INTO apps (account_id, name, template, status, schema_yaml)
     VALUES ($1, $2, $3, 'pending_approval', $4)
     RETURNING id`,
    [account.id, name, templateName, template.schemaYaml],
  );

  if (!app) httpError(500, "internal", "Failed to create app");

  // Send approval email to owner.
  const provider = getEmailProvider();
  const { subject, html } = approvalEmail(name, app.id);
  await provider.send(account.email, subject, html);

  return c.json(
    {
      ok: true,
      app_id: app.id,
      name,
      status: "pending_approval",
      message: "Approval email sent to owner",
    },
    201,
  );
});

// ---------------------------------------------------------------------------
// GET /api/apps — list my apps (session auth)
// ---------------------------------------------------------------------------

appRoutes.get("/", authSession, async (c) => {
  const account = c.var.account;

  const apps = await query<{
    id: string;
    name: string;
    template: string;
    status: string;
    created_at: string;
    published_at: string | null;
  }>(
    `SELECT id, name, template, status, created_at, published_at
     FROM apps WHERE account_id = $1 ORDER BY created_at DESC`,
    [account.id],
  );

  return c.json({ ok: true, apps });
});

// ---------------------------------------------------------------------------
// GET /api/apps/:id — app details (session auth)
// ---------------------------------------------------------------------------

appRoutes.get("/:id", authSession, async (c) => {
  const account = c.var.account;
  const appId = c.req.param("id");

  const app = await queryOneOrThrow<{
    id: string;
    name: string;
    template: string;
    status: string;
    schema_yaml: string;
    schema_json: unknown;
    created_at: string;
    published_at: string | null;
  }>(
    `SELECT id, name, template, status, schema_yaml, schema_json, created_at, published_at
     FROM apps WHERE id = $1 AND account_id = $2`,
    [appId, account.id],
    "App not found",
  );

  const mcpUrl =
    app.status === "published" ? `/mcp/${app.id}` : null;

  return c.json({ ok: true, app: { ...app, mcp_url: mcpUrl } });
});

// ---------------------------------------------------------------------------
// POST /api/apps/:id/approve — owner approves, publish app
// ---------------------------------------------------------------------------

appRoutes.post("/:id/approve", authSession, async (c) => {
  const account = c.var.account;
  const appId = c.req.param("id");

  const app = await queryOneOrThrow<{
    id: string;
    name: string;
    status: string;
    schema_yaml: string;
  }>(
    `SELECT id, name, status, schema_yaml FROM apps WHERE id = $1 AND account_id = $2`,
    [appId, account.id],
    "App not found",
  );

  if (app.status !== "pending_approval") {
    httpError(
      409,
      "invalid_state",
      `App is "${app.status}", expected "pending_approval"`,
    );
  }

  // Parse schema YAML → validate → freeze as schema_json.
  const parsed = parseSchema(app.schema_yaml);
  const schemaJson = parsed;

  // Initialize the engine — creates entity tables in DB.
  const engine = await Engine.load(app.schema_yaml, pool, appId);

  // Invalidate any stale cache entry.
  invalidateAppCache(appId);

  // Update app status to published.
  await query(
    `UPDATE apps SET status = 'published', schema_json = $1, published_at = now()
     WHERE id = $2`,
    [JSON.stringify(schemaJson), appId],
  );

  // Generate first app token ("onboarding-agent").
  const tokenPlaintext = generateAppToken();
  const tokenHash = sha256(tokenPlaintext);

  await query(
    `INSERT INTO app_tokens (app_id, token_hash, name, created_by)
     VALUES ($1, $2, $3, $4)`,
    [appId, tokenHash, "onboarding-agent", "system"],
  );

  // Send published email with token.
  const provider = getEmailProvider();
  const { subject, html } = publishedEmail(app.name, appId, tokenPlaintext);
  await provider.send(account.email, subject, html);

  return c.json({
    ok: true,
    app_id: appId,
    status: "published",
    mcp_url: `/mcp/${appId}`,
    token: tokenPlaintext,
    message: "App published. First AI token issued.",
  });
});

// ---------------------------------------------------------------------------
// POST /api/apps/:id/reject — owner rejects, back to draft
// ---------------------------------------------------------------------------

appRoutes.post("/:id/reject", authSession, async (c) => {
  const account = c.var.account;
  const appId = c.req.param("id");

  const app = await queryOneOrThrow<{ id: string; status: string }>(
    `SELECT id, status FROM apps WHERE id = $1 AND account_id = $2`,
    [appId, account.id],
    "App not found",
  );

  if (app.status !== "pending_approval") {
    httpError(
      409,
      "invalid_state",
      `App is "${app.status}", expected "pending_approval"`,
    );
  }

  await query(`UPDATE apps SET status = 'draft' WHERE id = $1`, [appId]);

  return c.json({ ok: true, app_id: appId, status: "draft" });
});
