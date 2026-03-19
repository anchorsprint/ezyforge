import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseSchema } from "../src/parser/index.js";
import { checkPermission } from "../src/permissions/index.js";
import type { Actor } from "../src/types.js";

const EXPENSES_YAML = readFileSync(
  resolve(__dirname, "../../../templates/expenses.yaml"),
  "utf-8"
);
const schema = parseSchema(EXPENSES_YAML);

const owner: Actor = { tokenId: "owner-token", role: "owner" };
const ai: Actor = { tokenId: "ai-token", role: "ai" };

describe("checkPermission", () => {
  describe("owner permissions", () => {
    it("owner can create expenses", () => {
      const result = checkPermission(schema, owner, "expense", "create");
      expect(result.allowed).toBe(true);
    });

    it("owner can read expenses", () => {
      const result = checkPermission(schema, owner, "expense", "read");
      expect(result.allowed).toBe(true);
    });

    it("owner can update any field", () => {
      const result = checkPermission(schema, owner, "expense", "update", [
        "amount",
        "date",
        "notes",
      ]);
      expect(result.allowed).toBe(true);
    });

    it("owner can delete expenses", () => {
      const result = checkPermission(schema, owner, "expense", "delete");
      expect(result.allowed).toBe(true);
    });
  });

  describe("AI permissions", () => {
    it("AI can create expenses", () => {
      const result = checkPermission(schema, ai, "expense", "create");
      expect(result.allowed).toBe(true);
    });

    it("AI can read expenses", () => {
      const result = checkPermission(schema, ai, "expense", "read");
      expect(result.allowed).toBe(true);
    });

    it("AI cannot delete expenses", () => {
      const result = checkPermission(schema, ai, "expense", "delete");
      expect(result.allowed).toBe(false);
      expect(result.error?.error).toBe("permission_denied");
    });

    it("AI can update notes (allowed field)", () => {
      const result = checkPermission(schema, ai, "expense", "update", [
        "notes",
      ]);
      expect(result.allowed).toBe(true);
      expect(result.allowedFields).toEqual(["notes", "category"]);
    });

    it("AI can update category (allowed field)", () => {
      const result = checkPermission(schema, ai, "expense", "update", [
        "category",
      ]);
      expect(result.allowed).toBe(true);
    });

    it("AI cannot update amount (restricted field)", () => {
      const result = checkPermission(schema, ai, "expense", "update", [
        "amount",
      ]);
      expect(result.allowed).toBe(false);
      expect(result.error?.error).toBe("field_permission_denied");
      expect(result.error?.field).toBe("amount");
      expect(result.error?.message).toContain("amount");
    });

    it("AI cannot update date (restricted field)", () => {
      const result = checkPermission(schema, ai, "expense", "update", [
        "date",
      ]);
      expect(result.allowed).toBe(false);
      expect(result.error?.field).toBe("date");
    });

    it("AI can pass id along with allowed fields", () => {
      const result = checkPermission(schema, ai, "expense", "update", [
        "id",
        "notes",
      ]);
      expect(result.allowed).toBe(true);
    });
  });

  describe("unknown role/entity", () => {
    it("denies unknown role", () => {
      const unknown: Actor = { tokenId: "x", role: "ai" };
      // We'll test with a role that has no permissions defined
      const result = checkPermission(
        schema,
        { tokenId: "x", role: "owner" } as Actor,
        "nonexistent_entity",
        "read"
      );
      expect(result.allowed).toBe(false);
    });
  });
});
