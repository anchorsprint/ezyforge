import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { assessExpression } from "../src/rules/evaluator.js";
import { runBeforeRules } from "../src/rules/index.js";
import { parseSchema } from "../src/parser/index.js";

const EXPENSES_YAML = readFileSync(
  resolve(__dirname, "../../../templates/expenses.yaml"),
  "utf-8"
);

// ─── Expression Evaluator Tests ─────────────────────────────────────────────

describe("assessExpression", () => {
  // Use a fixed date for deterministic tests: 2026-03-15
  const now = new Date("2026-03-15T12:00:00Z");

  describe("comparisons", () => {
    it("number greater than", () => {
      expect(assessExpression("amount > 100", { amount: 150 }, now)).toBe(true);
      expect(assessExpression("amount > 100", { amount: 50 }, now)).toBe(false);
    });

    it("number equality", () => {
      expect(assessExpression("count == 5", { count: 5 }, now)).toBe(true);
      expect(assessExpression("count == 5", { count: 3 }, now)).toBe(false);
    });

    it("number inequality", () => {
      expect(assessExpression("count != 5", { count: 3 }, now)).toBe(true);
    });

    it("less than or equal", () => {
      expect(assessExpression("price <= 10", { price: 10 }, now)).toBe(true);
      expect(assessExpression("price <= 10", { price: 11 }, now)).toBe(false);
    });

    it("string equality", () => {
      expect(
        assessExpression('status == "active"', { status: "active" }, now)
      ).toBe(true);
    });

    it("string comparison (dates as strings)", () => {
      expect(
        assessExpression(
          'date > "2026-03-10"',
          { date: "2026-03-12" },
          now
        )
      ).toBe(true);
    });
  });

  describe("date functions", () => {
    it("today() returns current date", () => {
      expect(assessExpression("today()", {}, now)).toBe("2026-03-15");
    });

    it("date > today() detects future dates", () => {
      expect(
        assessExpression("date > today()", { date: "2026-03-20" }, now)
      ).toBe(true);
      expect(
        assessExpression("date > today()", { date: "2026-03-10" }, now)
      ).toBe(false);
      expect(
        assessExpression("date > today()", { date: "2026-03-15" }, now)
      ).toBe(false); // equal is not greater
    });

    it("som() returns start of month", () => {
      expect(assessExpression("som()", {}, now)).toBe("2026-03-01");
    });

    it("now() returns ISO timestamp", () => {
      const result = assessExpression("now()", {}, now) as string;
      expect(result).toContain("2026-03-15");
    });
  });

  describe("boolean logic", () => {
    it("AND operator", () => {
      expect(
        assessExpression("a > 1 AND b > 1", { a: 2, b: 2 }, now)
      ).toBe(true);
      expect(
        assessExpression("a > 1 AND b > 1", { a: 2, b: 0 }, now)
      ).toBe(false);
    });

    it("OR operator", () => {
      expect(
        assessExpression("a > 10 OR b > 10", { a: 5, b: 15 }, now)
      ).toBe(true);
      expect(
        assessExpression("a > 10 OR b > 10", { a: 5, b: 5 }, now)
      ).toBe(false);
    });

    it("NOT operator", () => {
      expect(assessExpression("NOT active", { active: false }, now)).toBe(true);
      expect(assessExpression("NOT active", { active: true }, now)).toBe(false);
    });

    it("combined AND/OR/NOT", () => {
      expect(
        assessExpression(
          "a > 1 AND (b > 1 OR NOT c)",
          { a: 2, b: 0, c: false },
          now
        )
      ).toBe(true);
    });
  });

  describe("null handling", () => {
    it("is null", () => {
      expect(assessExpression("name is null", { name: null }, now)).toBe(true);
      expect(assessExpression("name is null", {}, now)).toBe(true);
      expect(assessExpression("name is null", { name: "hi" }, now)).toBe(false);
    });

    it("is not null", () => {
      expect(assessExpression("name is not null", { name: "hi" }, now)).toBe(
        true
      );
      expect(assessExpression("name is not null", {}, now)).toBe(false);
    });

    it("null comparisons return false (except equality)", () => {
      expect(assessExpression("x > 5", {}, now)).toBe(false);
      expect(assessExpression("x == null", {}, now)).toBe(true);
    });
  });

  describe("invalid expressions", () => {
    it("throws on unknown function", () => {
      expect(() => assessExpression("blah()", {}, now)).toThrow(
        "Unknown function"
      );
    });

    it("throws on unterminated string", () => {
      expect(() => assessExpression('"hello', {}, now)).toThrow(
        "Unterminated"
      );
    });

    it("throws on unexpected character", () => {
      expect(() => assessExpression("a @ b", {}, now)).toThrow("Unexpected");
    });
  });
});

// ─── Rule Engine Tests (using expenses template) ────────────────────────────

describe("runBeforeRules", () => {
  const schema = parseSchema(EXPENSES_YAML);
  const now = new Date("2026-03-15T12:00:00Z");

  it("passes when date is in the past", () => {
    const result = runBeforeRules(
      schema,
      "expense",
      "create",
      { date: "2026-03-10", amount: 50, category: "food" },
      now
    );
    expect(result.passed).toBe(true);
  });

  it("passes when date is today", () => {
    const result = runBeforeRules(
      schema,
      "expense",
      "create",
      { date: "2026-03-15", amount: 50, category: "food" },
      now
    );
    expect(result.passed).toBe(true);
  });

  it("rejects when date is in the future", () => {
    const result = runBeforeRules(
      schema,
      "expense",
      "create",
      { date: "2026-03-20", amount: 50, category: "food" },
      now
    );
    expect(result.passed).toBe(false);
    expect(result.error?.error).toBe("rule_violation");
    expect(result.error?.rule).toBe("no_future_dates");
    expect(result.error?.message).toContain("future");
  });

  it("rejects future date on update too", () => {
    const result = runBeforeRules(
      schema,
      "expense",
      "update",
      { date: "2027-01-01" },
      now
    );
    expect(result.passed).toBe(false);
    expect(result.error?.rule).toBe("no_future_dates");
  });

  it("does not run rules on read operations", () => {
    const result = runBeforeRules(
      schema,
      "expense",
      "read",
      { date: "2099-12-31" },
      now
    );
    expect(result.passed).toBe(true);
  });
});
