import type { FieldDefinition, FieldType } from "../types.js";

const VALID_TYPES: Set<string> = new Set([
  "str",
  "string",
  "int",
  "integer",
  "decimal",
  "bool",
  "boolean",
  "date",
  "datetime",
  "auto",
]);

const TYPE_MAP: Record<string, FieldType> = {
  str: "string",
  string: "string",
  int: "integer",
  integer: "integer",
  decimal: "decimal",
  bool: "boolean",
  boolean: "boolean",
  date: "date",
  datetime: "datetime",
  auto: "auto",
};

/**
 * Parse short syntax field definition.
 *
 * Examples:
 *   "str"                    → { type: "string", required: false }
 *   "decimal, req"           → { type: "decimal", required: true }
 *   "enum(food, transport)"  → { type: "enum", enumValues: ["food", "transport"] }
 *   "datetime, auto"         → { type: "datetime", auto: true }
 *   "auto"                   → { type: "auto", auto: true }
 */
export function parseFieldShortSyntax(
  fieldName: string,
  raw: string
): FieldDefinition {
  const trimmed = raw.trim();

  // Check for enum(...)
  const enumMatch = trimmed.match(/^enum\(([^)]+)\)/);
  let type: FieldType;
  let enumValues: string[] | undefined;
  let remaining: string;

  if (enumMatch) {
    type = "enum";
    enumValues = enumMatch[1].split(",").map((v) => v.trim());
    remaining = trimmed.slice(enumMatch[0].length);
  } else {
    // First token is the type
    const parts = trimmed.split(",").map((p) => p.trim());
    const typePart = parts[0].toLowerCase();

    if (!VALID_TYPES.has(typePart)) {
      throw new Error(
        `Invalid field type "${typePart}" for field "${fieldName}". Valid types: ${[...VALID_TYPES].join(", ")}`
      );
    }

    type = TYPE_MAP[typePart];
    remaining = "," + parts.slice(1).join(",");
  }

  // Parse remaining modifiers
  const modifiers = remaining
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean);

  const required = modifiers.includes("req") || modifiers.includes("required");
  const auto =
    type === "auto" || modifiers.includes("auto");

  return {
    name: fieldName,
    type,
    required: auto ? false : required,
    ...(enumValues && { enumValues }),
    ...(auto && { auto: true }),
  };
}
