/**
 * Sandboxed expression assessment engine.
 *
 * Supports:
 *   - Comparisons: >, <, >=, <=, ==, !=
 *   - Boolean: AND, OR, NOT
 *   - Functions: today(), now(), som() (start of month)
 *   - Null checks: is null, is not null
 *   - Field references from input data
 *   - String/number/boolean literals
 *
 * Uses recursive descent parsing — NO dynamic code execution.
 */

// ─── Token Types ─────────────────────────────────────────────────────────────

type TokenType =
  | "NUMBER"
  | "STRING"
  | "BOOLEAN"
  | "NULL"
  | "IDENTIFIER"
  | "OPERATOR"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "AND"
  | "OR"
  | "NOT"
  | "IS"
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
}

// ─── AST Node Types ──────────────────────────────────────────────────────────

type ASTNode =
  | { type: "literal"; value: unknown }
  | { type: "identifier"; name: string }
  | { type: "comparison"; op: string; left: ASTNode; right: ASTNode }
  | { type: "logical"; op: "AND" | "OR"; left: ASTNode; right: ASTNode }
  | { type: "not"; operand: ASTNode }
  | { type: "is_null"; operand: ASTNode; negated: boolean }
  | { type: "function_call"; name: string; args: ASTNode[] };

// ─── Tokenizer ───────────────────────────────────────────────────────────────

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    // Skip whitespace
    if (/\s/.test(expr[i])) {
      i++;
      continue;
    }

    // String literals
    if (expr[i] === '"' || expr[i] === "'") {
      const quote = expr[i];
      i++;
      let str = "";
      while (i < expr.length && expr[i] !== quote) {
        str += expr[i];
        i++;
      }
      if (i >= expr.length)
        throw new Error("Unterminated string literal");
      i++; // skip closing quote
      tokens.push({ type: "STRING", value: str });
      continue;
    }

    // Numbers
    if (/\d/.test(expr[i]) || (expr[i] === "-" && i + 1 < expr.length && /\d/.test(expr[i + 1]))) {
      let num = "";
      if (expr[i] === "-") {
        num += "-";
        i++;
      }
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: num });
      continue;
    }

    // Operators
    if (expr[i] === ">" || expr[i] === "<" || expr[i] === "!" || expr[i] === "=") {
      let op = expr[i];
      i++;
      if (i < expr.length && expr[i] === "=") {
        op += "=";
        i++;
      }
      // == is equality, = alone is also equality
      if (op === "=") op = "==";
      tokens.push({ type: "OPERATOR", value: op });
      continue;
    }

    // Parentheses
    if (expr[i] === "(") {
      tokens.push({ type: "LPAREN", value: "(" });
      i++;
      continue;
    }
    if (expr[i] === ")") {
      tokens.push({ type: "RPAREN", value: ")" });
      i++;
      continue;
    }

    // Comma
    if (expr[i] === ",") {
      tokens.push({ type: "COMMA", value: "," });
      i++;
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(expr[i])) {
      let id = "";
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        id += expr[i];
        i++;
      }
      const lower = id.toLowerCase();

      if (lower === "and") tokens.push({ type: "AND", value: "AND" });
      else if (lower === "or") tokens.push({ type: "OR", value: "OR" });
      else if (lower === "not") tokens.push({ type: "NOT", value: "NOT" });
      else if (lower === "is") tokens.push({ type: "IS", value: "IS" });
      else if (lower === "null") tokens.push({ type: "NULL", value: "null" });
      else if (lower === "true")
        tokens.push({ type: "BOOLEAN", value: "true" });
      else if (lower === "false")
        tokens.push({ type: "BOOLEAN", value: "false" });
      else tokens.push({ type: "IDENTIFIER", value: id });
      continue;
    }

    throw new Error(
      `Unexpected character "${expr[i]}" at position ${i} in expression: ${expr}`
    );
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

