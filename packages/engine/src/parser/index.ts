import YAML from "yaml";
import type {
  ParsedSchema,
  EntityDefinition,
  FieldDefinition,
  RolePermissions,
  EntityPermission,
  RuleDefinition,
  CrudOperation,
} from "../types.js";
import { parseFieldShortSyntax } from "./field-parser.js";

export function parseSchema(yamlString: string): ParsedSchema {
  const doc = YAML.parse(yamlString);

  if (!doc || typeof doc !== "object") {
    throw new Error("Invalid schema: document must be a YAML object");
  }

  const app = parseApp(doc.app);
  const entities = parseEntities(doc.entities);
  const permissions = parsePermissions(doc.permissions, entities);
  const rules = parseRules(doc.rules, entities);
  const autoFunctions = doc.functions?.auto === true;

  return Object.freeze({
    app,
    entities,
    permissions,
    rules,
    functions: [], // populated by functions module
    autoFunctions,
  }) as ParsedSchema;
}

function parseApp(raw: unknown): { name: string; version: string } {
  if (!raw || typeof raw !== "object") {
    throw new Error("Schema must have an 'app' section with name and version");
  }
  const app = raw as Record<string, unknown>;
  if (typeof app.name !== "string" || !app.name.trim()) {
    throw new Error("app.name is required and must be a non-empty string");
  }
  if (app.version === undefined) {
    throw new Error("app.version is required");
  }
  return { name: app.name.trim(), version: String(app.version) };
}

function parseEntities(
  raw: unknown
): Record<string, EntityDefinition> {
  if (!raw || typeof raw !== "object") {
    throw new Error("Schema must have an 'entities' section");
  }

  const result: Record<string, EntityDefinition> = {};
  const entities = raw as Record<string, unknown>;

  for (const [entityName, entityDef] of Object.entries(entities)) {
    if (!entityDef || typeof entityDef !== "object") {
      throw new Error(`Entity "${entityName}" must be an object`);
    }
    const def = entityDef as Record<string, unknown>;
    if (!def.fields || typeof def.fields !== "object") {
      throw new Error(`Entity "${entityName}" must have a 'fields' section`);
    }

    const fields: Record<string, FieldDefinition> = {};
    const rawFields = def.fields as Record<string, unknown>;

    for (const [fieldName, fieldDef] of Object.entries(rawFields)) {
      if (typeof fieldDef === "string") {
        fields[fieldName] = parseFieldShortSyntax(fieldName, fieldDef);
      } else if (fieldDef && typeof fieldDef === "object") {
        // Long-form field definition (future support)
        const fd = fieldDef as Record<string, unknown>;
        const fieldObj: FieldDefinition = {
          name: fieldName,
          type: (fd.type as FieldDefinition["type"]) || "string",
          required: fd.required === true,
        };
        if (fd.enumValues) {
          fieldObj.enumValues = fd.enumValues as string[];
        }
        if (fd.auto) {
          fieldObj.auto = true;
        }
        fields[fieldName] = fieldObj;
      } else {
        throw new Error(
          `Field "${fieldName}" in entity "${entityName}" must be a string or object`
        );
      }
    }

    result[entityName] = { name: entityName, fields };
  }

  return result;
}

function parsePermissions(
  raw: unknown,
  entities: Record<string, EntityDefinition>
): Record<string, RolePermissions> {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const result: Record<string, RolePermissions> = {};
  const roles = raw as Record<string, unknown>;

  for (const [roleName, roleDef] of Object.entries(roles)) {
    if (!roleDef || typeof roleDef !== "object") {
      throw new Error(`Permission role "${roleName}" must be an object`);
    }

    const rolePerms: RolePermissions = {};
    const entityPerms = roleDef as Record<string, unknown>;

    for (const [entityName, permDef] of Object.entries(entityPerms)) {
      if (!entities[entityName]) {
        throw new Error(
          `Permission references unknown entity "${entityName}" for role "${roleName}"`
        );
      }
      if (!permDef || typeof permDef !== "object") {
        throw new Error(
          `Permissions for "${roleName}.${entityName}" must be an object`
        );
      }

      const p = permDef as Record<string, unknown>;
      const updateRaw = p.update;

      let update: EntityPermission["update"];
      if (typeof updateRaw === "boolean") {
        update = updateRaw;
      } else if (updateRaw && typeof updateRaw === "object") {
        const u = updateRaw as Record<string, unknown>;
        update = {
          allowed: u.allowed === true,
          fields: Array.isArray(u.fields)
            ? (u.fields as string[])
            : [],
        };
      } else {
        update = false;
      }

      rolePerms[entityName] = {
        create: p.create === true,
        read: p.read === true,
        update,
        delete: p.delete === true,
      };
    }

    result[roleName] = rolePerms;
  }

  return result;
}

function parseRules(
  raw: unknown,
  entities: Record<string, EntityDefinition>
): RuleDefinition[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const rules: RuleDefinition[] = [];
  const rawRules = raw as Record<string, unknown>;

  for (const [ruleName, ruleDef] of Object.entries(rawRules)) {
    if (!ruleDef || typeof ruleDef !== "object") {
      throw new Error(`Rule "${ruleName}" must be an object`);
    }

    const r = ruleDef as Record<string, unknown>;

    if (typeof r.entity !== "string") {
      throw new Error(`Rule "${ruleName}" must have an 'entity' field`);
    }
    if (!entities[r.entity]) {
      throw new Error(
        `Rule "${ruleName}" references unknown entity "${r.entity}"`
      );
    }
    if (typeof r.condition !== "string") {
      throw new Error(`Rule "${ruleName}" must have a 'condition' field`);
    }
    if (r.action !== "reject") {
      throw new Error(
        `Rule "${ruleName}" action must be "reject" (got "${r.action}")`
      );
    }
    if (typeof r.message !== "string") {
      throw new Error(`Rule "${ruleName}" must have a 'message' field`);
    }

    // Parse "when" — can be comma-separated string or array
    let when: CrudOperation[];
    if (typeof r.when === "string") {
      when = r.when.split(",").map((w) => w.trim()) as CrudOperation[];
    } else if (Array.isArray(r.when)) {
      when = r.when as CrudOperation[];
    } else {
      throw new Error(
        `Rule "${ruleName}" must have a 'when' field (e.g., "create, update")`
      );
    }

    const validOps: Set<string> = new Set([
      "create",
      "read",
      "update",
      "delete",
    ]);
    for (const op of when) {
      if (!validOps.has(op)) {
        throw new Error(
          `Rule "${ruleName}" has invalid operation "${op}" in 'when'`
        );
      }
    }

    rules.push({
      name: ruleName,
      entity: r.entity,
      when,
      condition: r.condition,
      action: "reject",
      message: r.message,
    });
  }

  return rules;
}

export { parseFieldShortSyntax } from "./field-parser.js";
