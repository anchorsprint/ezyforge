import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseSchema } from "../src/parser/index.js";
import { parseFieldShortSyntax } from "../src/parser/field-parser.js";

// ─── Load expenses template ─────────────────────────────────────────────────

const EXPENSES_YAML = readFileSync(
  resolve(__dirname, "../../../templates/expenses.yaml"),
  "utf-8"
);

// ─── Field Parser Tests ─────────────────────────────────────────────────────

describe("parseFieldShortSyntax", () => {
  it("parses simple string type", () => {
    const f = parseFieldShortSyntax("name", "str");
    expect(f.type).toBe("string");
    expect(f.required).toBe(false);
  });

  it("parses required decimal", () => {
    const f = parseFieldShortSyntax("amount", "decimal, req");
    expect(f.type).toBe("decimal");
    expect(f.required).toBe(true);
  });

  it("parses auto type", () => {
    const f = parseFieldShortSyntax("id", "auto");
    expect(f.type).toBe("auto");
    expect(f.auto).toBe(true);
    expect(f.required).toBe(false);
  });

  it("parses datetime with auto modifier", () => {
    const f = parseFieldShortSyntax("created_at", "datetime, auto");
    expect(f.type).toBe("datetime");
    expect(f.auto).toBe(true);
  });

  it("parses enum with values", () => {
    const f = parseFieldShortSyntax(
      "category",
      "enum(food, transport, other)"
    );
    expect(f.type).toBe("enum");
    expect(f.enumValues).toEqual(["food", "transport", "other"]);
  });

  it("parses enum with required modifier", () => {
    const f = parseFieldShortSyntax(
      "category",
      "enum(food, transport), req"
    );
    expect(f.type).toBe("enum");
    expect(f.required).toBe(true);
    expect(f.enumValues).toEqual(["food", "transport"]);
  });

  it("parses date type", () => {
    const f = parseFieldShortSyntax("date", "date, req");
    expect(f.type).toBe("date");
    expect(f.required).toBe(true);
  });

  it("parses boolean type", () => {
    const f = parseFieldShortSyntax("active", "bool");
    expect(f.type).toBe("boolean");
  });

  it("parses integer type", () => {
    const f = parseFieldShortSyntax("count", "int");
    expect(f.type).toBe("integer");
  });

  it("throws on invalid type", () => {
    expect(() => parseFieldShortSyntax("x", "blob")).toThrow("Invalid field type");
  });
});

// ─── Schema Parser Tests ────────────────────────────────────────────────────

describe("parseSchema", () => {
  it("parses the expenses template successfully", () => {
    const schema = parseSchema(EXPENSES_YAML);
    expect(schema.app.name).toBe("expenses");
    expect(schema.app.version).toBe("1.0");
  });

  it("parses entities correctly", () => {
    const schema = parseSchema(EXPENSES_YAML);
    expect(schema.entities.expense).toBeDefined();
    const expense = schema.entities.expense;

    expect(expense.fields.id.type).toBe("auto");
    expect(expense.fields.amount.type).toBe("decimal");
    expect(expense.fields.amount.required).toBe(true);
    expect(expense.fields.category.type).toBe("enum");
    expect(expense.fields.category.enumValues).toContain("food");
    expect(expense.fields.date.type).toBe("date");
    expect(expense.fields.notes.type).toBe("string");
    expect(expense.fields.created_at.type).toBe("datetime");
    expect(expense.fields.created_at.auto).toBe(true);
  });

  it("parses permissions correctly", () => {
    const schema = parseSchema(EXPENSES_YAML);

    // Owner has full access
    const ownerPerms = schema.permissions.owner.expense;
    expect(ownerPerms.create).toBe(true);
    expect(ownerPerms.read).toBe(true);
    expect(ownerPerms.update).toBe(true);
    expect(ownerPerms.delete).toBe(true);

    // AI has restricted access
    const aiPerms = schema.permissions.ai.expense;
    expect(aiPerms.create).toBe(true);
    expect(aiPerms.read).toBe(true);
    expect(aiPerms.delete).toBe(false);
    expect(typeof aiPerms.update).toBe("object");
    if (typeof aiPerms.update === "object") {
      expect(aiPerms.update.allowed).toBe(true);
      expect(aiPerms.update.fields).toEqual(["notes", "category"]);
    }
  });

  it("parses rules correctly", () => {
    const schema = parseSchema(EXPENSES_YAML);
    expect(schema.rules).toHaveLength(1);

    const rule = schema.rules[0];
    expect(rule.name).toBe("no_future_dates");
    expect(rule.entity).toBe("expense");
    expect(rule.when).toEqual(["create", "update"]);
    expect(rule.condition).toBe("date > today()");
    expect(rule.action).toBe("reject");
  });

  it("sets autoFunctions flag", () => {
    const schema = parseSchema(EXPENSES_YAML);
    expect(schema.autoFunctions).toBe(true);
  });

  it("schema is frozen (immutable)", () => {
    const schema = parseSchema(EXPENSES_YAML);
    expect(Object.isFrozen(schema)).toBe(true);
  });

  it("throws on missing app section", () => {
    expect(() => parseSchema("entities:\n  foo:\n    fields:\n      id: auto")).toThrow(
      "app"
    );
  });

  it("throws on missing entities section", () => {
    expect(() =>
      parseSchema("app:\n  name: test\n  version: '1.0'")
    ).toThrow("entities");
  });

  it("throws on rule referencing unknown entity", () => {
    const yaml = `
app:
  name: test
  version: "1.0"
entities:
  item:
    fields:
      id: auto
rules:
  bad_rule:
    entity: nonexistent
    when: create
    condition: "x > 1"
    action: reject
    message: "nope"
`;
    expect(() => parseSchema(yaml)).toThrow("unknown entity");
  });
});
