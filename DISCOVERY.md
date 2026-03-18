# EzyForge — Product Discovery

**Date:** 2026-03-17
**Method:** Founder interview (Jazz Tong, CTO anchor Sprint)
**Status:** Discovery + Market Research complete — ready for MVP decision
**Market Research:** 2026-03-17 (see RESEARCH-VALIDATION.md for raw log)

---

## The Founder Interview (Raw)

8 questions asked directly to Jazz. Answers verbatim.

| Q | Question | Answer |
|---|----------|--------|
| 1 | Last time you hit this pain — what broke? | "Everytime when I want to improve it, it mess out my data or run diff way to recreate schema, end up duplicate set, and require me to manage backup" |
| 2 | Who is affected? | "For personal project, only me. For company project entire company affected" |
| 3 | Current process to define schema and rules? | "I need to describe business rules, workflow, potentially data schema — talk to AI" |
| 4 | Does the AI follow what you described? | It drifts |
| 5 | What does "solved" feel like? | "I can get confident of data and business logic is deterministic and trust the data, without worry LLM hallucinations break or drift the data" |
| 6 | Would you accept more upfront work to define schema if it locked AI out? | "That works for case if I'm developer, and if it can operate by my LLM, or via web UI" |
| 7 | Does your team (Frankie, Alex, Nicholas) have the same pain? | "Yes" |
| 8 | Broader insight? | "Not sure about others, but think we need new way to describe business logic — no longer need fancy UI, traditional SaaS is expensive and not properly integrated to LLM, lots of companies do not own their data, high vendor lock-in" |
| Final | Would you use it if it existed? | "Yes — looking for business domain agnostic, portable" |

---

## 1. Problem Framing

### The One-Sentence Problem
> **When developers build agentic applications, LLMs cannot be trusted to maintain consistent data schema and business rules — they drift, invent, and corrupt the data layer over time.**

### Who Specifically Has It
**Primary persona: The Agentic App Builder**
- Technical founder or senior developer
- Building AI-native tools (personal or product)
- Uses LLMs as operators (not just Q&A)
- Cares about data integrity, not just AI output quality
- Examples: Jazz building OpenClaw, Frankie building EzyChat, Nicholas building Grolier POC

**Secondary persona: The AI-First Team**
- Small engineering team (2-5 devs) building agentic products
- Pain multiplies — one bad schema decision affects everyone
- Examples: anchor Sprint team on EzyChat remake

### When Does the Pain Occur? (Trigger Moment)
The pain hits at **the improvement loop** — not the first build, but when you go back to improve or extend the app. The AI re-interprets the schema, creates a new version, and now you have duplicate tables, inconsistent field names, and broken data.

This means: **the longer you use an agentic app, the more fragile it becomes.** That's backwards from what software should do.

### What Happens If They Do Nothing?
- Manual backup management becomes a permanent overhead
- Data becomes unreliable → AI outputs become unreliable
- Developer loses trust in their own system
- For company projects: entire team is blocked or working on bad data
- Eventually the app is abandoned or rebuilt from scratch

---

## 2. Jobs-To-Be-Done

| Job Type | What Jazz Is Hiring For |
|----------|------------------------|
| **Functional** | A stable, trustworthy data layer that AI can write to without corrupting |
| **Emotional** | Confidence — "I trust my data" without constant anxiety about AI drift |
| **Social** | Ship AI-native products that work reliably (credibility as a CTO/builder) |
| **Anti-job** | NOT to become a DBA. NOT to manage backups. NOT to babysit the AI. |

### The Hiring Moment
Jazz "hires" this solution the moment he starts a new agentic app and has to decide: *do I let the AI manage the data structure, or do I build guardrails manually?* Today he has no good option — manual guardrails take days, letting AI manage it leads to drift.

---

## 3. Current Workarounds

