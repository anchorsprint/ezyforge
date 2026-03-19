import type { Pool, PoolClient } from "pg";
import type {
  EntityDefinition,
  FieldDefinition,
  FieldType,
  ParsedSchema,
} from "../types.js";

// ─── Type Mapping ────────────────────────────────────────────────────────────

function pgType(field: FieldDefinition): string {
  const map: Record<FieldType, string> = {
    string: "TEXT",
    integer: "INTEGER",
    decimal: "NUMERIC(12,2)",
    boolean: "BOOLEAN",
    date: "DATE",
    datetime: "TIMESTAMPTZ",
    enum: "TEXT", // validated at app layer, stored as text
    auto: "SERIAL", // auto-incrementing integer
  };
  return map[field.type] || "TEXT";
}

// ─── Schema Name ─────────────────────────────────────────────────────────────

function schemaName(appId: string): string {
  // Sanitize: only allow alphanumeric and underscores
  const safe = appId.replace(/[^a-zA-Z0-9_]/g, "_");
  return `app_${safe}`;
}

// ─── DB Adapter ──────────────────────────────────────────────────────────────

export class DbAdapter {
  private pool: Pool;
  private schema: string;
  private parsedSchema: ParsedSchema;

  constructor(pool: Pool, appId: string, parsedSchema: ParsedSchema) {
    this.pool = pool;
    this.schema = schemaName(appId);
    this.parsedSchema = parsedSchema;
  }

  /** Create the app schema and all entity tables */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${this.schema}`);

      for (const entity of Object.values(this.parsedSchema.entities)) {
        await this.createTable(client, entity);
      }
    } finally {
      client.release();
    }
  }

  private async createTable(
    client: PoolClient,
    entity: EntityDefinition
  ): Promise<void> {
    const columns: string[] = [];

    for (const field of Object.values(entity.fields)) {
      const colType = pgType(field);
      let colDef = `"${field.name}" ${colType}`;

      if (field.name === "id" && field.type === "auto") {
        colDef += " PRIMARY KEY";
      } else if (field.type === "auto" && field.name !== "id") {
        // Auto fields like created_at get DEFAULT now()
        if (field.type === "auto") {
          // For SERIAL it auto-increments; for datetime auto, use default
          colDef = `"${field.name}" TIMESTAMPTZ DEFAULT NOW()`;
        }
      } else {
        if (field.required) colDef += " NOT NULL";
      }

      columns.push(colDef);
    }

    const sql = `CREATE TABLE IF NOT EXISTS ${this.schema}."${entity.name}" (${columns.join(", ")})`;
    await client.query(sql);
  }

  /** Insert a new record */
  async create(
    entityName: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const entity = this.parsedSchema.entities[entityName];
    if (!entity) throw new Error(`Unknown entity: ${entityName}`);

    // Filter to only writable fields that have values
    const fields: string[] = [];
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      const fieldDef = entity.fields[key];
      if (!fieldDef || fieldDef.auto) continue; // skip auto fields
      fields.push(`"${key}"`);
      values.push(val);
      placeholders.push(`$${idx++}`);
    }

    const sql = `INSERT INTO ${this.schema}."${entityName}" (${fields.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
    const result = await this.pool.query(sql, values);
    return result.rows[0];
  }

  /** Read a single record by ID */
  async read(
    entityName: string,
    id: number | string
  ): Promise<Record<string, unknown> | null> {
    const sql = `SELECT * FROM ${this.schema}."${entityName}" WHERE id = $1`;
    const result = await this.pool.query(sql, [id]);
    return result.rows[0] || null;
  }

  /** List records with optional limit/offset */
  async list(
    entityName: string,
    limit = 50,
    offset = 0
  ): Promise<Record<string, unknown>[]> {
    const sql = `SELECT * FROM ${this.schema}."${entityName}" ORDER BY id DESC LIMIT $1 OFFSET $2`;
    const result = await this.pool.query(sql, [limit, offset]);
    return result.rows;
  }

  /** Update a record by ID */
  async update(
    entityName: string,
    id: number | string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    const entity = this.parsedSchema.entities[entityName];
    if (!entity) throw new Error(`Unknown entity: ${entityName}`);

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (key === "id") continue;
      const fieldDef = entity.fields[key];
      if (!fieldDef || fieldDef.auto) continue;
      sets.push(`"${key}" = $${idx++}`);
      values.push(val);
    }

    if (sets.length === 0) return this.read(entityName, id);

    values.push(id);
    const sql = `UPDATE ${this.schema}."${entityName}" SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(sql, values);
    return result.rows[0] || null;
  }

  /** Delete a record by ID */
  async delete(
    entityName: string,
    id: number | string
  ): Promise<boolean> {
    const sql = `DELETE FROM ${this.schema}."${entityName}" WHERE id = $1`;
    const result = await this.pool.query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
