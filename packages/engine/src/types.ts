// ─── Core Engine Types ───────────────────────────────────────────────────────

import type { Pool } from "pg";

// ─── Schema Types (output of parser) ─────────────────────────────────────────

export type FieldType =
  | "string"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "enum"
  | "auto";

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required: boolean;
  enumValues?: string[];
  auto?: boolean;
  defaultValue?: unknown;
}

export interface EntityDefinition {
  name: string;
  fields: Record<string, FieldDefinition>;
}

export type CrudOperation = "create" | "read" | "update" | "delete";

export interface EntityPermission {
  create: boolean;
  read: boolean;
  update: boolean | { allowed: boolean; fields: string[] };
  delete: boolean;
}

export interface RolePermissions {
  [entityName: string]: EntityPermission;
}

export interface RuleDefinition {
  name: string;
  entity: string;
  when: CrudOperation[];
  condition: string;
  action: "reject";
  message: string;
}

export interface FunctionDefinition {
  name: string;
  entity: string;
  operation: CrudOperation;
  inputFields: FieldDefinition[];
  description: string;
}

export interface ParsedSchema {
  app: { name: string; version: string };
  entities: Record<string, EntityDefinition>;
  permissions: Record<string, RolePermissions>;
  rules: RuleDefinition[];
  functions: FunctionDefinition[];
  autoFunctions: boolean;
}

// ─── Runtime Types ───────────────────────────────────────────────────────────

export interface Actor {
  tokenId: string;
  role: "owner" | "ai";
}

export interface StructuredError {
  error: string;
  rule?: string;
  field?: string;
  message: string;
}

export interface FunctionResult {
  success: boolean;
  data?: unknown;
  error?: StructuredError;
  warnings?: string[];
}

// ─── Engine Interface ────────────────────────────────────────────────────────

export interface EngineInterface {
  call(
    functionName: string,
    input: Record<string, unknown>,
    actor: Actor
  ): Promise<FunctionResult>;
  getFunctions(): FunctionDefinition[];
}

// ─── DB Types ────────────────────────────────────────────────────────────────

export type PgPool = Pool;
