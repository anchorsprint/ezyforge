import { createMiddleware } from "hono/factory";

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitOptions {
  /** Window size in milliseconds. */
  window: number;
  /** Max requests per window. */
  max: number;
  /** Extract key from context — typically email or IP. */
  key: (c: any) => string;
}

/**
 * In-memory sliding window rate limiter.
 * Good enough for single-process MVP. Upgrade to Redis later.
 */
export function rateLimit(opts: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup to prevent memory leak.
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < opts.window);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, opts.window);

  return createMiddleware(async (c, next) => {
    const k = opts.key(c);
    const now = Date.now();

    let entry = store.get(k);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(k, entry);
    }

    // Remove timestamps outside the window.
    entry.timestamps = entry.timestamps.filter((t) => now - t < opts.window);

    if (entry.timestamps.length >= opts.max) {
      return c.json(
        { error: "rate_limit", message: "Too many requests" },
        429,
      );
    }

    entry.timestamps.push(now);
    await next();
  });
}
