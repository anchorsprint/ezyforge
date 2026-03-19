import type {
  ParsedSchema,
  FunctionDefinition,
  EntityDefinition,
  FieldDefinition,
  CrudOperation,
  RolePermissions,
} from "../types.js";

/**
 * Generate function definitions from a parsed schema.
 *
 * When autoFunctions is true, generates CRUD functions for each entity
 * based on what permissions allow. If a role has no delete permission,
 * no delete function is generated for that entity.
 */
export function generateFunctions(schema: ParsedSchema): FunctionDefinition[] {
  if (!schema.autoFunctions) {
    return [];
  }

  const functions: FunctionDefinition[] = [];

  for (const [entityName, entity] of Object.entries(schema.entities)) {
    // Determine which operations ANY role has access to
    const ops = getAvailableOperations(schema, entityName);

    if (ops.has("create")) {
      functions.push(makeCreateFunction(entityName, entity));
    }
    if (ops.has("read")) {
      functions.push(makeReadFunction(entityName, entity));
      functions.push(makeListFunction(entityName, entity));
    }
    if (ops.has("update")) {
      functions.push(makeUpdateFunction(entityName, entity));
    }
    if (ops.has("delete")) {
      functions.push(makeDeleteFunction(entityName, entity));
    }
  }

  return functions;
}

function getAvailableOperations(
  schema: ParsedSchema,
  entityName: string
): Set<CrudOperation> {
  const ops = new Set<CrudOperation>();

  for (const rolePerms of Object.values(schema.permissions)) {
    const ep = rolePerms[entityName];
    if (!ep) continue;

    if (ep.create) ops.add("create");
    if (ep.read) ops.add("read");
    if (ep.update === true || (typeof ep.update === "object" && ep.update.allowed)) {
      ops.add("update");
    }
    if (ep.delete) ops.add("delete");
  }

  return ops;
}

function getWritableFields(entity: EntityDefinition): FieldDefinition[] {
  return Object.values(entity.fields).filter(
    (f) => !f.auto && f.name !== "id"
  );
}

function makeCreateFunction(
  entityName: string,
  entity: EntityDefinition
): FunctionDefinition {
  return {
    name: `create_${entityName}`,
    entity: entityName,
    operation: "create",
    inputFields: getWritableFields(entity),
    description: `Create a new ${entityName} record`,
  };
}

function makeReadFunction(
  entityName: string,
  entity: EntityDefinition
): FunctionDefinition {
  return {
    name: `get_${entityName}`,
    entity: entityName,
    operation: "read",
    inputFields: [
      { name: "id", type: "integer", required: true },
    ],
    description: `Get a single ${entityName} by ID`,
  };
}

function makeListFunction(
  entityName: string,
  entity: EntityDefinition
): FunctionDefinition {
  return {
    name: `list_${entityName}s`,
    entity: entityName,
    operation: "read",
    inputFields: [
      { name: "limit", type: "integer", required: false },
      { name: "offset", type: "integer", required: false },
    ],
    description: `List ${entityName} records`,
  };
}

function makeUpdateFunction(
  entityName: string,
  entity: EntityDefinition
): FunctionDefinition {
  // For updates, all fields except id are optional
  const optionalFields = getWritableFields(entity).map((f) => ({
    ...f,
    required: false,
  }));
  return {
    name: `update_${entityName}`,
    entity: entityName,
    operation: "update",
    inputFields: [
      { name: "id", type: "integer", required: true },
      ...optionalFields,
    ],
    description: `Update an existing ${entityName} record`,
  };
}

function makeDeleteFunction(
  entityName: string,
  entity: EntityDefinition
): FunctionDefinition {
  return {
    name: `delete_${entityName}`,
    entity: entityName,
    operation: "delete",
    inputFields: [
      { name: "id", type: "integer", required: true },
    ],
    description: `Delete a ${entityName} record`,
  };
}