// ─── Parser (Recursive Descent) ─────────────────────────────────────────────

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const t = this.tokens[this.pos];
    this.pos++;
    return t;
  }

  private expect(type: TokenType): Token {
    const t = this.peek();
    if (t.type !== type) {
      throw new Error(`Expected ${type} but got ${t.type} ("${t.value}")`);
    }
    return this.advance();
  }

  parse(): ASTNode {
    const node = this.parseOr();
    if (this.peek().type !== "EOF") {
      throw new Error(
        `Unexpected token "${this.peek().value}" after expression`
      );
    }
    return node;
  }

  private parseOr(): ASTNode {
    let left = this.parseAnd();
    while (this.peek().type === "OR") {
      this.advance();
      const right = this.parseAnd();
      left = { type: "logical", op: "OR", left, right };
    }
    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseNot();
    while (this.peek().type === "AND") {
      this.advance();
      const right = this.parseNot();
      left = { type: "logical", op: "AND", left, right };
    }
    return left;
  }

  private parseNot(): ASTNode {
    if (this.peek().type === "NOT") {
      this.advance();
      const operand = this.parseNot();
      return { type: "not", operand };
    }
    return this.parseComparison();
  }

  private parseComparison(): ASTNode {
    const left = this.parsePrimary();

    // Handle "is null" / "is not null"
    if (this.peek().type === "IS") {
      this.advance();
      let negated = false;
      if (this.peek().type === "NOT") {
        this.advance();
        negated = true;
      }
      this.expect("NULL");
      return { type: "is_null", operand: left, negated };
    }

    // Handle comparison operators
    if (this.peek().type === "OPERATOR") {
      const op = this.advance().value;
      const right = this.parsePrimary();
      return { type: "comparison", op, left, right };
    }

    return left;
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();

    // Parenthesized expression
    if (token.type === "LPAREN") {
      this.advance();
      const node = this.parseOr();
      this.expect("RPAREN");
      return node;
    }

    // Literals
    if (token.type === "NUMBER") {
      this.advance();
      return { type: "literal", value: parseFloat(token.value) };
    }
    if (token.type === "STRING") {
      this.advance();
      return { type: "literal", value: token.value };
    }
    if (token.type === "BOOLEAN") {
      this.advance();
      return { type: "literal", value: token.value === "true" };
    }
    if (token.type === "NULL") {
      this.advance();
      return { type: "literal", value: null };
    }

    // Identifier or function call
    if (token.type === "IDENTIFIER") {
      this.advance();
      // Check if it's a function call
      if (this.peek().type === "LPAREN") {
        this.advance(); // consume (
        const args: ASTNode[] = [];
        if (this.peek().type !== "RPAREN") {
          args.push(this.parseOr());
          while (this.peek().type === "COMMA") {
            this.advance();
            args.push(this.parseOr());
          }
        }
        this.expect("RPAREN");
        return { type: "function_call", name: token.value, args };
      }
      return { type: "identifier", name: token.value };
    }

    throw new Error(
      `Unexpected token "${token.value}" (${token.type})`
    );
  }
}

// ─── Tree Walker ─────────────────────────────────────────────────────────────

export type AssessmentContext = Record<string, unknown>;

/** Built-in functions available in expressions */
function callBuiltinFunction(
  name: string,
  _args: unknown[],
  now: Date
): unknown {
  switch (name.toLowerCase()) {
    case "today": {
      // Returns YYYY-MM-DD string for date comparison
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    case "now":
      return now.toISOString();
    case "som": {
      // Start of month
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}-01`;
    }
    default:
      throw new Error(`Unknown function: ${name}()`);
  }
}

function walk(node: ASTNode, ctx: AssessmentContext, now: Date): unknown {
  switch (node.type) {
    case "literal":
      return node.value;

    case "identifier":
      return ctx[node.name] ?? null;

    case "function_call": {
      const args = node.args.map((a) => walk(a, ctx, now));
      return callBuiltinFunction(node.name, args, now);
    }

    case "comparison": {
      const left = walk(node.left, ctx, now);
      const right = walk(node.right, ctx, now);
      return compare(node.op, left, right);
    }

    case "logical": {
      const left = walk(node.left, ctx, now);
      const right = walk(node.right, ctx, now);
      if (node.op === "AND") return toBool(left) && toBool(right);
      return toBool(left) || toBool(right);
    }

    case "not":
      return !toBool(walk(node.operand, ctx, now));

    case "is_null": {
      const val = walk(node.operand, ctx, now);
      const isNull = val === null || val === undefined;
      return node.negated ? !isNull : isNull;
    }
  }
}

function toBool(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") return val.length > 0;
  return true;
}

function compare(op: string, left: unknown, right: unknown): boolean {
  // Null comparisons
  if (left === null || left === undefined || right === null || right === undefined) {
    if (op === "==" || op === "=") return left == right;
    if (op === "!=") return left != right;
    return false; // null is not >, <, >=, <= anything
  }

  // Numeric comparison
  if (typeof left === "number" && typeof right === "number") {
    return numCompare(op, left, right);
  }

  // String comparison (includes dates as YYYY-MM-DD strings)
  const l = String(left);
  const r = String(right);

  switch (op) {
    case "==":
    case "=":
      return l === r;
    case "!=":
      return l !== r;
    case ">":
      return l > r;
    case "<":
      return l < r;
    case ">=":
      return l >= r;
    case "<=":
      return l <= r;
    default:
      throw new Error(`Unknown operator: ${op}`);
  }
}

function numCompare(op: string, l: number, r: number): boolean {
  switch (op) {
    case "==":
    case "=":
      return l === r;
    case "!=":
      return l !== r;
    case ">":
      return l > r;
    case "<":
      return l < r;
    case ">=":
      return l >= r;
    case "<=":
      return l <= r;
    default:
      throw new Error(`Unknown operator: ${op}`);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Assess an expression string against a context object.
 * Returns the result (usually a boolean for rule conditions).
 *
 * @param expression - The expression string (e.g., "date > today()")
 * @param context - Input data fields (e.g., { date: "2026-03-20", amount: 100 })
 * @param now - Optional override for current time (for testing)
 */
export function assessExpression(
  expression: string,
  context: AssessmentContext = {},
  now: Date = new Date()
): unknown {
  const tokens = tokenize(expression);
  const parser = new Parser(tokens);
  const ast = parser.parse();
  return walk(ast, context, now);
}
