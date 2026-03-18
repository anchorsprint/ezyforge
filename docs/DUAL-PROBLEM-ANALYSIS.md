# EzyForge — Dual Problem Analysis

**Date:** 2026-03-18
**Analyst:** Product Strategy Review
**Input:** All 10 project documents + founder interview transcript

---

## Executive Summary

The current documentation captures Problem 1 (AI-safe data layer) thoroughly and almost completely ignores Problem 2 (SaaS replacement for the AI era). Jazz's original insight in Q8 of the founder interview contained both problems fused together, but the refinement process stripped out the SaaS replacement angle and kept only the developer tooling angle. This was a significant loss. The two problems are not two products — they are two layers of the same product, and the missing layer is the one with the bigger market.

---

## 1. Evidence Audit

### Problem 1: "AI agents corrupt business data because nothing enforces rules at the data layer"

| Document | Evidence | Supports/Contradicts |
|----------|----------|---------------------|
| PROBLEM.md | Entire document is about this. Marcus and Ava personas. "90% of organizations run MCP servers with excessive default permissions." | **Strongly supports** |
| NORTH-STAR.md | Mission: "Make AI agents trustworthy operators of business data." Core insight about enforcement at database write, not model response. | **Strongly supports** |
| ARCHITECTURE.md | Full 9-component system designed around permission → validation → rules → DB pipeline. | **Strongly supports** |
| FEATURES.md | Every P1 feature is about schema enforcement, rule engines, and AI permissions. | **Strongly supports** |
| DISCOVERY.md | Assumption mapping, competitive landscape, 130+ social validation findings — all about AI data corruption. | **Strongly supports** |
| RESEARCH.md | 20+ tools analyzed across 5 categories. Gap analysis focuses on "schema-as-law for AI agents." | **Strongly supports** |
| SOCIAL-VALIDATION.md | 15+ production database destruction incidents documented. Replit, Claude Code, Cursor, Amazon Kiro. | **Strongly supports** |
| VALIDATION.md | Scores the product 5.7/10 — recognizes the problem but questions execution. | **Supports (with caveats)** |
| CLAUDE.md | "Schema is Law. AI is Operator. Owner is Governor." All build instructions are about enforcement. | **Strongly supports** |
| README.md | "AI agents that write to databases drift, invent field names, ignore business rules." | **Strongly supports** |

**Verdict: Problem 1 is comprehensively documented.** 10/10 documents address it directly. The evidence base is deep — industry incidents, competitive gaps, social validation, architecture design. This is well-covered.

---

### Problem 2: "Traditional SaaS is expensive, over-complicated, vendor lock-in, data not owned, and not designed for LLM integration"

| Document | Evidence | Supports/Contradicts |
|----------|----------|---------------------|
| PROBLEM.md | Zero mention of SaaS replacement, vendor lock-in, data ownership, or cost. | **Not addressed** |
| NORTH-STAR.md | Zero mention. Mission is about AI trust, not SaaS replacement. | **Not addressed** |
| ARCHITECTURE.md | Mentions "portable" and "pluggable storage" but frames it as technical design, not as a SaaS alternative. | **Tangentially supports** |
| FEATURES.md | Templates (CRM, booking, inventory) in P3 hint at SaaS replacement but aren't framed that way. "Out of scope: Web UI / visual schema editor" actively contradicts making this a SaaS alternative. | **Weakly supports / partially contradicts** |
| DISCOVERY.md | **Q8 answer contains the core insight.** Workaround #4: "Use traditional SaaS (Airtable, Notion) — Expensive, not LLM-native, no data ownership, vendor lock-in." Jazz's final answer: "looking for business domain agnostic, portable." But the refinement process turned this into a developer tool framing, not a SaaS replacement framing. | **Contains the seed, but didn't develop it** |
| RESEARCH.md | Category D analysis (Airtable, Retool, Glide, Notion) documents that these platforms are "API-limited, no true schema enforcement for AI, no programmability, can't be embedded in agentic systems." But frames the gap as "can't work with AI" rather than "should be replaced by something simpler." | **Indirectly supports** |
| SOCIAL-VALIDATION.md | Focused entirely on AI data destruction. No evidence gathered about SaaS frustration or replacement desire. | **Not addressed** |
| VALIDATION.md | Notes the product tries to serve "solo devs AND enterprise simultaneously" but doesn't identify the SaaS replacement angle. | **Not addressed** |
| CLAUDE.md | Zero mention of SaaS replacement. | **Not addressed** |
| README.md | Zero mention. Positioned purely as a developer tool. | **Not addressed** |

**Verdict: Problem 2 is almost entirely missing from the documentation.** It exists only as fragments:
- Jazz's Q8 answer (verbatim in DISCOVERY.md but not developed)
- Workaround #4 in DISCOVERY.md (listed but not elevated)
- Category D competitive analysis in RESEARCH.md (observed but not synthesized)
- P3 templates in FEATURES.md (planned but not connected to a problem statement)

---

## 2. Key Questions Answered

### Does the current documentation address both problems, or only one?

