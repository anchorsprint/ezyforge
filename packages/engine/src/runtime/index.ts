import type {
  ParsedSchema,
  Actor,
  FunctionResult,
  FunctionDefinition,
  StructuredError,
  FieldDefinition,
} from "../types.js";
import { checkPermission } from "../permissions/index.js";
import { runBeforeRules } from "../rules/index.js";
import type { DbAdapter } from "../db/index.js";

/**
 * Pipeline: resolveFunction → checkPermissions → validateInput
 *           → evaluateBeforeRules → executeDB → formatResponse
 */
export class Runtime {
  private schema: ParsedSchema;
  private functions: Map<string, FunctionDefinition>;
  private db: DbAdapter;

  constructor(
    schema: ParsedSchema,
    functions: FunctionDefinition[],
    db: DbAdapter
  ) {
    this.schema = schema;
    this.functions = new Map(functions.map((f) => [f.name, f]));
    this.db = db;
  }

  async call(
    functionName: string,
    input: Record<string, unknown>,
    actor: Actor
  ): Promise<FunctionResult> {
    // 1. Resolve function
    const fn = this.resolveFunction(functionName);
    if (!fn) {
      return {
        success: false,
        error: {
          error: "unknown_function",
          message: `Function "${functionName}" does not exist`,
        },
      };
    }

    // 2. Check permissions
    const inputFieldNames = Object.keys(input).filter((k) => k !== "id");
    const permCheck = checkPermission(
      this.schema,
      actor,
      fn.entity,
      fn.operation,
      fn.operation === "update" ? inputFieldNames : undefined
    );

    if (!permCheck.allowed) {
      return { success: false, error: permCheck.error };
    }

    // 3. Validate input
    const validation = this.validateInput(fn, input);
    if (validation) {
      return { success: false, error: validation };
    }

    // 4. Run before-rules (for create/update)
    if (fn.operation === "create" || fn.operation === "update") {
      const ruleCheck = runBeforeRules(
        this.schema,
        fn.entity,
        fn.operation,
        input
      );
      if (!ruleCheck.passed) {
        return { success: false, error: ruleCheck.error };
      }
    }

    // 5. Execute DB operation
    try {
      const data = await this.executeDb(fn, input);
      return { success: true, data };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Database operation failed";
      return {
        success: false,
        error: { error: "db_error", message },
      };
    }
  }

  private resolveFunction(name: string): FunctionDefinition | undefined {
    return this.functions.get(name);
  }

  private validateInput(
    fn: FunctionDefinition,
    input: Record<string, unknown>
  ): StructuredError | null {
    for (const field of fn.inputFields) {
      if (!field.required) continue;

      const val = input[field.name];
      if (val === undefined || val === null || val === "") {
        return {
          error: "validation_error",
          field: field.name,
          message: `Field "${field.name}" is required`,
        };
      }
    }

    // Type validation for provided fields
    const entity = this.schema.entities[fn.entity];
    if (entity) {
      for (const [key, val] of Object.entries(input)) {
        if (key === "id" || key === "limit" || key === "offset") continue;
        const fieldDef = entity.fields[key];
        if (!fieldDef) continue;
        const typeErr = this.validateFieldType(fieldDef, val);
        if (typeErr) return typeErr;
      }
    }

    return null;
  }

  private validateFieldType(
    field: FieldDefinition,
    value: unknown
  ): StructuredError | null {
    if (value === null || value === undefined) return null;

    switch (field.type) {
      case "integer":
        if (typeof value !== "number" || !Number.isInteger(value)) {
          return {
            error: "validation_error",
            field: field.name,
            message: `Field "${field.name}" must be an integer`,
          };
        }
        break;
      case "decimal":
        if (typeof value !== "number") {
          return {
            error: "validation_error",
            field: field.name,
            message: `Field "${field.name}" must be a number`,
          };
        }
        break;
      case "boolean":
        if (typeof value !== "boolean") {
          return {
            error: "validation_error",
            field: field.name,
            message: `Field "${field.name}" must be a boolean`,
          };
        }
        break;
      case "enum":
        if (
          field.enumValues &&
          !field.enumValues.includes(String(value))
        ) {
          return {
            error: "validation_error",
            field: field.name,
            message: `Field "${field.name}" must be one of: ${field.enumValues.join(", ")}`,
          };
        }
        break;
      case "date":
        if (typeof value === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return {
            error: "validation_error",
            field: field.name,
            message: `Field "${field.name}" must be a date in YYYY-MM-DD format`,
          };
        }
        break;
    }

    return null;
  }

  private async executeDb(
    fn: FunctionDefinition,
    input: Record<string, unknown>
  ): Promise<unknown> {
    switch (fn.operation) {
      case "create":
        return this.db.create(fn.entity, input);
      case "read": {
        if (fn.name.startsWith("list_")) {
          return this.db.list(
            fn.entity,
            (input.limit as number) || 50,
            (input.offset as number) || 0
          );
        }
        const record = await this.db.read(fn.entity, input.id as number);
        if (!record) {
          throw new Error(`${fn.entity} with id ${input.id} not found`);
        }
        return record;
      }
      case "update":
        return this.db.update(fn.entity, input.id as number, input);
      case "delete":
        return this.db.delete(fn.entity, input.id as number);
    }
  }
}
