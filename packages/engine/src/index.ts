import type { Pool } from "pg";
import type {
  Actor,
  FunctionDefinition,
  FunctionResult,
  ParsedSchema,
} from "./types.js";
import { parseSchema } from "./parser/index.js";
import { generateFunctions } from "./functions/index.js";
import { DbAdapter } from "./db/index.js";
import { Runtime } from "./runtime/index.js";

export class Engine {
  private schema: ParsedSchema;
  private functions: FunctionDefinition[];
  private runtime: Runtime;
  private db: DbAdapter;

  private constructor(
    schema: ParsedSchema,
    functions: FunctionDefinition[],
    runtime: Runtime,
    db: DbAdapter
  ) {
    this.schema = schema;
    this.functions = functions;
    this.runtime = runtime;
    this.db = db;
  }

  /**
   * Load and initialize an engine from a YAML schema string.
   *
   * Parses the schema, generates functions, creates DB tables,
   * and returns a ready-to-use Engine instance.
   */
  static async load(
    schemaYaml: string,
    pgPool: Pool,
    appId: string
  ): Promise<Engine> {
    // 1. Parse schema
    const schema = parseSchema(schemaYaml);

    // 2. Generate functions from schema
    const functions = generateFunctions(schema);

    // 3. Initialize DB (create schema + tables)
    const db = new DbAdapter(pgPool, appId, schema);
    await db.initialize();

    // 4. Create runtime
    const runtime = new Runtime(schema, functions, db);

    return new Engine(schema, functions, runtime, db);
  }

  /**
   * Call a function through the engine pipeline.
   *
   * Pipeline: resolveFunction → checkPermissions → validateInput
   *           → evaluateBeforeRules → executeDB → formatResponse
   */
  async call(
    functionName: string,
    input: Record<string, unknown>,
    actor: Actor
  ): Promise<FunctionResult> {
    return this.runtime.call(functionName, input, actor);
  }

  /** Get all available function definitions */
  getFunctions(): FunctionDefinition[] {
    return [...this.functions];
  }

  /** Get the parsed schema (immutable) */
  getSchema(): ParsedSchema {
    return this.schema;
  }
}

// Re-export types and key modules for library consumers
export type {
  Actor,
  FunctionDefinition,
  FunctionResult,
  StructuredError,
  ParsedSchema,
  FieldDefinition,
  EntityDefinition,
  CrudOperation,
  FieldType,
} from "./types.js";

export { parseSchema } from "./parser/index.js";
export { assessExpression } from "./rules/evaluator.js";
export { checkPermission } from "./permissions/index.js";
export { generateFunctions } from "./functions/index.js";
export { DbAdapter } from "./db/index.js";
export { Runtime } from "./runtime/index.js";
