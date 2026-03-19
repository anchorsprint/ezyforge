import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseSchema } from "../src/parser/index.js";
import { generateFunctions } from "../src/functions/index.js";
import { Runtime } from "../src/runtime/index.js";
import type { DbAdapter } from "../src/db/index.js";
import type { Actor, ParsedSchema, FunctionDefinition } from "../src/types.js";

const EXPENSES_YAML = readFileSync(
  resolve(__dirname, "../../../templates/expenses.yaml"),
  "utf-8"
);

// ─── Mock DB Adapter ────────────────────────────────────────────────────────

function createMockDb(): DbAdapter {
  let nextId = 1;
  const store: Record<string, Record<string, unknown>[]> = { expense: [] };

  return {
    create: vi.fn(async (entity: string, data: Record<string, unknown>) => {
      const record = { id: nextId++, ...data, created_at: new Date().toISOString() };
      store[entity].push(record);
      return record;
    }),
    read: vi.fn(async (entity: string, id: number) => {
      return store[entity].find((r) => r.id === id) || null;
    }),
    list: vi.fn(async (entity: string, limit: number, offset: number) => {
      return store[entity].slice(offset, offset + limit);
    }),
    update: vi.fn(async (entity: string, id: number, data: Record<string, unknown>) => {
      const record = store[entity].find((r) => r.id === id);
      if (!record) return null;
      Object.assign(record, data);
      return record;
    }),
    delete: vi.fn(async (entity: string, id: number) => {
      const idx = store[entity].findIndex((r) => r.id === id);
      if (idx === -1) return false;
      store[entity].splice(idx, 1);
      return true;
    }),
    initialize: vi.fn(async () => {}),
  } as unknown as DbAdapter;
}

// ─── Test Setup ─────────────────────────────────────────────────────────────

let schema: ParsedSchema;
let functions: FunctionDefinition[];
let runtime: Runtime;
let mockDb: DbAdapter;

const owner: Actor = { tokenId: "owner-token", role: "owner" };
const ai: Actor = { tokenId: "ai-token", role: "ai" };

// Patch Date for deterministic rule checks (2026-03-15)
const FIXED_NOW = new Date("2026-03-15T12:00:00Z");
const OriginalDate = globalThis.Date;

beforeEach(() => {
  schema = parseSchema(EXPENSES_YAML);
  functions = generateFunctions(schema);
  mockDb = createMockDb();
  runtime = new Runtime(schema, functions, mockDb);

  // Fix Date.now() for rule determinism
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

// ─── Pipeline Tests ─────────────────────────────────────────────────────────

describe("Runtime pipeline", () => {
  describe("create_expense", () => {
    it("AI can create an expense with valid data", async () => {
      const result = await runtime.call(
        "create_expense",
        {
          amount: 25.5,
          category: "food",
          date: "2026-03-10",
          description: "Lunch",
        },
        ai
      );
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((result.data as Record<string, unknown>).amount).toBe(25.5);
    });

    it("rejects missing required fields", async () => {
      const result = await runtime.call(
        "create_expense",
        { description: "just a note" },
        ai
      );
      expect(result.success).toBe(false);
      expect(result.error?.error).toBe("validation_error");
      expect(result.error?.field).toBe("amount");
    });

    it("rejects future dates via rule engine", async () => {
      const result = await runtime.call(
        "create_expense",
        {
          amount: 50,
          category: "food",
          date: "2026-03-20", // future relative to FIXED_NOW
        },
        ai
      );
      expect(result.success).toBe(false);
      expect(result.error?.error).toBe("rule_violation");
      expect(result.error?.rule).toBe("no_future_dates");
    });

    it("rejects invalid enum values", async () => {
      const result = await runtime.call(
        "create_expense",
        {
          amount: 50,
          category: "gambling",
          date: "2026-03-10",
        },
        ai
      );
      expect(result.success).toBe(false);
      expect(result.error?.error).toBe("validation_error");
      expect(result.error?.field).toBe("category");
    });

    it("rejects invalid date format", async () => {
      const result = await runtime.call(
        "create_expense",
        {
          amount: 50,
          category: "food",
          date: "March 10, 2026",
        },
        ai
      );
      expect(result.success).toBe(false);
      expect(result.error?.error).toBe("validation_error");
      expect(result.error?.field).toBe("date");
    });
  });

  describe("update_expense", () => {
    it("AI can update notes (allowed field)", async () => {
      // First create as owner
      await runtime.call(
        "create_expense",
        { amount: 100, category: "transport", date: "2026-03-10" },
        owner
      );

      const result = await runtime.call(
        "update_expense",
        { id: 1, notes: "Updated note" },
        ai
      );
      expect(result.success).toBe(true);
    });

    it("AI can update category (allowed field)", async () => {
      await runtime.call(
        "create_expense",
        { amount: 100, category: "transport", date: "2026-03-10" },
        owner
      );

      const result = await runtime.call(
        "update_expense",
        { id: 1, category: "food" },
        ai
      );
      expect(result.success).toBe(true);
    });

    it("AI cannot update amount (restricted field)", async () => {
      await runtime.call(
        "create_expense",
        { amount: 100, category: "transport", date: "2026-03-10" },
        owner
      );

      const result = await runtime.call(
        "update_expense",
        { id: 1, amount: 999 },
        ai
      );
      expect(result.success).toBe(false);
      expect(result.error?.error).toBe("field_permission_denied");
      expect(result.error?.field).toBe("amount");
    });

    it("AI cannot update date (restricted field)", async () => {
      const result = await runtime.call(
        "update_expense",
        { id: 1, date: "2026-03-01" },
        ai
      );
      expect(result.success).toBe(false);
      expect(result.error?.error).toBe("field_permission_denied");
    });

    it("owner can update any field", async () => {
      await runtime.call(
        "create_expense",
        { amount: 100, category: "transport", date: "2026-03-10" },
        owner
      );

      const result = await runtime.call(
        "update_expense",
        { id: 1, amount: 200, date: "2026-03-11" },
        owner
      );
      expect(result.success).toBe(true);
    });
  });

  describe("delete_expense", () => {
    it("AI cannot delete expenses", async () => {
      const result = await runtime.call(
        "delete_expense",
        { id: 1 },
        ai
      );
      expect(result.success).toBe(false);
      expect(result.error?.error).toBe("permission_denied");
    });

    it("owner can delete expenses", async () => {
      await runtime.call(
        "create_expense",
        { amount: 100, category: "food", date: "2026-03-10" },
        owner
      );

      const result = await runtime.call(
        "delete_expense",
        { id: 1 },
        owner
      );
      expect(result.success).toBe(true);
    });
  });

  describe("read operations", () => {
    it("AI can read a single expense", async () => {
      await runtime.call(
        "create_expense",
        { amount: 42, category: "utilities", date: "2026-03-10" },
        owner
      );

      const result = await runtime.call("get_expense", { id: 1 }, ai);
      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).amount).toBe(42);
    });

    it("AI can list expenses", async () => {
      await runtime.call(
        "create_expense",
        { amount: 10, category: "food", date: "2026-03-10" },
        owner
      );
      await runtime.call(
        "create_expense",
        { amount: 20, category: "transport", date: "2026-03-11" },
        owner
      );

      const result = await runtime.call("list_expenses", {}, ai);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("unknown functions", () => {
    it("returns error for nonexistent function", async () => {
      const result = await runtime.call("nuke_everything", {}, ai);
      expect(result.success).toBe(false);
      expect(result.error?.error).toBe("unknown_function");
    });
  });
});
