import pg from "pg";

let _pool: pg.Pool | null = null;

/** Lazy pool — only connects on first use */
function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
    });
  }
  return _pool;
}

export { getPool as pool };

/** Run a parameterized query and return rows. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}

/** Run a query and return the first row, or null. */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Run a query and return the first row, or throw. */
export async function queryOneOrThrow<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
  errorMessage = "Not found",
): Promise<T> {
  const row = await queryOne<T>(sql, params);
  if (!row) {
    const err = new Error(errorMessage) as Error & { status: number; code: string };
    err.status = 404;
    err.code = "not_found";
    throw err;
  }
  return row;
}

/** Health check — test DB connection */
export async function checkConnection(): Promise<boolean> {
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
