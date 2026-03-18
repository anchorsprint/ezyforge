# EzyForge — Product Validation

**Date:** 2026-03-18
**Evaluator:** Senior Product Advisor (brutally honest mode)
**Inputs:** README.md, PROBLEM.md, ARCHITECTURE.md, FEATURES.md, DISCOVERY.md, RESEARCH.md, RESEARCH-VALIDATION.md, PROTOCOL-RESEARCH.md

---

## Verdict: Validate More

The problem is real. The gap is real. But the product as designed has a dangerous mismatch between ambition and starting position. Jazz is building a governance layer for a market that doesn't know it needs governance yet. The docs are thorough — suspiciously thorough for a product with zero lines of code. Ship the prototype before writing another research document.

---

## Scorecard

| Dimension | Score | Key Finding |
|---|---|---|
| Problem Clarity | 8/10 | Real, well-articulated, validated by industry incidents. Slightly too broad — tries to serve solo devs AND enterprise simultaneously. |
| Solution Fit | 6/10 | Schema-as-law is the right concept but YAML-first authoring is a bet against where the market is moving (AI-generated everything). The FEEL expression engine is a significant hidden complexity bomb. |
| Market Timing | 7/10 | Good window — post-Replit-incident, pre-platform-incumbents-solving-it. But the window is 12-18 months, not infinite. |
| Technical Feasibility | 5/10 | The architecture diagram is clean. The reality of building a safe expression evaluator, a schema compiler, AND an MCP server as a solo dev in 2 weeks is fantasy. |
| Go-To-Market | 4/10 | "50 GitHub stars in week one" is not a GTM strategy. No content plan, no community seeding, no partnership angle. The dogfood milestone is good but insufficient. |
| Competitive Moat | 3/10 | Custom JSON Schema vocabularies are not defensible. Supabase could add `x-ai-permissions` to their MCP server in a sprint. The moat must come from ecosystem/templates/community, which doesn't exist yet. |
| Founder-Market Fit | 7/10 | Jazz has the pain, the technical chops, and a real use case. But he's a CTO of a small company, not a dev-tools GTM operator. The missing piece is distribution, not engineering. |

**Weighted Total: 5.7/10** — Promising problem, under-validated solution.

---

## What's Strong (Top 3)

### 1. The Problem Documentation Is Genuinely Excellent
PROBLEM.md is one of the best problem statements I've seen from a pre-revenue product. The three personas (Marcus, Ava, Dan) are specific, the pain points are concrete, and the "why existing tools don't solve it" analysis for each pain point shows real understanding. A developer WOULD read this and say "that's me." The Replit incident, Gartner prediction, and Supabase warning are strong market evidence — not manufactured.

### 2. The "Schema is Law" Concept is Architecturally Sound
The core insight — that rules must live in the data layer, not in prompts — is correct and defensible. The permission-shapes-tools design (no delete permission = no delete tool generated) is elegant. The belt-and-suspenders approach (tool generation filters + runtime permission layer) shows security thinking. This is the right abstraction level.

### 3. The Protocol Research Was Rigorous
PROTOCOL-RESEARCH.md analyzed 30+ standards before choosing JSON Schema + custom vocabularies. This is the right call. Building on JSON Schema means not asking developers to learn a new format, and `$vocabulary` is a blessed extension mechanism. The decision to use YAML for authoring and compile to JSON Schema at runtime is pragmatic. Most products skip this research and regret it.

---

## What's Weak (Top 3)

### 1. The Scope Is 3x Too Large for a Solo Dev
The P1 feature list includes: a YAML parser, a JSON Schema compiler with custom vocabularies, a FEEL-inspired expression evaluator (sandboxed), an MCP server, a REST API, a CLI with 6 commands, a permission enforcement layer, a rule engine with before/after hooks, a SQLite adapter with auto-migration, TypeScript type generation, and a template system. That's not 2 weeks of work. That's 2-3 months for an experienced developer. The docs acknowledge "2 weeks solo" for P1 — this is either naive or performative. Shipping a broken MVP in 2 weeks is worse than shipping a tiny working slice in 2 weeks.

**What it should be:** Week 1 = YAML parser + permission enforcer + MCP tool generator. Nothing else. No REST API, no CLI, no type generation, no templates. Prove the core loop (schema → permissions → tools → enforcement) works with hardcoded SQLite. Everything else is Phase 2.

