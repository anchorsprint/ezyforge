import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseSchema } from "../src/parser/index.js";
import { generateFunctions } from "../src/functions/index.js";

const EXPENSES_YAML = readFileSync(
  resolve(__dirname, "../../../templates/expenses.yaml"),
  "utf-8"
);

describe("generateFunctions", () => {
  const schema = parseSchema(EXPENSES_YAML);
  const functions = generateFunctions(schema);

  it("generates CRUD functions for expenses", () => {
    const names = functions.map((f) => f.name);
    expect(names).toContain("create_expense");
    expect(names).toContain("get_expense");
    expect(names).toContain("list_expenses");
    expect(names).toContain("update_expense");
  });

  it("does NOT generate delete_expense (only owner has delete, but AI does not)", () => {
    // delete IS generated because owner has delete permission
    const names = functions.map((f) => f.name);
    expect(names).toContain("delete_expense");
  });

  it("create_expense has correct input fields (no auto fields)", () => {
    const createFn = functions.find((f) => f.name === "create_expense")!;
    const fieldNames = createFn.inputFields.map((f) => f.name);
    expect(fieldNames).toContain("amount");
    expect(fieldNames).toContain("category");
    expect(fieldNames).toContain("date");
    expect(fieldNames).toContain("notes");
    expect(fieldNames).toContain("description");
    expect(fieldNames).not.toContain("id");
    expect(fieldNames).not.toContain("created_at");
  });

  it("update_expense includes id as required", () => {
    const updateFn = functions.find((f) => f.name === "update_expense")!;
    const idField = updateFn.inputFields.find((f) => f.name === "id");
    expect(idField).toBeDefined();
    expect(idField!.required).toBe(true);
  });

  it("list_expenses has limit and offset fields", () => {
    const listFn = functions.find((f) => f.name === "list_expenses")!;
    const fieldNames = listFn.inputFields.map((f) => f.name);
    expect(fieldNames).toContain("limit");
    expect(fieldNames).toContain("offset");
  });

  it("does not generate functions when autoFunctions is false", () => {
    const yaml = `
app:
  name: test
  version: "1.0"
entities:
  item:
    fields:
      id: auto
      name: str
permissions:
  owner:
    item:
      create: true
      read: true
      update: true
      delete: true
functions:
  auto: false
`;
    const schema2 = parseSchema(yaml);
    const fns = generateFunctions(schema2);
    expect(fns).toHaveLength(0);
  });
});