**Only one.** The documentation is 95% about Problem 1 (AI-safe data layer). Problem 2 (SaaS replacement) appears as scattered fragments that were never synthesized into a coherent narrative. The founder interview captured both, but the refinement process kept only the developer-tooling angle.

### Which problem has stronger evidence from the research?

**Problem 1 has stronger *gathered* evidence** — because that's what was researched. 130+ social validation findings, 15+ production incidents, competitive analysis of 20+ tools, all focused on AI data corruption.

But this is a research bias, not a market signal. The research was designed to validate Problem 1 and never asked about Problem 2. Nobody searched for "developers replacing Salesforce with YAML schemas" or "AI-native business app alternatives" or "SaaS vendor lock-in frustration."

**Problem 2 likely has a bigger total addressable market.** The global SaaS market is $300B+. Every business using Salesforce, Airtable, SAP, or Notion is a potential buyer for "own your data, define your logic, let AI operate it." But this was never validated because it was never investigated.

### Are they the same product or two products?

**They are the same product at different zoom levels.**

- **Problem 1 (zoom in):** "How do I make AI safe to write to my database?" → Developer tool. Schema enforcement. Permission layer. The *engine*.
- **Problem 2 (zoom out):** "How do I replace expensive SaaS with something AI-native that I own?" → Business platform. Templates. Data ownership. The *product*.

The relationship:

```
Problem 2 (SaaS replacement) REQUIRES Problem 1 (AI-safe data layer)
Problem 1 (AI-safe data layer) ENABLES Problem 2 (SaaS replacement)
```

You can't replace Salesforce with an AI-operated schema unless the AI can be trusted not to corrupt the data. Problem 1 is the foundation. Problem 2 is the building.

The current docs describe the foundation in extreme detail and never mention what the building looks like.

### What is the unified problem statement?

> **Business software is trapped in the pre-AI era — expensive, locked-in, and impossible for AI agents to operate safely. EzyForge lets you define your business logic in a schema file, own your data in your own database, and let AI agents operate within enforced boundaries. Replace your $500/month SaaS with a YAML file, a SQLite database, and an AI that can never break your rules.**

This captures both:
- The WHY (traditional SaaS is broken for the AI era)
- The HOW (schema-first enforcement makes AI safe)
- The WHAT (you own the schema, the data, and the rules)

---

## 3. Was Jazz's Original Insight Lost?

**Yes. Substantially.**

Here is what Jazz said in Q8:

> "Not sure about others, but think we need new way to describe business logic — no longer need fancy UI, traditional SaaS is expensive and not properly integrated to LLM, lots of companies do not own their data, high vendor lock-in"

This single answer contains FIVE distinct insights:

| # | Insight | Captured in Docs? | Where |
|---|---------|-------------------|-------|
| 1 | "We need a new way to describe business logic" | **Yes** | NORTH-STAR.md core insight, ARCHITECTURE.md schema design |
| 2 | "We no longer need fancy UI" | **No** | Never mentioned. Docs say "Web UI is out of scope" (FEATURES.md) but don't explain WHY — which is that AI replaces the need for UI |
| 3 | "Traditional SaaS is expensive" | **No** | Only appears as workaround #4 in DISCOVERY.md. Never elevated to a problem statement. |
| 4 | "Lots of companies do not own their data" | **Barely** | ARCHITECTURE.md mentions "SQLite file-based, portable" and "pluggable storage" but never frames data ownership as a problem being solved |
| 5 | "High vendor lock-in" | **No** | Never mentioned as a problem. Portability is discussed as a technical feature, not as a solution to lock-in |

And from the follow-up ("Would you use it?"):

> "Yes — looking for business domain agnostic, portable"

| # | Insight | Captured? | Where |
|---|---------|-----------|-------|
| 6 | "Business domain agnostic" | **Partially** | Templates in P3 hint at this, but the expenses-only dogfood test in P1 doesn't demonstrate domain-agnosticism |
| 7 | "Portable" | **Partially** | JSON Schema + YAML is portable technically, but the docs don't articulate portability as a USER value (switching away from SaaS) |

**Score: 2 of 7 insights fully captured. 2 partially captured. 3 lost entirely.**

The refinement process took Jazz's vision of "a new way to build business apps for the AI era" and narrowed it to "a safety layer between AI and databases." That's a valid product, but it's a much smaller ambition than what Jazz actually described.

---

## 4. Recommendation

### Should PROBLEM.md be rewritten?

**Yes.** The current PROBLEM.md is excellent for Problem 1 but completely silent on Problem 2. It should be restructured to present the FULL problem:

**Structure:**
1. **The Surface Problem** (what developers feel today): AI agents corrupt business data. Schema drift, rule bypass, no permissions. → This is the current PROBLEM.md, mostly keep it.
2. **The Deeper Problem** (why this matters beyond developers): Traditional business software was never designed for AI. It's expensive ($500/mo for CRM), locked-in (can't export your data), and impossible for AI agents to integrate with safely. The SaaS model assumes humans operate the software through a UI. In the AI era, agents operate the software through tools. The entire stack needs rethinking.
3. **The Connection**: You can't let AI replace your SaaS unless the AI can be trusted with your data. Schema enforcement is the prerequisite for AI-native business apps.