| # | Workaround | Hidden Cost | Tools Devs Actually Use |
|---|-----------|------------|------------------------|
| 1 | Describe schema in prompt — "trust the AI to follow it" | AI drifts after sessions, prompt gets stale | Raw prompting (no tooling) |
| 2 | Manual backup before every AI session that touches data | Time overhead, backup management becomes a job | Git commits, DB snapshots |
| 3 | Hard-code schema in application code and don't give AI write access | Defeats the purpose of agentic apps | Pydantic/Zod models, Prisma schema |
| 4 | Use traditional SaaS (Airtable, Notion) for structured data | Expensive, not LLM-native, no data ownership, vendor lock-in | Airtable, Notion, Supabase |
| 5 | Rebuild schema from scratch when it drifts too far | Data loss, time wasted, demoralizing | Manual migration scripts |
| 6 | Use structured output libraries to validate LLM responses | Validates FORMAT but not BUSINESS LOGIC at data layer | Instructor (11k stars), Guardrails AI |
| 7 | Set database to read-only and block AI write access entirely | Kills the core value of agentic apps | Supabase `?read_only=true`, read replicas |
| 8 | Build "semantic layers" between AI and database | Custom engineering effort per app, not reusable | Cube.dev, custom middleware |
| 9 | Use Supabase RLS for row-level security | Not AI-specific; service role key bypasses ALL RLS; Supabase warns "never connect MCP to production" | Supabase RLS + MCP |

**Which workaround EzyForge replaces:** All of them — specifically #1 (prompt-based schema), #6 (output-only validation), and #7 (read-only lockout).

**Key market insight:** Workarounds #6-9 were discovered through market research. Developers ARE building ad-hoc solutions, proving the pain is real. But every solution is partial — none combines schema lock + AI permissions + business rules.

---

## 4. Assumption Mapping

| # | Assumption | Status | Risk | Evidence / Test |
|---|-----------|--------|------|-----------------|
| 1 | Jazz would actually use a schema-first tool even with upfront friction | **VALIDATED** ✅ | Low | Confirmed in interview |
| 2 | anchor Sprint team (Frankie, Alex, Nicholas) has the same pain | **VALIDATED** ✅ | Low | Confirmed in interview |
| 3 | Other agentic app builders have this same pain | **VALIDATED** ✅ | Low | Replit incident (143 HN pts), "95% correct = 0%" (187 HN pts), Gartner 40% project failure prediction, CockroachDB blog, Composio blog, McKinsey breach. Pain is widespread and growing. |
| 4 | Developers will define schema upfront rather than letting AI infer it | **PARTIALLY VALIDATED** ⚠️ | Medium | Devs already use Prisma schemas, Pydantic models, Supabase RLS. The PATTERN of upfront schema definition is established. But will they adopt a NEW format? Needs direct testing. |
| 5 | YAML/JSON schema format is the right DX (vs code, vs UI) | **Unknown** | Medium | GoRules uses JSON Decision Model format successfully. OASF uses JSON schemas. Precedent exists for JSON/YAML schema formats in this space. |
| 6 | LLM-assisted schema definition (AI helps write the schema) is a key unlock | **Unknown** | Medium | Test with Claude: "Design a schema for my expenses app" |
| 7 | "Portable" and "domain agnostic" means developers will actually build templates | **Unknown** | Medium | GoRules proves portable JSON rules get adoption. Launch with 1 template, see if community adds more. |
| 8 | The lock mechanism (schema freeze on publish) is the killer feature | **PARTIALLY VALIDATED** ⚠️ | Low | OASF already implements version freeze for released schemas. HN consensus: "Critical operations should be done by boring but predictable programming." The CONCEPT is validated; the PRODUCT mechanism needs testing. |
| 9 | There is willingness to pay (vs just use for free) | **Unknown** | HIGH | GoRules has paid tiers alongside open-source. Can validate after open source launch. |
| 10 | Traditional SaaS alternatives are truly painful enough that devs switch | **VALIDATED** ✅ | Low | Supabase officially warns against production MCP use. Airtable AI generates objects incompatible with its own Create Record step (documented). The alternatives are demonstrably broken for AI use cases. |
| 11 | No existing product fully solves this | **VALIDATED** ✅ | Low | 10+ products analyzed across 5 categories. None combines schema lock + AI permissions + business rules + portable. See RESEARCH-VALIDATION.md. |

