import { Hono } from "hono";
import { query, queryOne } from "../db/pool.js";
import { sha256, generateOtp, generateApiKey } from "../utils/crypto.js";
import { getEmailProvider } from "../email/provider.js";
import { otpEmail } from "../email/templates.js";
import { createSessionJwt } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { httpError } from "../middleware/error.js";

export const authRoutes = new Hono();

// ---------------------------------------------------------------------------
// Rate limiters
// ---------------------------------------------------------------------------

const initiateRateByEmail = rateLimit({
  window: 15 * 60 * 1000,
  max: 3,
  key: (c) => `otp:email:${c.req.header("X-OTP-Email") ?? "unknown"}`,
});

const initiateRateByIp = rateLimit({
  window: 15 * 60 * 1000,
  max: 10,
  key: (c) => `otp:ip:${c.req.header("X-Forwarded-For") ?? c.req.header("CF-Connecting-IP") ?? "unknown"}`,
});

const verifyRate = rateLimit({
  window: 15 * 60 * 1000,
  max: 5,
  key: (c) => `verify:email:${c.req.header("X-OTP-Email") ?? "unknown"}`,
});

// ---------------------------------------------------------------------------
// POST /api/auth/initiate — send OTP to email
// ---------------------------------------------------------------------------

authRoutes.post("/initiate", initiateRateByIp, async (c) => {
  const body = await c.req.json<{ email?: string }>();
  const email = body.email?.toLowerCase().trim();

  if (!email || !email.includes("@")) {
    httpError(400, "invalid_email", "A valid email is required");
  }

  // Set header for per-email rate limiter (checked on next request).
  c.req.raw.headers.set("X-OTP-Email", email);

  // Generate OTP, hash before storing.
  const code = generateOtp();
  const codeHash = sha256(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await query(
    `INSERT INTO otp_codes (email, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [email, codeHash, expiresAt],
  );

  // Send email (async, but we await to catch SMTP errors in dev).
  const provider = getEmailProvider();
  const { subject, html } = otpEmail(code);
  await provider.send(email, subject, html);

  // Always return otp_sent — prevent email enumeration.
  return c.json({ ok: true, message: "otp_sent" });
});

// ---------------------------------------------------------------------------
// POST /api/auth/verify — verify OTP, create account, return session/API key
// ---------------------------------------------------------------------------

authRoutes.post("/verify", verifyRate, async (c) => {
  const body = await c.req.json<{
    email?: string;
    otp?: string;
    client_type?: "console" | "agent";
  }>();

  const email = body.email?.toLowerCase().trim();
  const otp = body.otp?.trim();
  const clientType = body.client_type ?? "console";

  if (!email || !otp) {
    httpError(400, "invalid_request", "Email and OTP are required");
  }

  // Find the latest unused, unexpired OTP for this email.
  const otpRow = await queryOne<{
    id: string;
    code_hash: string;
    attempts: number;
  }>(
    `SELECT id, code_hash, attempts FROM otp_codes
     WHERE email = $1 AND used = false AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [email],
  );

  if (!otpRow) {
    httpError(401, "invalid_otp", "No valid OTP found — request a new one");
  }

  // Check max attempts (3).
  if (otpRow.attempts >= 3) {
    httpError(401, "otp_exhausted", "Too many attempts — request a new code");
  }

  // Verify hash.
  const submittedHash = sha256(otp);
  if (submittedHash !== otpRow.code_hash) {
    // Increment attempts.
    await query(
      `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`,
      [otpRow.id],
    );
    httpError(401, "invalid_otp", "Incorrect code");
  }

  // Mark OTP as used.
  await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [otpRow.id]);

  // Upsert account.
  const account = await queryOne<{ id: string }>(
    `INSERT INTO accounts (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id`,
    [email],
  );

  if (!account) {
    httpError(500, "internal", "Failed to create account");
  }

  if (clientType === "agent") {
    // Generate API key — return plaintext once, store hash.
    const apiKey = generateApiKey();
    const keyHash = sha256(apiKey);

    await query(
      `INSERT INTO api_keys (account_id, key_hash, name) VALUES ($1, $2, $3)`,
      [account.id, keyHash, "default"],
    );

    return c.json({ ok: true, account_id: account.id, api_key: apiKey });
  }

  // Console — issue JWT session.
  const jwt = await createSessionJwt(account.id);

  // Set HttpOnly cookie.
  c.header(
    "Set-Cookie",
    `session=${jwt}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`,
  );

  return c.json({ ok: true, account_id: account.id });
});
