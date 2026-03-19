import type {
  ParsedSchema,
  Actor,
  CrudOperation,
  StructuredError,
} from "../types.js";

export interface PermissionCheckResult {
  allowed: boolean;
  error?: StructuredError;
  allowedFields?: string[];
}

/**
 * Check if an actor has permission to perform an operation on an entity.
 *
 * For update operations with field-level restrictions, returns the list
 * of allowed fields. Any input fields outside this list should be rejected.
 */
export function checkPermission(
  schema: ParsedSchema,
  actor: Actor,
  entityName: string,
  operation: CrudOperation,
  inputFields?: string[]
): PermissionCheckResult {
  const rolePerms = schema.permissions[actor.role];

  // No permissions defined for this role → deny all
  if (!rolePerms) {
    return {
      allowed: false,
      error: {
        error: "permission_denied",
        message: `Role "${actor.role}" has no permissions defined`,
      },
    };
  }

  const entityPerms = rolePerms[entityName];
  if (!entityPerms) {
    return {
      allowed: false,
      error: {
        error: "permission_denied",
        message: `Role "${actor.role}" has no permissions for entity "${entityName}"`,
      },
    };
  }

  // Check operation-level permission
  if (operation === "update") {
    const updatePerm = entityPerms.update;

    if (updatePerm === false) {
      return {
        allowed: false,
        error: {
          error: "permission_denied",
          message: `Role "${actor.role}" cannot update "${entityName}"`,
        },
      };
    }

    if (updatePerm === true) {
      return { allowed: true };
    }

    // Field-level restriction
    if (typeof updatePerm === "object") {
      if (!updatePerm.allowed) {
        return {
          allowed: false,
          error: {
            error: "permission_denied",
            message: `Role "${actor.role}" cannot update "${entityName}"`,
          },
        };
      }

      const allowedFields = updatePerm.fields;

      // Check if any input fields are outside allowed list
      if (inputFields) {
        const denied = inputFields.filter(
          (f) => !allowedFields.includes(f) && f !== "id"
        );
        if (denied.length > 0) {
          return {
            allowed: false,
            error: {
              error: "field_permission_denied",
              field: denied[0],
              message: `Role "${actor.role}" cannot update field "${denied[0]}" on "${entityName}". Allowed fields: ${allowedFields.join(", ")}`,
            },
          };
        }
      }

      return { allowed: true, allowedFields };
    }
  }

  // Simple boolean permission for create/read/delete
  const allowed = entityPerms[operation] === true;

  if (!allowed) {
    return {
      allowed: false,
      error: {
        error: "permission_denied",
        message: `Role "${actor.role}" cannot ${operation} "${entityName}"`,
      },
    };
  }

  return { allowed: true };
}
