// Environment configuration — validated at startup, throws on missing required values.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const config = {
  port: parseInt(optional("PORT", "4000"), 10),
  databaseUrl: required("DATABASE_URL"),
  sessionSecret: required("SESSION_SECRET"),

  // Email
  emailProvider: optional("EMAIL_PROVIDER", "mailpit") as "mailpit" | "resend",
  smtpHost: optional("SMTP_HOST", "localhost"),
  smtpPort: parseInt(optional("SMTP_PORT", "1025"), 10),
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: optional("EMAIL_FROM", "noreply@ezyforge.io"),

  // URLs
  consoleUrl: optional("CONSOLE_URL", "http://localhost:3000"),
} as const;