### 2. No User Validation Beyond Jazz Himself
The discovery document says Frankie, Alex, and Nicholas "have the same pain" — but this is Jazz's answer about his team, not their direct input. There are zero user interviews with anyone outside anchor Sprint. The market research validates that the *problem category* is real (schema drift, AI data corruption) but NOT that THIS SPECIFIC SOLUTION (YAML schema files, `forge` CLI) is what developers want. The recommended "cheapest test" (social media post) was never executed. The "5 developers test the prototype" step was never done. All validation is desk research, not user research.

### 3. The Revenue Model Is Absent
Nowhere in 8 documents does it say who pays, how much, and for what. "Open source core, paid features" is hand-waved in DISCOVERY.md but never specified. The docs say "willingness to pay is unknown" and then move on. This matters because:
- If nobody pays, this is a hobby project, not a product.
- If the paying customer is "enterprise AI lead Dan," the product needs auth, audit trails, and SSO from day one — none of which are in P1.
- If the paying customer is "solo dev Marcus," the TAM is tiny and the willingness to pay is near zero.
- GoRules (the closest comp) monetizes with enterprise tiers — but GoRules has been building for years with a team.

---

## The 3 Biggest Risks

### Risk #1: Supabase Ships AI Permissions Before You Ship Anything (Severity: Existential)
Supabase has 80k+ GitHub stars, a massive developer base, and they already have RLS + MCP. They currently warn against production MCP use — but they're not going to leave that gap forever. If Supabase adds field-level AI permissions and a schema lock toggle to their MCP server (which is an incremental feature, not a new product), EzyForge's entire value proposition evaporates. Supabase could do this in one quarter. Jazz has no code shipped.

**Mitigation:** Ship the core loop (schema → permissions → tools) in 2 weeks and get it into developers' hands. Speed is the only defense against platform incumbents.

### Risk #2: The FEEL Expression Evaluator Becomes a Black Hole (Severity: High)
Building a sandboxed expression language is a deceptively hard problem. It looks simple ("just parse `date <= today()`") until you hit: operator precedence, type coercion, null handling, date arithmetic, string functions, nested field access, error messages that make sense, and — critically — security (no code injection). The docs say "FEEL-inspired" but don't specify which FEEL features are in scope. Full FEEL has 200+ built-in functions. Even a minimal subset needs careful specification and exhaustive testing. This is the kind of component that takes 2 weeks to get 80% working and 2 months to get production-safe.

**Mitigation:** Ship MVP with a fixed set of 5-10 comparison operators and zero functions beyond `today()`. No `contains()`, no `IN`, no arithmetic. Add functions one at a time based on actual user needs.

