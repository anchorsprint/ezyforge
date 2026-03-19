import type { ErrorHandler } from "hono";

interface AppError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler: ErrorHandler = (err: AppError, c) => {
  const status = err.status ?? 500;
  const code = err.code ?? "internal";
  const message = status === 500 ? "Internal server error" : err.message;

  // Log server errors — never log business data, only error code + message.
  if (status >= 500) {
    console.error(`[${code}] ${err.message}`);
  }

  return c.json({ error: code, message }, status as 400);
};

/** Throw a structured HTTP error from any route. */
export function httpError(
  status: number,
  code: string,
  message: string,
): never {
  const err = new Error(message) as AppError;
  err.status = status;
  err.code = code;
  throw err;
}
