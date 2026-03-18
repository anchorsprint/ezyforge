# EzyForge — Problem Statement

## The Problem in One Sentence

AI agents that write to databases cannot be trusted to follow business rules, respect field boundaries, or maintain consistent schemas — and no product exists to enforce these constraints deterministically.

---

## Who Has This Problem

### 1. Marcus — The Solo Builder

**Archetype:** Technical indie hacker building AI-powered personal tools.

**What he's building:** A personal expense tracker where his AI assistant (via Telegram) logs expenses by parsing natural language messages like "Grabbed lunch at McDonald's, RM 15."

**When the pain hits:** Three weeks in, Marcus asks the AI to "improve the categorization." The AI decides to add a `food_type` column, renames `amount` to `cost`, and creates a duplicate `expenses_v2` table. His monthly reports break. He spends an evening restoring from a backup he almost forgot to make.

**What he does today:** Manually backs up the SQLite database before every AI session that touches schema. Describes the schema in the system prompt. Hopes the AI follows it.

**What it costs him:** 30 minutes per session on backup management. Lost trust in his own tool. Considered going back to a spreadsheet.

### 2. Ava — The Startup CTO

**Archetype:** CTO of a 4-person AI-first startup shipping a customer-facing product.

**What she's building:** An AI-powered booking system for a chain of clinics. AI handles rescheduling, cancellations, and availability checks via WhatsApp.

**When the pain hits:** A model update causes the AI to start writing `appointment_date` as `appt_date`. Downstream analytics and billing integrations break silently. The team only notices when a client complains about being double-charged. Root cause investigation takes two days.

**What she does today:** Pydantic models for output validation, a custom middleware layer for write filtering, manual testing after every model update. Three separate codebases that must stay in sync.

**What it costs her:** Two engineers spending 40% of their time on guardrail infrastructure instead of product features. A data quality incident that cost a client relationship.

### 3. Dan — The Enterprise AI Lead

**Archetype:** Engineering lead deploying agentic workflows at a mid-size financial services company.

**What he's building:** An AI agent that processes expense reports — validates receipts, categorizes spending, flags policy violations, and routes for approval.

**When the pain hits:** During a security review, the team discovers the AI agent has write access to the entire database via MCP. It could theoretically modify approved amounts, delete audit trails, or create phantom expenses. The compliance team shuts the project down until guardrails are in place. There is no off-the-shelf solution.

**What he does today:** Read-only database replica for AI access (killing 80% of the use case). A custom permission layer that took 6 weeks to build for one app. Cannot reuse it for the next project.

**What it costs him:** $150K+ in engineering time per AI project for custom guardrails. A 3-month delay on the expense agent launch. Growing skepticism from leadership about AI ROI.

---

## The Core Pain Points

### 1. Schema Drift

**What happens:** The AI invents new field names, changes column types, or creates duplicate tables across sessions. The database gradually becomes inconsistent.

**Concrete example:** An AI agent uses `expense_amount` in session one, `cost` in session two, and `price` in session three. The SQLite database accumulates three columns that should be one. Reports break, aggregations return wrong numbers.

**Why existing tools don't solve it:** Prisma and Zod enforce schema at the application layer but can't prevent an AI with database access from creating new columns. Supabase MCP gives AI root access that bypasses all constraints.

### 2. Business Rule Bypass

**What happens:** AI ignores domain-specific constraints — future dates on past transactions, negative quantities, amounts exceeding policy limits — because rules live in prompts, not in the data layer.

**Concrete example:** AI records an expense dated 2027-01-01 because it hallucinated the year. The prompt said "use today's date" but the model made an error. No data-layer validation caught it. The monthly report now shows a $45 lunch appearing in next year's totals.

**Why existing tools don't solve it:** Guardrails AI and Instructor validate LLM *output format*, not *data-layer business logic*. OpenAI Structured Outputs guarantee JSON shape but can't enforce "date must not be in the future."

### 3. Permission Overreach

**What happens:** AI agents get all-or-nothing database access. Either they can do everything (dangerous) or they're locked out entirely (defeats the purpose).

**Concrete example:** An AI assistant asked to "fix the typo in the notes field" runs `UPDATE expenses SET notes = 'Fixed' WHERE id = 5` — and could just as easily run `DELETE FROM expenses` or `UPDATE expenses SET amount = 0`. Nothing enforces "AI can edit notes but not amounts."

**Why existing tools don't solve it:** Supabase RLS provides row-level security but not field-level AI restrictions. Service role keys bypass all RLS. No product offers "AI can update fields X and Y but not Z" as a declarative constraint.

### 4. No Schema Governance

**What happens:** AI modifies the schema (adds fields, changes types) without owner knowledge or approval. Undocumented changes accumulate until something breaks.

**Concrete example:** AI decides a `tax_rate` column would be helpful and adds it. Then adds `is_reimbursable`. Then renames `category` to `expense_type`. The owner opens the database a week later and doesn't recognize their own schema.

**Why existing tools don't solve it:** No product provides schema locking with owner-controlled unlock. OASF handles version freezing for agent definitions, not business data schemas.

### 5. Custom Guardrails Don't Scale

**What happens:** Every team that hits these problems builds a one-off solution — custom middleware, validation layers, permission checks — that works for one app but can't be reused.

**Concrete example:** Ava's team spent 6 weeks building a permission layer for the booking app. When they start the invoicing project, they need the same pattern but different rules. They rebuild from scratch because the first implementation was hard-coded to booking entities.

**Why existing tools don't solve it:** GoRules provides a reusable rules engine but has no schema registry, no AI permissions, no tool generation. Each piece of the solution exists in isolation. Nobody ships the integrated product.

---

## What "Solved" Looks Like

A developer defines their business schema once in a YAML file — entities, fields, types, validation rules, and what the AI can and can't do. They run one command and get a running server with auto-generated tools that any AI agent can call. The AI creates records, queries data, and updates permitted fields — all within deterministic guardrails that cannot be bypassed, drifted, or hallucinated around. The developer sleeps soundly knowing that no matter what the AI tries, the data layer enforces the rules. When they need to change the schema, they unlock it, make the change, and lock it again. The AI never touches the schema definition. Business logic is deterministic. Data is trustworthy.

---

## Why Now

Three forces converged in 2025-2026 to make this problem urgent:

1. **AI agents went from demo to production.** MCP adoption exploded. OpenAI, Anthropic, Google, and Microsoft all ship tool-calling protocols. Agents now routinely *write* to databases, not just *read* from them. The attack surface grew from "AI says wrong things" to "AI does wrong things to your data."

2. **The failures went public.** Replit's AI agent wiped a production database (July 2025, covered by Fortune). McKinsey's chatbot was hacked for full database access (March 2026). Gartner predicted 40% of agentic AI projects will be cancelled by 2027 due to "inadequate risk controls." The industry now knows this problem is real.

3. **The pattern emerged but the product didn't.** Multiple independent sources — CockroachDB, Authority Partners, Composio, Dextra Labs — all converged on "bounded autonomy" as the architecture pattern. Field-level permissions, schema locking, deterministic rules. Everyone describes the same solution. Nobody ships it as a product.

The $52B agentic AI market (projected by 2030) is bottlenecked on governance. EzyForge is the governance layer.
