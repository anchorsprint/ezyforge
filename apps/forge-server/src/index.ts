import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error.js";
import { authRoutes } from "./routes/auth.js";
import { appRoutes } from "./routes/apps.js";
import { templateRoutes } from "./routes/templates.js";
import { tokenRoutes } from "./routes/tokens.js";
import { dataRoutes } from "./routes/data.js";
import { activityRoutes } from "./routes/data.js";
import { handleMcpRequest } from "./mcp/handler.js";

// ---------------------------------------------------------------------------
// Hono app (API routes only — MCP handled at Node level)
// ---------------------------------------------------------------------------

const app = new Hono();

app.onError(errorHandler);

app.use(
  "/api/*",
  cors({ origin: config.consoleUrl, credentials: true }),
);

app.get("/health", (c) => c.json({ ok: true, service: "forge-server" }));

// API routes.
app.route("/api/auth", authRoutes);
app.route("/api/apps", appRoutes);
app.route("/api/templates", templateRoutes);
app.route("/api/apps/:appId/tokens", tokenRoutes);
app.route("/api/apps/:appId/data", dataRoutes);
app.route("/api/apps/:appId/activity", activityRoutes);

// ---------------------------------------------------------------------------
// Start Node.js HTTP server
// ---------------------------------------------------------------------------

const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`forge-server listening on :${info.port}`);
  },
);

// Intercept requests at the Node level for MCP (needs raw req/res).
const originalHandler = server.listeners("request")[0] as Function;
server.removeAllListeners("request");
server.on("request", async (req, res) => {
  const url = req.url ?? "";
  const mcpMatch = url.match(/^\/mcp\/([0-9a-f-]{36})$/);

  if (mcpMatch && req.method === "POST") {
    try {
      await handleMcpRequest(req, res, mcpMatch[1]);
    } catch (err) {
      console.error("MCP handler error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "internal", message: "MCP handler failed" }));
      }
    }
    return;
  }

  // All other requests go through Hono.
  originalHandler(req, res);
});
