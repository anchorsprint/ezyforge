import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error.js";
import { authRoutes } from "./routes/auth.js";
import { appRoutes } from "./routes/apps.js";
import { templateRoutes } from "./routes/templates.js";
import { tokenRoutes } from "./routes/tokens.js";
import { dataRoutes, activityRoutes } from "./routes/data.js";
import { checkConnection } from "./db/pool.js";

const app = new Hono();

app.onError(errorHandler);
app.use("/api/*", cors({ origin: config.consoleUrl, credentials: true }));

// Health check (no DB needed)
app.get("/health", (c) =>
  c.json({ ok: true, service: "forge-server", timestamp: new Date().toISOString() })
);

// Health check with DB
app.get("/health/db", async (c) => {
  const dbOk = await checkConnection();
  return c.json({ ok: dbOk, service: "forge-server", db: dbOk ? "connected" : "unreachable" }, dbOk ? 200 : 503);
});

// API routes
app.route("/api/auth", authRoutes);
app.route("/api/apps", appRoutes);
app.route("/api/templates", templateRoutes);
app.route("/api/apps/:appId/tokens", tokenRoutes);
app.route("/api/apps/:appId/data", dataRoutes);
app.route("/api/apps/:appId/activity", activityRoutes);

// MCP endpoint placeholder (will add full MCP handler in next iteration)
app.post("/mcp/:appId", async (c) => {
  const appId = c.req.param("appId");
  return c.json({ error: "mcp_not_ready", message: `MCP endpoint for app ${appId} — coming soon` }, 501);
});

// Start server
serve(
  { fetch: app.fetch, port: config.port, hostname: "0.0.0.0" },
  (info) => {
    console.log(`forge-server listening on http://0.0.0.0:${info.port}`);
    console.log(`  Health:    http://localhost:${info.port}/health`);
    console.log(`  API:       http://localhost:${info.port}/api/`);
    console.log(`  MCP:       http://localhost:${info.port}/mcp/:appId`);
  }
);
