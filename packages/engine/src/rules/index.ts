import type {
  ParsedSchema,
  CrudOperation,
  StructuredError,
} from "../types.js";
import { assessExpression, type AssessmentContext } from "./evaluator.js";

export interface RuleCheckResult {
  passed: boolean;
  error?: StructuredError;
}

/**
 * Run all before-rules that match the given entity and operation.
 * Returns the first violation found, or { passed: true } if all pass.
 *
 * Rules with action: "reject" block the operation when their condition is true.
 * (i.e., condition = "date > today()" → if true, the date IS in the future → reject)
 */
export function runBeforeRules(
  schema: ParsedSchema,
  entityName: string,
  operation: CrudOperation,
  input: Record<string, unknown>,
  now?: Date
): RuleCheckResult {
  const matchingRules = schema.rules.filter(
    (r) => r.entity === entityName && r.when.includes(operation)
  );

  for (const rule of matchingRules) {
    const context: AssessmentContext = { ...input };
    const result = assessExpression(rule.condition, context, now);

    if (result === true) {
      // Condition matched → reject
      return {
        passed: false,
        error: {
          error: "rule_violation",
          rule: rule.name,
          message: rule.message,
        },
      };
    }
  }

  return { passed: true };
}

export { assessExpression } from "./evaluator.js";
