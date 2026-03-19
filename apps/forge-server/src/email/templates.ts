import { config } from "../config.js";

export function otpEmail(code: string): { subject: string; html: string } {
  return {
    subject: `Your EzyForge code: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Your verification code</h2>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 0.3em; color: #111;">
          ${code}
        </p>
        <p>This code expires in 10 minutes.</p>
        <p style="color: #666; font-size: 13px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  };
}

export function approvalEmail(
  appName: string,
  appId: string,
): { subject: string; html: string } {
  const reviewUrl = `${config.consoleUrl}/apps/${appId}/review`;
  return {
    subject: `Approve your new app: ${appName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>New app ready for review</h2>
        <p>Your AI agent has set up <strong>${appName}</strong>.</p>
        <p>Review the schema, entities, rules, and AI permissions before publishing.</p>
        <p>
          <a href="${reviewUrl}"
             style="display:inline-block; padding: 12px 24px; background: #111; color: #fff;
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Review &amp; Approve
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          Only approve if you trust the schema and understand what the AI agent will be able to do.
        </p>
      </div>
    `,
  };
}

export function publishedEmail(
  appName: string,
  appId: string,
  mcpToken: string,
): { subject: string; html: string } {
  const mcpUrl = `${config.consoleUrl.replace("localhost:3000", "localhost:4000")}/mcp/${appId}`;
  return {
    subject: `App published: ${appName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${appName} is live!</h2>
        <p>Your app is now published and the MCP endpoint is active.</p>

        <h3>MCP Endpoint</h3>
        <code style="display:block; padding:8px; background:#f5f5f5; border-radius:4px; word-break:break-all;">
          ${mcpUrl}
        </code>

        <h3>AI Token</h3>
        <code style="display:block; padding:8px; background:#f5f5f5; border-radius:4px; word-break:break-all;">
          ${mcpToken}
        </code>

        <p style="color: #c00; font-weight: bold; font-size: 13px;">
          Keep this token private. Anyone with this token can operate your app via AI.
          You can revoke it anytime from the console.
        </p>
      </div>
    `,
  };
}