### Risk #3: Developers Won't Write YAML Schema Files (Severity: High)
The entire product assumes developers will invest upfront effort defining entities, fields, rules, and permissions in YAML before they can use the tool. This is the Prisma bet — and Prisma succeeded. But Prisma had a massive DX investment (studio, auto-completion, migration tooling) and was replacing a worse experience (raw SQL migrations). EzyForge is asking developers to write YAML that replaces... nothing. Today, most agentic app builders just give the AI database access and deal with the consequences. The switching cost from "no schema management" to "write a YAML file" is higher than it looks, especially when the immediate benefit (AI can't corrupt data) isn't felt until something goes wrong.

**Mitigation:** Ship `forge init --from-db` that introspects an existing SQLite/Postgres database and generates the YAML schema automatically. Make the onboarding path "point at your existing database" not "write a schema from scratch." Also: invest heavily in AI-assisted schema creation (the anti-pattern the docs explicitly reject). Let AI help write the schema, then lock it.

---

## What's Missing from the Docs

### 1. Failure Modes and Error Recovery
What happens when a rule engine bug causes valid data to be rejected? What happens when the schema file has a typo and the MCP server starts returning errors? What's the recovery path when a locked schema needs an emergency fix? The architecture assumes the schema is always correct. Real systems have bugs in their rules.

### 2. Multi-User / Multi-Agent Scenarios
The docs assume one AI agent, one schema, one database. What happens when two AI agents call the MCP server simultaneously? What about an AI agent AND a human using the REST API at the same time? Transaction isolation is mentioned but concurrency is not designed.

### 3. Migration Story
"Schema versioning and migrations" is listed as P2, but this is the single hardest adoption barrier for any schema tool. If I define a schema today and need to add a field next week, what happens to existing data? If I'm using EzyForge in production and need to change an enum's allowed values, how? This needs at least a design sketch in P1, not a hand-wave to P2.

### 4. Observability / Debugging
When an AI tool call is rejected by a business rule, how does the developer debug it? Is there a log? A dashboard? A way to replay the failed operation? The docs describe structured error responses but nothing about operational visibility.

### 5. Competitive Response Analysis
What does Supabase, Prisma, or LangChain need to build to kill this? The competitive analysis only looks at today's landscape. There's no analysis of how these companies might respond if EzyForge gains traction.

---

## Recommended Changes

### 1. Cut the MVP Scope by 60%
Ship: YAML parser → permission enforcer → MCP tool generator → SQLite writes. That's it. No REST API, no CLI beyond `forge serve`, no TypeScript generation, no templates, no schema compiler to JSON Schema. Prove the core loop in 1 week, not the full product in 2.

### 2. Do 3 Real User Interviews Before Writing Code
Talk to 3 developers who are NOT on the anchor Sprint team and who are actively building agentic apps. Show them the YAML schema format. Ask: "Would you write this? What would make you not write this? What would make you switch from your current approach?" If 2/3 say "I'd try it," build. If they say "I'd rather just use Supabase RLS," pivot.

### 3. Make AI-Assisted Schema Creation a P1 Feature, Not an Anti-Pattern
The docs explicitly say "AI-generated schema suggestions" is out of scope because "the AI is the operator, not the architect." This is philosophically clean but commercially suicidal. The biggest adoption unlock is: `forge init --describe "personal expense tracker with MYR/SGD/USD, no future dates, AI can't delete"` → AI generates the YAML schema → developer reviews and locks it. AI writes the schema ONCE, then the schema constrains the AI forever. This is the wedge. Without it, you're asking developers to learn a new YAML format for a problem they solve with vibes today.

### 4. Define the Paying Customer Before Building
Pick ONE: solo developer Marcus, startup CTO Ava, or enterprise lead Dan. Build for that person specifically. The current product tries to serve all three and will satisfy none. My recommendation: build for Marcus (solo dev with personal tools) to prove the product, then level up to Ava (startup CTO) for revenue. Dan (enterprise) is 2+ years away and requires a different company.

### 5. Build Distribution Into the Product
The product has no viral loop, no sharing mechanism, no community hook. Add: `forge export --share` that generates a shareable schema URL. Add a public schema registry where developers can publish and discover templates. Make the schema files the distribution mechanism — every published schema is a landing page for EzyForge.

---

## Final Honest Opinion

EzyForge identifies a real, growing, validated problem — AI agents corrupting business data — and proposes a sound architectural solution. The "schema is law" concept is correct. The JSON Schema extension approach is smart. The competitive gap is genuine today. But today's gap is tomorrow's feature update from Supabase or Prisma.

The fatal flaw is not the idea — it's the execution plan. Jazz is trying to build a 9-component system as a solo developer in 2 weeks, with zero user validation outside his own team, no revenue model, and no distribution strategy. The research is thorough to the point of being a procrastination mechanism — 8 documents, 30+ standards analyzed, 28 web searches, zero lines of product code.

Would I build this? I'd build a MUCH smaller version of it. I'd ship a 500-line TypeScript library that parses a YAML file, generates MCP tools with permission filtering, and enforces field-level access on writes to SQLite. I'd test it with 5 real developers in the first week. I'd add `forge init --describe` (AI-generated schemas) immediately. And I'd have a clear answer to "who pays for this and why" before building anything beyond the prototype.

The problem is worth solving. The product as scoped will never ship. Cut ruthlessly, ship fast, talk to users.

---

*Evaluation conducted: 2026-03-18*
*Documents reviewed: 8 (README.md, PROBLEM.md, ARCHITECTURE.md, FEATURES.md, DISCOVERY.md, RESEARCH.md, RESEARCH-VALIDATION.md, PROTOCOL-RESEARCH.md)*
*Total content reviewed: ~150 pages of product documentation*