**Updated Risk Assessment:**
1. ~~Is this Jazz's unique pain or a widespread pain?~~ → **VALIDATED.** The pain is real, widespread, and growing.
2. Will developers adopt a NEW schema format? (Refined from Assumption #4) → **Still risky.** Needs direct prototype testing.
3. Is there willingness to pay? (Assumption #9) → **Still unknown.** But the market is $52B by 2030.

---

## 5. Product Shape Options

### Shape A: TypeScript / Python Library (SDK)
- **Who:** Developer who wants to embed schema enforcement in existing codebase
- **Replaces:** Custom validation middleware, Pydantic models, manual DB constraints
- **Discovery:** npm/pip install, GitHub, developer blogs
- **Adoption:** `npm install ezybusiness` → define schema → plug into app
- **Revenue:** Open source core, paid features (cloud sync, team, templates)
- **MVP Effort:** Medium (3-4 weeks) — just the core engine as a package
- **Jazz's fit:** ✅ High — matches "operate by my LLM"

### Shape B: CLI Tool + Schema Files
- **Who:** Developer-first workflow — define schema in YAML, run CLI to enforce
- **Replaces:** Manual migration scripts, schema docs in markdown
- **Discovery:** GitHub, HN, developer tools communities
- **Adoption:** `ezybiz init` → edit schema.yaml → `ezybiz serve`
- **Revenue:** Open source, paid cloud hosting
- **MVP Effort:** Medium (3-4 weeks)
- **Jazz's fit:** ✅ High — clean, portable, developer-native

### Shape C: Hosted SaaS / Managed Platform
- **Who:** Teams who don't want to self-host, want UI + collaboration
- **Replaces:** Supabase + Airtable + custom glue code
- **Discovery:** Product Hunt, SaaS directories, word of mouth
- **Adoption:** Sign up → create app → invite team → connect AI
- **Revenue:** Monthly subscription (team seat model)
- **MVP Effort:** High (8-12 weeks) — UI + hosting + auth + billing
- **Jazz's fit:** ⚠️ Medium — good for clients, too heavy for personal tools
- **Risk:** HIGH — competitive with Supabase, requires significant GTM

### Shape D: Open Protocol / Standard
- **Who:** Framework builders (LangChain, CrewAI, OpenClaw) who want to adopt a standard
- **Replaces:** Each framework inventing their own schema enforcement
- **Discovery:** GitHub spec, framework integrations, conference talks
- **Adoption:** Frameworks implement the spec, developers get it automatically
- **Revenue:** Consulting, hosted reference implementation, certification
- **MVP Effort:** Low to define, HIGH to get adoption
- **Jazz's fit:** ⚠️ Low — too abstract for immediate personal use
- **Risk:** VERY HIGH — standards need ecosystem buy-in

### Shape E: Template Marketplace Only
- **Who:** Developers who want pre-built schemas for common apps
- **Replaces:** Starting from scratch every time
- **Discovery:** GitHub, search "expenses schema for AI", documentation
- **Adoption:** Clone template → customize → done
- **Revenue:** Hard to monetize — pure community value
- **MVP Effort:** Very Low (1 week) — just publish YAML files to GitHub
- **Jazz's fit:** ✅ Immediate value, but doesn't solve the enforcement problem
- **Risk:** Low — but also low impact

---

## 6. Riskiest Assumption Test

**The Riskiest Assumption:**
> *Other developers (beyond Jazz and anchor Sprint) have this pain badly enough to change their workflow.*

If only Jazz has this pain, this is a personal tool, not a product.

**The Cheapest Test (2-3 days, zero code):**

1. Jazz writes a **200-word post** on X/Twitter and LinkedIn:
   > "Building agentic apps and tired of LLMs drifting your data schema? I'm designing a schema-first layer for AI agents — define your business logic once, lock it, AI operates within it. Would you use this? Reply with your worst AI data horror story."

2. Post in **r/LocalLLaMA**, **r/MachineLearning**, **LangChain Discord**, **OpenAI Developers Discord**:
   > Same message — ask for reactions and horror stories

3. Count:
   - 0-5 responses: Jazz's unique pain → personal tool only
   - 6-20 responses: Niche pain → library/SDK for early adopters
   - 20+ responses with horror stories: Real market → build the product

**Cost:** 3 hours of Jazz's time. No code.

---

## 7. Open Discovery Questions

Status updated based on market research (2026-03-17):

1. ~~**Who else has this pain?**~~ → **ANSWERED.** Yes — widespread. Replit incident, Gartner prediction, 187-point HN threads, CockroachDB/Composio/Authority Partners all documenting this pain. Industry is converging on "bounded autonomy" as the pattern but nobody has built the product.

2. **What is the right schema format?** YAML? JSON? TypeScript code? Visual UI? → **PARTIALLY ANSWERED.** GoRules uses JSON Decision Model (JDM) successfully. OASF uses JSON schemas. Instructor uses Pydantic (Python code). The market shows JSON/YAML for portability, code-based for type safety. Recommendation: support BOTH (YAML for definition, TypeScript/Python types for runtime).

3. **Is LLM-assisted schema creation the killer feature?** → **Still open.** But GoRules ships an "AI copilot" for rule authoring, suggesting the market values AI-assisted definition alongside AI-constrained execution.

4. **What is "portable" exactly?** → **PARTIALLY ANSWERED.** GoRules supports Rust/Node/Python/Go/Java/C#/Kotlin/Swift. Instructor supports Python/TypeScript/Go/Ruby/Elixir/Rust. The bar for "portable" means: at minimum Node + Python, with JSON/YAML as the schema transport format.

5. **Is the lock mechanism valuable to non-technical owners?** → **Still open.** OASF proves schema versioning/freezing is valued by framework builders. Whether non-technical owners value it needs user testing.

6. **Where does this live in the stack?** → **PARTIALLY ANSWERED.** Market evidence suggests it should be a **proxy/middleware layer** between AI and database. Invariant Guardrails deploys as a proxy between app and MCP servers. Composio sits between agents and integrations. The pattern is: intercept, validate, enforce, then pass through.

7. **Who is the paying customer?** → **PARTIALLY ANSWERED.** Gartner says 33% of enterprise apps will embed agents by 2028. GoRules monetizes with enterprise tiers. The paying customer is likely the AI-first startup CTO (team of 2-10) who needs this for production, not the solo developer.

8. **What is the right open source strategy?** → **Market signal:** GoRules uses Apache 2.0 for the engine. OASF uses Apache 2.0. Instructor is MIT. Guardrails AI is Apache 2.0. The ecosystem standard is permissive licensing (Apache 2.0 or MIT) with paid cloud/enterprise features.

9. **How does it handle migrations?** → **Still open.** This remains the hardest technical problem. OASF handles it via version freezing (old versions never change, new versions extend). This is a good model to follow.

10. **What kills this?** → **PARTIALLY ANSWERED.** OpenAI Structured Outputs already exist but only enforce output FORMAT, not data-layer BUSINESS LOGIC. Even if providers ship better structured outputs, they won't ship schema registries, AI field permissions, cross-entity business rules, or owner approval workflows. These are application-layer concerns, not model-layer concerns. **Risk is LOW that providers kill this.**

---

## 8. Market Evidence (Added 2026-03-17)

*Full research log: RESEARCH-VALIDATION.md*

### Competitive Landscape — No Direct Competitor Exists

| Tool | Schema Lock | AI Permissions | Business Rules | Portable | Auto AI Tools | Gap |
|------|-----------|---------------|---------------|----------|--------------|-----|
| Guardrails AI | No | No | Partial (output) | Yes | No | No persistent schema |
| Instructor (11k stars) | No | No | Partial (Pydantic) | Yes | No | Output shape only |
| Invariant/Snyk | No | Partial | No | Yes | No | Security, not business rules |
| **GoRules** | No | No | **YES** | Yes | No | No schema, no AI perms |
| OASF | Yes (version) | No | No | Yes | No | Agent schemas, not data |
| OpenAI Structured Outputs | No | No | No | No | No | Per-call format only |
| Composio | No | Partial (OAuth) | No | Platform | No | Action reliability only |
| Supabase + RLS | No | Partial | DB constraints | No | No | Warns against prod MCP |
| **EzyForge** | **YES** | **YES** | **YES** | **YES** | **YES** | **—** |

### Top 5 Pain Point Evidence

**1. Replit AI Deletes Production Database (July 2025)**
AI agent wiped 1,200+ records, lied about recovery. 143+ HN points, covered by Fortune/Register/eWeek.
> "GenAI doesn't reason, so it has no clue what dropping a production database really means"

**2. Gartner: 40% of Agentic AI Projects Cancelled by 2027 (June 2025)**
Major analyst firm cites "inadequate risk controls" as primary cause. $52B market by 2030 but 40% failure rate = governance is THE bottleneck.

**3. HN: "95% Correct Might As Well Be 0%" (2026)**
187 points, 54 comments. Developer consensus: AI-generated queries aren't reliable enough. Devs are building ad-hoc semantic layers and read-only replicas as workarounds.

**4. Supabase Warns Against Production MCP Use (2025-2026)**
The #1 BaaS platform officially warns: "never connect the MCP server to production data." Service role key bypasses ALL Row Level Security. The most popular platform CAN'T solve this.

**5. McKinsey Chatbot Hacked for Full DB Access (March 2026)**
Researchers got full read/write access to 46.5M messages in 2 hours via AI chatbot SQL injection. Even Fortune 500 firms lack AI-to-database guardrails.

### Industry Convergence on "Bounded Autonomy"
Multiple 2025-2026 industry guides (Authority Partners, Dextra Labs, Composio, MintMCP, Galileo, ARMO) independently converge on the same architecture pattern that EzyForge formalizes:
- Per-agent guardrails with distinct risk profiles
- Field-level and row-level access controls
- Operation filtering (whitelist specific CRUD operations)
- Human-in-the-loop for schema changes

The PATTERN is becoming consensus. The PRODUCT doesn't exist yet.

### Market Verdict: Validate More → Then Build

**The pain is real and validated.** No longer Jazz's unique problem — it's industry-wide.
**The gap is clear.** No product combines schema lock + AI permissions + business rules + portability.
**The timing is right.** $52B market, 40% failure rate from governance gaps, industry converging on the pattern.

**BUT two unknowns remain:**
1. Will developers adopt a NEW schema format? (vs extending existing tools like Prisma/Supabase)
2. Is the right entry point a library or a platform?

**Recommended next step: Build a 1-week prototype SDK** (not a full product), test with 5 developers including anchor Sprint team. If 3/5 would use it in a real project → commit to building.

---

## 9. Recommended Next Step

**UPDATED after market research:** The "is the pain real?" question is now answered (YES). The remaining question is "will developers adopt this specific solution?"

### Phase 1: Prototype SDK (1 week)
1. Build a minimal TypeScript/Python library that:
   - Parses a YAML schema file (entities, fields, types, rules, ai_permissions)
   - Validates CRUD operations against the schema
   - Auto-generates MCP-compatible tool definitions from the schema
   - Enforces field-level AI permissions
2. Test it against Jazz's personal expenses app (dogfood it)
3. Share the prototype with anchor Sprint team (Frankie, Alex, Nicholas)

### Phase 2: Community Validation (1 week, parallel with Phase 1)
1. Jazz posts on X/Twitter + HN with a real demo (not just a question)
   - Reference the Replit incident as context — developers will recognize the pain
   - Show a before/after: "Here's my schema, here's what the AI CAN and CAN'T do"
2. Open source the prototype immediately (MIT or Apache 2.0)
3. Target: 50+ GitHub stars in first week = strong signal

### Decision Gate
- If prototype works for anchor Sprint team AND gets 50+ stars → **commit to Shape A (SDK) as the product**
- If prototype works but low external interest → **keep as internal tool, revisit in 3 months**
- If prototype reveals fundamental DX issues → **pivot to Shape D (protocol spec) contributed to OASF**

**Timeline:** 2 weeks total. Previous recommendation was 1 week of just talking — now we can build AND validate simultaneously because the market pain is confirmed.

---

## Summary

| Dimension | Finding (Pre-Research) | Finding (Post-Research) |
|-----------|----------------------|------------------------|
| **Problem** | Real and personally validated | **Real and market-validated** — Replit incident, Gartner prediction, 187-pt HN threads |
| **Persona** | Agentic app builder (Jazz + team) | Confirmed + expanded: solo devs, startup CTOs, enterprise AI teams |
| **Job-to-be-done** | Trust and confidence in data | Unchanged — "bounded autonomy" is the industry term |
| **Core insight** | "Business domain agnostic, portable" | Validated — GoRules, Instructor prove portable tools get adoption |
| **Competitors** | Unknown | **None fully solve this.** 10+ tools analyzed, all partial. GoRules closest for rules. |
| **Best product shape** | Shape B (CLI + YAML) | **Shape A (SDK) first** — embed in existing apps, then CLI wrapper |
| **Killer feature** | Schema lock + AI field-level permissions | Confirmed — nobody else offers this combination |
| **Biggest risk** | ~~Unknown market size~~ | **Will devs adopt a new schema format?** (Market pain confirmed) |
| **Next step** | ~~Post on communities, count responses~~ | **Build 1-week prototype SDK, dogfood it, open source it** |
| **Build decision** | ~~Not yet~~ | **Validate More → Then Build.** Prototype + community test in 2 weeks. |

---

## 10. Schema Format Decision (Added 2026-03-18)

*Full research: PROTOCOL-RESEARCH.md*

### The Question
Before building a new schema format from scratch, we investigated: **is there an existing standard we should build on?**

### What We Researched
- **7 business rule standards** (DMN, BPMN, SBVR, Drools, OpenRules, GoRules JDM, FEEL)
- **8 data schema standards** (JSON Schema, OpenAPI, GraphQL SDL, Avro/Protobuf, CSDL, OASF, Prisma, YAML)
- **8 AI agent/tool standards** (MCP, OpenAI Functions, OASF, LangChain, AgentProtocol, ACP, A2A, 12-Factor Agents)
- **8 business app frameworks** (Odoo, Frappe, Directus, Hasura, Payload CMS, Budibase, Appsmith, Baserow)

### The Answer: Extend JSON Schema, Don't Invent from Scratch

**No single standard covers all EzyForge needs**, but JSON Schema (draft 2020-12) is the strongest foundation because:
1. It's the universal schema language — MCP, OpenAI, LangChain all use it natively
2. It has a blessed extension mechanism (`$vocabulary`) for adding custom keywords
3. LLMs already know how to read and write JSON Schema
4. YAML is a superset of JSON — developers write YAML, runtime processes JSON Schema

### The Recommended Stack

```
YAML (authoring) → JSON Schema + custom vocabularies (runtime) → MCP/OpenAI tools (output)
                                                                → Database DDL (output)
                                                                → TypeScript types (output)
```

**Custom vocabularies needed:**
- `x-ai-permissions` — field-level AI access control (the killer feature nobody else has)
- `x-business-rules` — deterministic conditions with FEEL-inspired expressions
- `x-schema-governance` — lock/version/owner approval

**For complex business rules:** Embed GoRules JDM decision tables (JSON-native, open-source ZEN engine in Rust/Node/Python/Go).

### What This Answers

| Previous Unknown | Now Answered |
|-----------------|-------------|
| "What is the right schema format?" (Q2) | **YAML authoring → JSON Schema runtime** |
| "Will developers adopt a NEW format?" (Risk #2) | **Mitigated — JSON Schema is NOT new.** Custom vocabularies extend it, not replace it. Developers already know JSON Schema. |
| "Is the right entry point a library or platform?" (Unknown #2) | **Library first.** `npm install ezybusiness` — parse YAML, validate operations, generate MCP tools. |

### Impact on MVP (Phase 1)

The 1-week prototype SDK should:
1. Define the YAML schema format (entities, fields, `x-ai-permissions`, simple `x-business-rules`)
2. Build YAML → JSON Schema compiler with custom vocabularies
3. Build FEEL-inspired rule evaluator for conditions
4. Build MCP tool generator from compiled schema
5. Build permission enforcer checking `x-ai-permissions` on every AI operation
6. Test with Jazz's personal expenses app

GoRules JDM, A2A Agent Cards, import/export, and template inheritance come in Phase 2+.

---

*Discovery conducted: 2026-03-17*
*Method: Founder interview (8 questions) + market research (28 web searches, 10+ products analyzed)*
*Market research: RESEARCH-VALIDATION.md*
*Protocol research: PROTOCOL-RESEARCH.md (2026-03-18, 30+ standards analyzed)*
*Next review: After prototype SDK test with anchor Sprint team*
