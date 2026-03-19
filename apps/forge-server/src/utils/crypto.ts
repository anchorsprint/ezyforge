import { createHash, randomBytes, randomInt } from "node:crypto";

/** SHA-256 hash of a string, returned as hex. */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Generate a 6-digit OTP code. */
export function generateOtp(): string {
  return randomInt(100_000, 999_999).toString();
}

/** Generate a random API key with `ek_` prefix (32 random bytes, base62). */
export function generateApiKey(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(32);
  let key = "";
  for (const byte of bytes) {
    key += chars[byte % chars.length];
  }
  return `ek_${key}`;
}

/** Generate a random app token with `et_` prefix (32 random bytes, base62). */
export function generateAppToken(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(32);
  let token = "";
  for (const byte of bytes) {
    token += chars[byte % chars.length];
  }
  return `et_${token}`;
}
