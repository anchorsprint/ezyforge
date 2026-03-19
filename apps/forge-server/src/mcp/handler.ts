import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { queryOne, query } from "../db/pool.js";
import { pool } from "../db/pool.js";
import { sha256 } from "../utils/crypto.js";
import { Engine, type FunctionDefinition } from "@ezyforge/engine";

// ---------------------------------------------------------------------------
// In-memory cache: one Engine instance per published app
// ---------------------------------------------------------------------------

interface CachedApp {
  engine: Engine;
  functions: FunctionDefinition[];
}

const appCache = new Map<string, CachedApp>();

async function getAppEngine(appId: string): Promise<CachedApp> {
  const cached = appCache.get(appId);
  if (cached) return cached;

  const app = await queryOne<{ schema_yaml: string }>(
    `SELECT schema_yaml FROM apps WHERE id = $1 AND status = 'published'`,
    [appId],
  );

  if (!app) {
    throw Object.assign(new Error("App not found or not published"), {
      status: 404,
      code: "app_not_found",
    });
  }

  const engine = await Engine.load(app.schema_yaml, pool, appId);
  const functions = engine.getFunctions();

  const entry: CachedApp = { engine, functions };
  appCache.set(appId, entry);
  return entry;
}

/** Invalidate cache for an app. */
export function invalidateAppCache(appId: string): void {
  appCache.delete(appId);
}

// ---------------------------------------------------------------------------
// Convert engine FunctionDefinition → MCP tool input properties
// ---------------------------------------------------------------------------

function toMcpInputProperties(fn: FunctionDefinition): Record<string, any> {
  const properties: Record<string, any> = {};

  for (const field of fn.inputFields) {
    const prop: Record<string, any> = {};

    switch (field.type) {
      case "string":
        prop.type = "string";
        break;
      case "integer":
        prop.type = "integer";
        break;
      case "decimal":
        prop.type = "number";
        break;
      case "boolean":
        prop.type = "boolean";
        break;
      case "date":
        prop.type = "string";
        prop.format = "date";
        break;
      case "datetime":
        prop.type = "string";
        prop.format = "date-time";
        break;
      case "enum":
        prop.type = "string";
        if (field.enumValues) prop.enum = field.enumValues;
        break;
      default:
        prop.type = "string";
    }

    properties[field.name] = prop;
  }

  return properties;
}

// ---------------------------------------------------------------------------
// Token verification (extracted from middleware for raw handler use)
// ---------------------------------------------------------------------------

interface VerifiedToken {
  id: string;
  app_id: string;
  name: string;
}

async function verifyAppToken(authHeader: string | undefined): Promise<VerifiedToken | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const tokenHash = sha256(token);

  const row = await queryOne<VerifiedToken>(
    `SELECT t.id, t.app_id, t.name
     FROM app_tokens t
     JOIN apps a ON a.id = t.app_id
     WHERE t.token_hash = $1
       AND t.revoked_at IS NULL
       AND a.status = 'published'`,
    [tokenHash],
  );

  return row;
}

// ---------------------------------------------------------------------------
// Raw Node.js HTTP handler for /mcp/:appId
// ---------------------------------------------------------------------------

/**
 * Handle MCP requests directly with Node.js IncomingMessage/ServerResponse.
 * Called from the main server when the URL matches /mcp/:appId.
 */
export async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  appId: string,
): Promise<void> {
  // Auth check.
  const appToken = await verifyAppToken(req.headers.authorization);
  if (!appToken) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "unauthorized", message: "Valid app token required" }));
    return;
  }

  if (appToken.app_id !== appId) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "forbidden", message: "Token does not belong to this app" }));
    return;
  }

  // Load engine.
  let engine: Engine;
  let functions: FunctionDefinition[];
  try {
    const cached = await getAppEngine(appId);
    engine = cached.engine;
    functions = cached.functions;
  } catch (err: any) {
    const status = err.status ?? 500;
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.code ?? "internal", message: err.message }));
    return;
  }

  // Create MCP server and register tools.
  const server = new McpServer({
    name: `ezyforge-${appId}`,
    version: "1.0.0",
  });

  for (const fn of functions) {
    const inputProperties = toMcpInputProperties(fn);

    server.tool(
      fn.name,
      fn.description,
      inputProperties,
      async (params: Record<string, unknown>) => {
        const inputHash = sha256(JSON.stringify(params));

        try {
          const result = await engine.call(fn.name, params, {
            tokenId: appToken.id,
            role: "ai",
          });

          if (result.success) {
            await query(
              `INSERT INTO activity_log (app_id, token_id, tool, input_hash, result)
               VALUES ($1, $2, $3, $4, 'ok')`,
              [appId, appToken.id, fn.name, inputHash],
            );

            return {
              content: [{ type: "text" as const, text: JSON.stringify(result.data) }],
            };
          }

          await query(
            `INSERT INTO activity_log (app_id, token_id, tool, input_hash, result, error)
             VALUES ($1, $2, $3, $4, 'error', $5)`,
            [appId, appToken.id, fn.name, inputHash, result.error?.error ?? "unknown"],
          );

          return {
            content: [{ type: "text" as const, text: JSON.stringify(result.error) }],
            isError: true,
          };
        } catch (err: any) {
          await query(
            `INSERT INTO activity_log (app_id, token_id, tool, input_hash, result, error)
             VALUES ($1, $2, $3, $4, 'error', $5)`,
            [appId, appToken.id, fn.name, inputHash, err.code ?? "internal"],
          );

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: err.code ?? "internal",
                  message: err.message ?? "Tool execution failed",
                }),
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  // Create transport and handle.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  // Parse body from request.
  const bodyChunks: Buffer[] = [];
  for await (const chunk of req) {
    bodyChunks.push(chunk);
  }
  const bodyStr = Buffer.concat(bodyChunks).toString();
  const parsedBody = bodyStr ? JSON.parse(bodyStr) : undefined;

  await transport.handleRequest(req, res, parsedBody);
}
