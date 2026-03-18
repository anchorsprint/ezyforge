# EzyForge — Product North Star

## The Mission

Make business software that AI agents can operate safely — owned by you, defined by you, enforced at the data layer.

## The Belief

Business rules must live in the data layer, not in prompts — because prompts are suggestions and the data layer is law.

Data belongs to the owner, not the vendor. Your schema is a file. Your database is a file. You can move, copy, version, and share them without permission from anyone.

AI replaces UI, not logic. You still need deterministic business rules — you just don't need a fancy dashboard to enforce them.

## The Promise

Define your schema once. Your AI can never break your data, your data never leaves your control, and you never need a vendor's permission to run your business.

## The Core Insight

Every guardrail product today tries to constrain AI *output* — validating the JSON shape, filtering toxic content, catching prompt injections. But the real damage happens at the *data layer*, after the output looks fine. An expense with a hallucinated date passes every output validator and silently corrupts your reports. The insight competitors miss: **the enforcement point must be the database write, not the model response.** When you generate AI tools directly from a permission-aware schema, dangerous operations don't just fail — they don't exist. An AI that has no delete tool cannot be prompt-injected into deleting. The attack surface isn't mitigated; it's eliminated.

The second insight: **the SaaS era assumed humans operate software through UIs. The AI era means agents operate software through tools.** When the operator is an AI, you don't need Salesforce's dashboard — you need Salesforce's business logic in a file you own, with an AI that can execute it safely. The entire business software stack is ripe for replacement by something simpler, cheaper, and AI-native.

## The North Star Metric

**Percentage of AI-to-database writes that pass through EzyForge-enforced schemas.** This measures adoption depth, not vanity. When developers route all their agent writes through EzyForge, they trust it — and that trust is the product.

## What We Build For (Priority Order)

1. **Determinism over flexibility.** Every rule produces the same result every time, regardless of which AI model calls it. No probabilistic enforcement.
2. **Developer trust over developer speed.** We will never trade safety for convenience. If a shortcut weakens enforcement, we don't ship it.
3. **Elimination over mitigation.** Remove dangerous capabilities from the tool surface rather than catching bad actions after the fact.
4. **Ownership over convenience.** Your schema is a file. Your database is a file. You never need permission from a vendor to access, move, or modify your own business data.

## What We Never Build

1. **An AI model or AI wrapper.** EzyForge is the boundary between AI and data. We never become the AI itself — that creates the conflict of interest we exist to solve.
2. **A general-purpose database.** We enforce rules on writes and generate tools. Storage is pluggable. The moment we compete with Supabase or PlanetScale, we've lost focus.
3. **Prompt-based guardrails.** We will never ship a feature that depends on an LLM following instructions to enforce safety. If it can be bypassed by a creative prompt, it doesn't belong in EzyForge.
4. **A SaaS platform that locks in your data.** If we can't export everything in one command, we've failed. The moment your data requires our platform to be useful, we've become the problem we set out to solve.

## The Product in One Demo

**The Developer Demo.** The developer opens `expenses.schema.yaml` — 25 lines defining an expense entity with amount, currency, category, date, and notes. Under `ai_permissions`: create is true, delete is false, update is restricted to notes and category only. One rule: `date <= today()`. They run `forge serve`. Terminal shows: 4 tools generated (create, read, list, update) — no delete tool. They point Claude at the MCP server. "Log lunch at McDonald's, RM 15, yesterday." It works. "Now delete that expense." Claude says it can't — it has no delete tool. "Change the amount to 0." Rejected — amount is not in `allowed_fields`. "Log a meal for next Friday." Rejected — rule engine blocks future dates. The wow moment: the AI isn't being told "no" by a prompt. The dangerous operations *literally do not exist in its toolset.*

**The Business Owner Demo.** Raj runs `forge init my-crm --template crm`, runs `forge serve`, connects his WhatsApp AI. A customer messages asking about their order. The AI checks the schema, finds the order, responds with the status. Raj updates a supplier contact by telling the AI "change Acme's phone number to 03-1234." It updates the allowed field. Raj never opened a dashboard. His data lives in a SQLite file on his machine. He pays $0/month in software subscriptions.

## How We Know We're Winning

1. **Developers stop writing custom validation middleware for AI agents** — they point to their EzyForge schema file instead of showing you 200 lines of hand-rolled permission checking code.
2. **Schema files appear in open-source repos alongside README.md** — the format becomes a convention for describing what AI can and can't do with your data.
3. **A developer who has never used EzyForge reads a schema file and understands it in 30 seconds** — the format is so intuitive that it becomes documentation, not just configuration.
4. **A business owner tells us they cancelled their Salesforce subscription** — because forge + AI does the job for the cost of a database file and an API key.