The Marcus persona stays. Ava stays. But add a third persona who isn't a developer — a **business owner** who's paying $500/mo for Salesforce and wants to own their data while letting AI handle operations.

### Should NORTH-STAR.md be updated?

**Yes.** The current mission — "Make AI agents trustworthy operators of business data" — is Problem 1 only. It should expand:

**Current:** Make AI agents trustworthy operators of business data.
**Proposed:** Make business software that AI agents can operate safely — owned by you, defined by you, enforced by the data layer.

The beliefs and principles mostly hold. But add:
- **Data belongs to the owner, not the vendor.** Your schema is a file. Your database is a file. You can move, copy, version, and share them without permission from anyone.
- **AI replaces UI, not logic.** You no longer need a fancy dashboard to manage expenses or contacts. You need a schema that defines the rules, and an AI that operates within them.

### What is the unified positioning?

**One product. Two entry points. Same architecture.**

```
                    EzyForge
                       |
          ┌────────────┼────────────┐
          │                         │
    Entry Point 1             Entry Point 2
    "AI-Safe Data Layer"      "AI-Native Business Apps"
    (Developer tool)          (SaaS replacement)
          │                         │
    npm install ezyforge      forge init my-crm
    Define schema                --template crm
    Embed in your app         forge serve
    AI writes safely          Connect AI, done
          │                         │
          └────────────┬────────────┘
                       │
              Same engine underneath:
              Schema → Permissions → Rules → DB
```

**Entry Point 1** (Problem 1) is the **developer SDK** — what the current docs describe. This is the right MVP because it validates the core engine.

**Entry Point 2** (Problem 2) is the **business app runtime** — what Jazz's Q8 insight described. This comes after the engine works, and it's where the big market is.

The mistake in the current docs isn't building Entry Point 1 first — that's correct. The mistake is **not knowing Entry Point 2 exists**, which means:
- The schema format isn't being designed with multi-domain business apps in mind
- Templates are relegated to P3 instead of being a core differentiator
- Data ownership and portability aren't articulated as values
- The "why" behind the product is too narrow (AI safety) instead of the full picture (AI-native business infrastructure)

---

## 5. What Should Change (Concrete)

### Immediate (before writing code)

1. **Rewrite PROBLEM.md** to include both problems as described above. Keep everything that's there (it's excellent), but add the SaaS replacement angle as "The Deeper Problem."

2. **Update NORTH-STAR.md** mission statement to cover both problems. Add the data ownership and "AI replaces UI" beliefs.

3. **Add a persona** in PROBLEM.md: a non-developer business owner or operator who currently uses Salesforce/Airtable and wants something AI-native and self-owned.

4. **Reframe templates** from "nice-to-have in P3" to "the primary distribution mechanism." The expenses template is the dogfood test, but CRM / booking / inventory templates are how EzyForge becomes a SaaS replacement. Move at least ONE additional template to P2.

5. **Conduct research for Problem 2.** The social validation research never looked for evidence of SaaS replacement desire. Search for: "replacing Salesforce with AI," "self-hosted CRM alternatives," "Airtable vendor lock-in," "data ownership business apps." The evidence almost certainly exists and would strengthen the positioning.

### During MVP (doesn't change what you build, changes how you talk about it)

6. **README.md** should mention both use cases: "Use EzyForge as a library to make your AI agent's data writes safe, OR use it as a runtime to build entire business apps that AI agents operate."

7. **The dogfood test** stays as expenses (Problem 1 validation). But add a second validation milestone: "Jazz replaces his Airtable/spreadsheet with a forge schema + AI" (Problem 2 validation).

### After MVP

8. **Templates become the product.** `forge init --template crm` is not a convenience feature — it's the answer to "why would I stop paying for Salesforce?" This should be a primary roadmap item, not P3 backlog.

9. **Community schema registry.** If every business domain gets a template, EzyForge becomes a marketplace of AI-native business apps. This is the network effect and the moat that VALIDATION.md correctly identified as missing.

---

## 6. The Honest Assessment

The current docs built a tight, well-researched case for a developer tool. That case is strong. But Jazz's original insight was bigger than a developer tool — it was about a fundamental shift in how business software should work when AI is the operator instead of a human.

The refinement process did what refinement processes often do: it made the problem more precise by making it smaller. "AI corrupts business data" is crisp and validatable. "Traditional SaaS is broken for the AI era" is ambitious and harder to validate. The team chose the one they could prove.

That was the right tactical decision for the current stage. But it should be a conscious narrowing with a plan to expand, not an accidental loss of the founder's vision.

**The bottom line:** Jazz described a platform that replaces how businesses run their operations. The docs describe a library that validates AI database writes. Both are correct. The library is the right thing to build first. But the platform is the right thing to *aim* for — and right now, the docs don't even know it's the destination.

---

*Analysis conducted: 2026-03-18*
*Documents reviewed: 10 (NORTH-STAR.md, PROBLEM.md, ARCHITECTURE.md, FEATURES.md, DISCOVERY.md, RESEARCH.md, SOCIAL-VALIDATION.md, VALIDATION.md, CLAUDE.md, README.md)*
