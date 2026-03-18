# EzyBusiness Protocol Research — Schema Format Decision

**Date:** 2026-03-18
**Author:** Jazz Tong (CTO, Anchor Sprint) + AI Research
**Status:** Research Complete — Ready for Decision
**Purpose:** Determine whether EzyBusiness should build on an existing standard or invent a new schema format

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Task 1: Business Rules & Decision Standards](#2-task-1-business-rules--decision-standards)
3. [Task 2: Data Schema Standards](#3-task-2-data-schema-standards)
4. [Task 3: AI Agent & Tool Standards](#4-task-3-ai-agent--tool-standards)
5. [Task 4: Business Application Frameworks](#5-task-4-business-application-frameworks)
6. [Task 5: Hybrid Recommendation](#6-task-5-hybrid-recommendation)
7. [Task 6: Decision Matrix](#7-task-6-decision-matrix)
8. [Final Recommendation](#8-final-recommendation)
9. [Sources](#9-sources)

---

## 1. Executive Summary

**Question:** Should EzyBusiness build on an existing protocol/standard, or invent a new schema format?

**Answer:** Neither pure adoption nor pure invention. **Extend JSON Schema (draft 2020-12) with custom vocabularies** for business rules, AI permissions, and schema governance. Use YAML as the authoring format (human-friendly), compile to JSON Schema at runtime (machine-friendly). Generate MCP tools and OpenAI function definitions as output targets.

**Why this approach wins:**
- JSON Schema is the universal foundation — MCP, OpenAI, LangChain, and OpenAPI all use it
- Custom vocabularies (`x-ai-permissions`, `x-business-rules`) are a blessed extension mechanism, not a hack
- YAML authoring gives developer-friendly DX while maintaining full JSON Schema compatibility
- No new standard to evangelize — developers already know JSON Schema
- GoRules JDM's decision table concepts can be embedded within the schema for complex business rules
- Frappe's "JSON files as schema + migration" pattern proves this architecture works at scale

**The stack:**
```
YAML (authoring) → JSON Schema + custom vocabularies (runtime) → MCP/OpenAI tools (output)
                                                                → Database DDL (output)
                                                                → TypeScript types (output)
                                                                → A2A Agent Cards (output)
```

---

## 2. Task 1: Business Rules & Decision Standards

### 2.1 DMN (Decision Model and Notation)

**What it is:** OMG standard (v1.6) for modeling business decisions using decision tables, decision requirement diagrams, and the FEEL expression language.

**Who uses it:** Capital One, Camunda, Red Hat, Trisotech, Oracle. Widely adopted in banking, insurance, and regulated industries.

**LLM-friendly?** Partially. Native format is XML (verbose, error-prone for LLMs). Alternative representations exist — Markdown tables (dmnmd), JSON via REST APIs. The decision table *concept* is highly LLM-friendly; the serialization is not.

**EzyBusiness fit:** The decision table paradigm (inputs → conditions → outputs) is excellent for business rules. But raw DMN XML is too heavyweight. **Borrow the concept, not the format.**

| Pros | Cons |
|------|------|
| Industry standard with wide tooling | Native XML format — verbose, not LLM-friendly |
| Decision tables are intuitive | Full spec is overly complex (DRDs, knowledge models) |
| Well-defined, unambiguous semantics | Enterprise-heavy tooling, not startup-friendly |
| Three conformance levels for incremental adoption | Requires FEEL knowledge for expressions |

### 2.2 BPMN (Business Process Model and Notation)

**What it is:** OMG standard for modeling business workflows as flowcharts with events, gateways, tasks, and sequence flows.

**Who uses it:** Camunda, SAP, IBM, Oracle, Flowable, Bonitasoft. Universal in enterprise process automation.

**LLM-friendly?** Improving. Research (2025) shows JSON-based BPMN representations achieve 2x faster processing and 2.6x smaller tokens vs XML. But LLMs still produce modeling errors in complex flows.

**EzyBusiness fit:** No — BPMN models *workflows/processes*, not *business rules or decisions*. Wrong abstraction layer. EzyBusiness could use BPMN-like concepts for workflow orchestration later, but not as the rule syntax foundation.

| Pros | Cons |
|------|------|
| Mature standard with massive ecosystem | Models processes, not rules — wrong abstraction |
| Visual representation is universally understood | Native XML is extremely verbose |
| Can orchestrate multi-agent workflows | Overkill for simple rule evaluation |

### 2.3 SBVR (Semantics of Business Vocabulary and Rules)

**What it is:** OMG standard for expressing business vocabulary and rules in controlled natural language, grounded in formal logic. Rules read like structured English: "It is obligatory that each rental has at most three additional drivers."

**Who uses it:** Primarily academic and standards bodies. Limited commercial adoption.

**LLM-friendly?** Conceptually promising — controlled natural language is close to how LLMs generate text. But SBVR has no machine-serializable format (uses font-styled text with colors/underlines).

**EzyBusiness fit:** The natural language approach is compelling for LLM-driven rule authoring, but the lack of any JSON/YAML/XML serialization is a dealbreaker. **Inspiration only.**

| Pros | Cons |
|------|------|
| Rules readable by non-technical users | No JSON/YAML/XML serialization format |
| Natural language aligns with LLM generation | Very limited tooling ecosystem |
| Strong vocabulary/ontology management | Academic/niche — few production deployments |

### 2.4 Drools Rule Language (DRL)

**What it is:** Native rule language of Drools (Red Hat). Rules follow `when...then` pattern with Java-like syntax, evaluated via Rete algorithm.

**Who uses it:** Red Hat Process Automation Manager, Spring Boot enterprises, banking/insurance/telecom on JBoss middleware.

**LLM-friendly?** Moderate. Text-based `when...then` is intuitive, but requires Java class imports and fact model knowledge. Experimental YAML support exists (`drools-drlonyaml`).

**EzyBusiness fit:** No. Tightly coupled to Java/JVM. Rules require Java class imports — not portable. The `when...then` pattern is worth borrowing; the implementation is not.

| Pros | Cons |
|------|------|
| Battle-tested at enterprise scale | Tightly coupled to Java/JVM |
| Powerful inference engine | No native JSON format |
| `when...then` pattern is intuitive | Complex setup (KIE Server, Maven) |

### 2.5 OpenRules

**What it is:** Java-based BRMS that defines decision models in Excel/Google Sheets, deployed as REST services.

**Who uses it:** Government agencies (CMS/Medicare), insurance, healthcare. Niche but established.

**LLM-friendly?** No. Rules authored in Excel spreadsheets — opaque to LLMs.

**EzyBusiness fit:** No. Excel-based rule authoring is the opposite of what EzyBusiness needs. The concept of auto-generating JSON interfaces from rule definitions is useful, but the implementation is wrong.

### 2.6 GoRules JDM (JSON Decision Model)

**What it is:** Modern, JSON-native format for representing decision models as interconnected graphs. Decision tables, expression nodes, and rule flows stored in portable `.json` files with a clear schema of nodes and edges.

**Who uses it:** GoRules customers in fintech, insurance, e-commerce. The ZEN engine runs in Rust, Node.js, Python, Go, Java, C#, Kotlin, Swift.

**LLM-friendly?** Yes, highly. Pure JSON with a clean schema. GoRules already ships AI features that analyze decision logic, generate edge cases, and validate coverage.

**EzyBusiness fit:** **Strong candidate for the business rules layer.** JSON-native, schema-first, portable, open-source engine. The graph-based model supports complex rule flows while keeping individual rules simple. EzyBusiness could embed JDM-style decision tables within its schema format.

| Pros | Cons |
|------|------|
| JSON-native — perfect for LLM generation | GoRules-specific, not an OMG standard |
| Open-source multi-language engine (ZEN) | Smaller ecosystem than DMN/Drools |
| Schema-first with typed inputs/outputs | ZEN Expression Language is proprietary |
| Git-friendly, no vendor lock-in | Relatively new — less battle-tested |
| Built-in AI features for rule analysis | |

### 2.7 FEEL (Friendly Enough Expression Language)

**What it is:** Expression language within DMN. Readable, executable expressions with natural syntax: spaces in variable names, common math notation, date/time functions.

**Who uses it:** Camunda, Drools, Trisotech, Oracle — anyone implementing DMN.

**LLM-friendly?** Yes. Expressions like `if applicant.age >= 18 then "eligible" else "not eligible"` are natural for LLMs.

**EzyBusiness fit:** **Excellent as the expression language layer** (not the overall format). FEEL handles "condition" and "calculation" parts well. EzyBusiness could use FEEL-like syntax inside a JSON/YAML rule structure.

| Pros | Cons |
|------|------|
| Designed for readability by non-technical users | Not standalone — only an expression language |
| Well-specified formal semantics | Some advanced features are complex |
| LLMs can generate FEEL expressions naturally | Implementations vary across vendors |
| Rich built-in functions (string, date, list) | |

### Business Rules Summary

| Standard | JSON/YAML Native | LLM Can Generate | Schema-First | Production Ready | EzyBusiness Fit |
|----------|:-:|:-:|:-:|:-:|---|
| DMN | No (XML) | Partial | Yes | Yes | Concept only |
| BPMN | No (XML) | Partial | No | Yes | Wrong abstraction |
| SBVR | No (styled text) | Conceptually | No | Limited | Inspiration only |
| Drools DRL | Experimental | Moderate | No | Yes | No (Java-coupled) |
| OpenRules | No (Excel) | No | No | Yes | No |
| **GoRules JDM** | **Yes (JSON)** | **Yes** | **Yes** | **Yes** | **Strong candidate** |
| **FEEL** | N/A (expressions) | **Yes** | N/A | Yes | **Expression layer** |

**Verdict:** GoRules JDM for complex decision tables + FEEL-inspired expressions for simple conditions. No XML-based standard is viable.

---

## 3. Task 2: Data Schema Standards

### 3.1 JSON Schema (Draft 2020-12)

**What it is:** Declarative language for defining structure, types, and constraints of JSON data. The most widely adopted schema validation standard.

**Entities + Fields + Validations:** Excellent. Objects (entities), properties (fields), required fields, types, and rich validation: `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`, `enum`, `format`, `allOf`/`oneOf`/`anyOf`, conditional schemas (`if`/`then`/`else`).

**AI Permissions:** None native. No concept of roles, permissions, or field-level ACLs.

**Missing for EzyBusiness:** No entity relationships (foreign keys), no AI permission model, no workflow concepts, no operations/actions on entities.

**Extensibility:** Excellent. The `$vocabulary` mechanism lets you define custom keyword sets with URIs. The `x-` prefix convention is widely used. OpenAPI itself is JSON Schema + custom vocabulary.

**Verdict:** **Best foundation layer.** Missing features can be added via custom vocabularies without breaking standard tooling.

### 3.2 OpenAPI 3.x (3.1 / 3.2)

**What it is:** Standard for describing REST APIs. Version 3.1+ uses full JSON Schema draft 2020-12 for Schema Objects.

**Entities + Fields + Validations:** Inherits all JSON Schema capabilities. Adds path operations, parameters, request/response schemas. Components allow reusable schema definitions.

**AI Permissions:** Partial. Security Scheme object for API-level auth (OAuth2, API keys, bearer). No field-level access control.

**Missing for EzyBusiness:** API-centric not entity-centric. No field-level permissions, no AI agent concepts, no workflow support. Verbose for schema-first modeling.

**Verdict:** Good as an *output target* (generate OpenAPI from EzyBusiness schema), not as the *input format*.

### 3.3 GraphQL SDL

**What it is:** Strongly-typed schema language for APIs with types, fields, queries, mutations, and subscriptions.

**Entities + Fields + Validations:** Strong entity/field modeling via `type`, `input`, `interface`, `union`, `enum`. Native validation limited to types and nullability — richer validation requires custom directives.

**AI Permissions:** Best-in-class for field-level auth. Custom directives like `@auth(requires: ADMIN)` on any field. GraphQL Shield enables declarative permission rules.

**Missing for EzyBusiness:** Query-oriented not storage-oriented. No migration, no database mapping. Directives are powerful but non-standard across implementations.

**Verdict:** The directive pattern (`@permission`, `@validate`) is excellent inspiration for EzyBusiness's annotation model. But GraphQL SDL itself is too query-centric.

### 3.4 Avro / Protobuf / Thrift

**What they are:** Binary serialization frameworks with schema languages for high-performance data exchange.

**EzyBusiness fit:** No. Wire-format focused. No relationships, no query semantics, no permissions. Compilation step required. **Wrong problem domain entirely.**

### 3.5 CSDL (OData)

**What it is:** Schema language for OData (OASIS standard). Defines entity types, properties, relationships (navigation properties), and operations.

**Entities + Fields + Validations:** Strongest entity-relationship modeling of all standards. First-class EntityType, NavigationProperty (with cardinality), annotations vocabularies for validation.

**AI Permissions:** Partial via annotations. `Org.OData.Core.V1.Permissions` can mark properties as Read, ReadWrite, or None. Describes capabilities, not role-based access.

**Missing for EzyBusiness:** Enterprise-heavy, XML-first, steep learning curve. Microsoft/SAP-centric. Overkill.

**Verdict:** Excellent annotation/vocabulary architecture worth studying. Too heavy for adoption.

### 3.6 OASF (Open Agentic Schema Framework)

**What it is:** New (2025) standardized schema for AI agent capabilities, interactions, and metadata. Backed by Cisco Outshift, Galileo, LangChain. 75+ member companies.

**Entities + Fields + Validations:** Models *agents and their capabilities*, not business domain entities. Not a general-purpose entity schema.

**AI Permissions:** Closest to AI permissions of any standard (agent-level auth, capability tokens, cryptographic signing). But agent-level, not field-level data access.

**Missing for EzyBusiness:** Agent-centric not entity-centric. No entity modeling (no fields, types, relationships for business objects). Very new, may change.

**Verdict:** Useful as a **discovery/catalog layer** alongside EzyBusiness, not as its foundation.

### 3.7 Prisma Schema Language

**What it is:** Declarative TypeScript-ecosystem schema language mapping directly to database tables with automatic migration generation.

**Entities + Fields + Validations:** Strong. `model` blocks with typed fields, `@id`, `@unique`, `@default`, `@relation`. Supports enums, composite types. But business validation (min/max, regex) lives in application code, not schema.

**AI Permissions:** None native. ZenStack (third-party extension) adds declarative access policies: `@@allow('read', auth().role == 'admin')` and field-level `@allow` rules. **ZenStack is the closest existing pattern to what EzyBusiness needs.**

**Missing for EzyBusiness:** Database-coupled. No native validation rules beyond types. TypeScript/Node only. Cannot define computed fields or workflows.

**Verdict:** Prisma's DX is excellent. ZenStack's permission model is directly relevant. **Import target** — EzyBusiness should be able to import Prisma schemas.

### 3.8 YAML

**What it is:** Human-friendly data serialization format (superset of JSON). Not a schema language itself.

**Verdict:** YAML is the **authoring syntax**, not a schema standard. It's what developers write in. EzyBusiness should use YAML for authoring, JSON Schema for validation.

### Data Schema Summary

| Standard | Entities | Validations | AI Permissions | Relationships | Extensibility | EzyBusiness Role |
|---|:-:|:-:|:-:|:-:|:-:|---|
| **JSON Schema** | Yes | Excellent | None | None (`$ref` only) | Excellent | **Foundation** |
| OpenAPI 3.x | Yes | Excellent | API-level | None | Good | Output target |
| GraphQL SDL | Yes | Basic | Field-level (directives) | Implicit | Excellent | Inspiration |
| Avro/Protobuf | Yes | Protobuf only | None | None | Limited | Skip |
| CSDL (OData) | Excellent | Good | Partial | First-class | Excellent | Study only |
| OASF | Agent-only | Agent validation | Agent-level | Agent relationships | Good | Discovery layer |
| Prisma | Excellent | Basic | ZenStack adds it | First-class | Limited | Import target |
| YAML | None | None | None | None | Infinite (format) | Authoring syntax |

**Verdict:** JSON Schema as foundation + custom vocabularies for EzyBusiness-specific features. YAML for authoring. Prisma and Supabase as import sources.

---

## 4. Task 3: AI Agent & Tool Standards

### 4.1 MCP (Model Context Protocol) — Anthropic

**What it is:** Open protocol standardizing how LLM applications connect to external tools, data sources, and services. JSON-RPC over stdio/HTTP with SSE.

**Tool structure:** Yes. `name` + `description` + `inputSchema` (JSON Schema). Clean, minimal, well-defined.

**Business rules?** No. Input validation via JSON Schema constraints only. Business logic in handler code.

**EzyBusiness generation:** **HIGH — primary output target.** MCP tool definitions are pure JSON Schema. EzyBusiness generates `inputSchema` from entity schemas; business rules execute in the handler layer.

**Adoption:** Dominant. Adopted by Anthropic, OpenAI, Google, Microsoft, Amazon. Thousands of community servers. Linux Foundation governance. $1.8B market projection.

### 4.2 OpenAI Function Calling

**What it is:** OpenAI's format for callable functions in Chat Completions/Responses APIs. JSON Schema for parameters. `strict: true` mode for guaranteed schema-valid output.

**EzyBusiness generation:** **HIGH — near-identical to MCP** (both use JSON Schema). Trivial to generate alongside MCP tools.

**Adoption:** Ubiquitous baseline. Every major LLM provider has adopted a compatible format.

### 4.3 OASF (Open Agentic Schema Framework)

**What it is:** Schema framework for AI agent identities, capabilities, skills, and metadata. Agent "records" with skill taxonomies.

**EzyBusiness generation:** **MEDIUM** — useful as a discovery layer. Each EzyBusiness-generated tool-set becomes a discoverable agent in registries/marketplaces.

### 4.4 LangChain Tool Schema

**What it is:** Framework-specific tool format using Pydantic models. Serializes to JSON Schema under the hood.

**EzyBusiness generation:** **HIGH** — since LangChain tools ultimately serialize to JSON Schema (via Pydantic), EzyBusiness can generate either Pydantic model classes or raw JSON Schema that LangChain consumes.

**Adoption:** Massive. 130M+ downloads, 110K+ GitHub stars, 1,300+ enterprise users.

### 4.5 AgentProtocol (e2b)

**What it is:** REST API spec for agent task lifecycle (create task, execute steps, list artifacts). Defines agent-level interface, not tool schemas.

**EzyBusiness generation:** LOW. Declining relevance, superseded by MCP + A2A. **Skip.**

### 4.6 ACP (Agent Communication Protocol) — IBM/BeeAI

**What it is:** Open protocol for agent-to-agent communication with MIME envelopes, task IDs, capability tokens.

**EzyBusiness generation:** LOW. **Officially merged into A2A** (August 2025). Deprecated. **Skip — target A2A instead.**

### 4.7 Google A2A (Agent-to-Agent Protocol)

**What it is:** Google's open protocol for agent interoperability. HTTP, JSON-RPC, SSE. Agent Cards (`.well-known/agent.json`) for discovery. Now under Linux Foundation (merged with ACP).

**EzyBusiness generation:** **MEDIUM-HIGH** — generate Agent Cards to advertise tool-agents in multi-agent ecosystems. Each business entity could be exposed as a discoverable A2A agent.

**Adoption:** Strong. 50+ launch partners (Atlassian, Salesforce, SAP, ServiceNow, PayPal). Google backing.

### 4.8 12-Factor Agents

**What it is:** 12 design principles for production-grade LLM applications (by HumanLayer/Dex Horthy). Not a protocol — an architectural philosophy.

**EzyBusiness alignment:** **HIGH.** Validates EzyBusiness's core thesis:
- Factor 1: Natural language → tool calls (EzyBusiness generates these)
- Factor 4: Tools are just structured outputs (EzyBusiness enforces this)
- Factor 5: Unify execution state and business state (EzyBusiness's schema-as-law)
- Factor 7: Contact humans with tool calls (EzyBusiness's owner approval)
- Factor 8: Own your control flow (business rules in code, not prompts)

### AI Agent Standards Summary

| Standard | Tool Schema? | Business Rules? | EzyBusiness Target | Adoption |
|----------|:-:|:-:|---|---|
| **MCP** | Yes (JSON Schema) | No | **PRIMARY — generate tools** | Dominant |
| **OpenAI Functions** | Yes (JSON Schema) | No | **PRIMARY — same as MCP** | Ubiquitous |
| **LangChain Tools** | Yes (Pydantic → JSON Schema) | Partial | **PRIMARY — via JSON Schema** | Massive |
| **A2A** | Agent Cards | Partial | **SECONDARY — agent discovery** | Growing |
| OASF | Agent metadata | No | SECONDARY — agent catalog | Early |
| AgentProtocol | No | No | Skip | Declining |
| ACP | No | Partial | Skip — deprecated into A2A | Deprecated |
| **12-Factor Agents** | Philosophy | Yes (principles) | **DESIGN VALIDATION** | Influential |

**Verdict:** MCP + OpenAI Function Calling are the primary output targets (both use JSON Schema — one codegen covers both). A2A Agent Cards for multi-agent discovery. 12-Factor Agents validates the architecture.

**Critical insight:** None of these standards enforce business rules in the schema layer. All define tool *structure* (what parameters exist) but not business *logic* (who can call it, under what conditions, with what constraints). **This is EzyBusiness's differentiator.** EzyBusiness generates both the schema AND the enforcement layer.

---

## 5. Task 4: Business Application Frameworks

### 5.1 Odoo

**Schema format:** Python classes with declarative ORM (`models.Model`). Fields are class attributes using `fields.*` descriptors. Auto-generates database tables and migrations.

**Business rules:** `@api.constrains` for validation, `@api.depends` for computed fields, `@api.onchange` for UI reactions, Server Actions for workflows. State machines via Selection fields.

**AI integration:** Odoo 19 (2025) introduced AI Server Actions — plain English like "When lead probability >= 80%, create opportunity" replaces coded logic. AI Agents can perform actions across modules.

**EzyBusiness takeaway:** Computed fields with dependency tracking (`@api.depends`) is an elegant pattern. AI Server Actions validate the "natural language business rules" concept. Inheritance model (`_inherit`) is powerful for plugins.

### 5.2 ERPNext / Frappe Framework

**Schema format:** **JSON files** stored in the app filesystem, committed to git. A DocType JSON file auto-creates database table + REST API + forms + permissions. `bench migrate` applies JSON changes to DB — no separate migration files.

**Business rules:** Server Scripts (Python) on DocType events (validate, before_save, after_insert), Workflow state machines, formula fields.

**AI integration:** Limited native AI integration.

**EzyBusiness takeaway:** **Closest model to what EzyBusiness should adopt.** JSON as schema + migration is the key insight — single source of truth that's version-controllable, diff-able, and human-readable. "Define once, get everything" (DB + API + UI + permissions).

### 5.3 Directus

**Schema format:** Database-first — introspects existing SQL databases and auto-maps tables to Collections. No separate config files.

**Business rules:** Flows (visual event-driven automations), custom hooks (JS/TS), granular role-based permissions at collection and field level.

**EzyBusiness takeaway:** Database-first with metadata overlay is pragmatic for brownfield projects. EzyBusiness should support importing from existing databases (Directus-style introspection).

### 5.4 Hasura

**Schema format:** SQL DDL is the source of truth. YAML metadata files describe tracked tables, relationships, permissions. `hasura metadata export/apply`.

**Business rules:** Row-level and column-level permissions with session variable interpolation (`X-Hasura-User-Id`), Event Triggers (webhooks), Actions (custom mutations → webhooks).

**EzyBusiness takeaway:** Instant API from schema is the gold standard. Row-level security with session variables is a powerful pattern. YAML metadata for version-controlled configuration.

### 5.5 Payload CMS

**Schema format:** TypeScript config objects defining Collections with fields, hooks, access control. Auto-generates DB tables + REST/GraphQL API + TypeScript types + Admin UI.

**Business rules:** Lifecycle hooks at collection level (`beforeChange`, `afterChange`, `beforeDelete`) AND field level (`beforeValidate`, `beforeChange`, `afterChange`). Function-based access control receiving full request context.

**EzyBusiness takeaway:** Best hook architecture — before/after at both document and field level. Auto-generating TypeScript types from schema is essential DX. Function-based access (not just role matching) is more powerful.

### 5.6 Budibase

**Schema format:** Visual GUI — no config files. Internal schemas stored in CouchDB.

**EzyBusiness takeaway:** Multi-source data unification (internal + external databases in one app). AI code generation for business logic. Row Actions pattern (trigger automations from data views). **Weakness: no portable schema format** — EzyBusiness must ensure schemas are always exportable.

### 5.7 Appsmith

**Schema format:** None — UI-first tool that connects to existing databases. No data modeling layer.

**EzyBusiness takeaway:** What NOT to do — no data modeling means every app rebuilds entity definitions via queries. EzyBusiness must own the data model.

### 5.8 Baserow

**Schema format:** API-driven with visual UI. No file-based schema.

**Business rules:** Automations (triggers → actions → conditional branching), formula fields, lookup/rollup fields.

**AI integration:** AI Prompt field type (LLM-computed columns), "Regenerate when referenced fields change" (AI fields auto-update when dependencies change), multi-provider support.

**EzyBusiness takeaway:** **AI as a first-class field type is innovative.** Computed fields powered by LLMs, with dependency tracking that auto-regenerates. EzyBusiness should unify formula fields and AI fields under the same reactivity system.

### Framework Patterns to Adopt

| Pattern | Source | EzyBusiness Implementation |
|---------|--------|---------------------------|
| JSON as schema + migration | Frappe | YAML authoring → JSON Schema runtime; `ezybiz migrate` applies diffs |
| Auto-generate everything from schema | Frappe, Hasura, Payload | Schema → DB + API + Types + MCP Tools + UI |
| Computed fields with dependency tracking | Odoo | `computed: "sum(items.amount)"` with `depends_on: [items.amount]` |
| AI as first-class field type | Baserow | `type: ai_computed` with prompt template and dependency tracking |
| Lifecycle hooks (before/after, doc/field level) | Payload | `rules:` section with `when: before_create, after_update` |
| Function-based access control | Payload | `ai_permissions:` with expression-based conditions |
| Row-level security with session vars | Hasura | Entity-level `row_filter` with agent identity interpolation |
| Schema portability via file export | Frappe, Hasura | Always file-first; everything is a diffable YAML/JSON file |
| Natural language business rules | Odoo 19 | AI-assisted rule authoring that compiles to deterministic logic |

### Recommended Rule Architecture (Layered)

```
Layer 1: Schema validation (required, unique, types, min/max, enum)
Layer 2: Computed/formula fields (dependency-tracked calculations)
Layer 3: AI-computed fields (LLM-powered, auto-regenerating on dependency change)
Layer 4: Lifecycle hooks (before/after CRUD events — Payload pattern)
Layer 5: State machine workflows (Draft → Submitted → Approved — Frappe pattern)
Layer 6: Automations (trigger → condition → action chains — Baserow/Budibase pattern)
Layer 7: Natural language rules compiled to deterministic logic (Odoo 19 pattern)
```

---

## 6. Task 5: Hybrid Recommendation

### Q1: What existing standard is CLOSEST to what EzyBusiness needs?

**JSON Schema (draft 2020-12)** — but only as a foundation. No single standard covers all EzyBusiness requirements. JSON Schema handles entity/field/validation definition. GoRules JDM handles complex decision tables. MCP handles AI tool output. None handles AI permissions or schema governance.

The closest *product* model is **Frappe Framework** — JSON files as canonical schema that auto-generate everything. But Frappe is Python-only and has no AI integration.

### Q2: Should EzyBusiness extend an existing standard or define a new one?

**Extend JSON Schema.** Here's why:

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| Adopt DMN/BPMN | Industry credibility | XML, enterprise-heavy, wrong abstraction | No |
| Adopt GoRules JDM | JSON-native, LLM-friendly | GoRules-specific, no entity modeling | Partial (rules only) |
| Adopt OASF | AI-agent native | Agent-centric not entity-centric | No (discovery only) |
| Extend JSON Schema | Universal, extensible, already used by MCP/OpenAI | Need custom vocabularies | **Yes** |
| Invent from scratch | Total control | NIH syndrome, no ecosystem, adoption risk | No |

**JSON Schema extension is the sweet spot** — familiar to developers, extensible by design, and already the foundation of every AI tool standard (MCP, OpenAI, LangChain).

### Q3: What is the recommended schema format?

**Option E: YAML authoring → JSON Schema + custom vocabularies at runtime.**

This combines the best of multiple options:

```yaml
# What the developer writes (YAML — human-friendly):
entities:
  expense:
    fields:
      amount:
        type: number
        minimum: 0.01
        maximum: 999999.99
        x-ai-permission: { write: false }
      category:
        type: string
        enum: [food, transport, entertainment]
        x-ai-permission: { write: true }
    x-business-rules:
      - name: no_future_dates
        when: [before_create, before_update]
        condition: "date <= today()"
        error: "Expense date cannot be in the future"
    x-ai-permissions:
      create: true
      read: true
      update: { allowed_fields: [notes, category] }
      delete: false
    x-schema-lock:
      locked: true
      version: "1.2.0"
```

```json
// What the runtime uses (JSON Schema + custom vocabularies — machine-friendly):
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$vocabulary": {
    "https://ezybusiness.dev/vocab/ai-permissions/v1": true,
    "https://ezybusiness.dev/vocab/business-rules/v1": true,
    "https://ezybusiness.dev/vocab/schema-governance/v1": true
  },
  "type": "object",
  "properties": {
    "amount": {
      "type": "number",
      "minimum": 0.01,
      "maximum": 999999.99,
      "x-ai-permission": { "write": false }
    }
  }
}
```

**Why Option E wins over the others:**

| Option | Assessment |
|--------|-----------|
| A: Extend JSON Schema with `x-` keywords | Close — but YAML authoring is needed for DX |
| B: Build on OpenAPI 3.x | Adds unnecessary API description overhead; entity-centric is better |
| C: Build on OASF | Agent-centric, doesn't model business entities |
| D: Invent new YAML format | NIH risk, no ecosystem leverage |
| **E: YAML authoring → JSON Schema runtime** | **Best DX + best interop + standard foundation** |

### Q4: What is the migration/interop story?

**Importing into EzyBusiness from existing sources:**

| Source | Import Method | Mapping |
|--------|--------------|---------|
| **Prisma schema** | `ezybiz import prisma schema.prisma` | `model` → entity, `@id` → primary_key, `@relation` → relationship, types map directly. AI permissions default to `read: true, write: false`. |
| **Supabase/Postgres** | `ezybiz import postgres --url <connection>` | Introspect tables → entities, columns → fields, constraints → validations, RLS policies → partial AI permissions. |
| **JSON Schema** | `ezybiz import jsonschema schema.json` | Direct mapping — properties → fields, validations preserved. Add AI permissions and rules manually. |
| **Frappe DocType** | `ezybiz import frappe doctype.json` | Fields map with type translation. Permissions partially importable. |
| **Airtable** | `ezybiz import airtable --api-key <key> --base <id>` | Tables → entities, columns → fields, field types map (select → enum, link → relationship). |
| **CSV/Excel** | `ezybiz import csv data.csv` | Infer types from data. Create entity with best-guess field types. User confirms/adjusts. |

**Exporting from EzyBusiness:**

| Target | Export Method |
|--------|-------------|
| MCP Tool Definitions | `ezybiz export mcp` → JSON files for MCP server |
| OpenAI Function Calling | `ezybiz export openai` → function definitions |
| Prisma Schema | `ezybiz export prisma` → `.prisma` file |
| SQL DDL | `ezybiz export sql --dialect postgres` |
| TypeScript Types | `ezybiz export types` → `.d.ts` file |
| A2A Agent Card | `ezybiz export a2a` → `agent.json` |
| OpenAPI Spec | `ezybiz export openapi` → OpenAPI 3.1 YAML |
| JSON Schema | `ezybiz export jsonschema` → standard JSON Schema |

---

## 7. Task 6: Decision Matrix

### Top 5 Candidate Approaches

| # | Approach | Description |
|---|----------|-------------|
| A | **JSON Schema + custom vocabularies** | Extend JSON Schema with `x-ai-permissions`, `x-business-rules`, `x-schema-governance` |
| B | **GoRules JDM + entity layer** | Use JDM for rules, add entity/field modeling on top |
| C | **OpenAPI 3.x + extensions** | Entities as OpenAPI schemas, rules and permissions as `x-` extensions |
| D | **OASF + entity modeling** | Extend OASF agent schemas with business entity definitions |
| E | **Custom YAML format (EzyBusiness Schema Language)** | New format from scratch, no standard foundation |

### Decision Matrix

Scoring: 0 = No support, 1 = Partial/requires significant extension, 2 = Good with some gaps, 3 = Excellent/native support

| Requirement | Weight | A: JSON Schema | B: GoRules JDM | C: OpenAPI | D: OASF | E: Custom YAML |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| **Entity + field definition** | 10 | 3 (native) | 1 (rules only) | 3 (via schemas) | 1 (agent-centric) | 3 (full control) |
| **Business rule definition** | 10 | 1 (needs extension) | 3 (native) | 1 (needs extension) | 0 | 3 (full control) |
| **AI field-level permissions** | 9 | 1 (needs vocabulary) | 0 | 1 (needs extension) | 2 (agent-level) | 3 (full control) |
| **Schema lock / version control** | 7 | 1 (needs vocabulary) | 1 (git-friendly) | 1 (needs extension) | 2 (version freeze) | 3 (full control) |
| **Auto-generate MCP tools** | 9 | 3 (MCP uses JSON Schema) | 1 (needs translation) | 2 (similar format) | 1 (needs translation) | 2 (needs codegen) |
| **Human-readable (YAML/JSON)** | 8 | 2 (JSON, verbose) | 2 (JSON, complex graph) | 2 (YAML, verbose) | 2 (JSON) | 3 (designed for DX) |
| **LLM-friendly** | 8 | 3 (LLMs know JSON Schema) | 2 (JSON but proprietary) | 2 (LLMs know OpenAPI) | 1 (new, unknown to LLMs) | 1 (new, unknown) |
| **Portable (Node, Python, Go)** | 7 | 3 (universal) | 3 (ZEN engine) | 3 (universal) | 2 (growing) | 1 (must build) |
| **Template/inheritance support** | 6 | 2 (`allOf`, `$ref`) | 1 (node reuse) | 2 (`allOf`, `$ref`) | 1 (modules) | 3 (full control) |
| **Existing ecosystem/adoption** | 8 | 3 (massive) | 1 (GoRules niche) | 3 (massive) | 1 (early) | 0 (none) |

### Weighted Scores

| Requirement | Weight | A: JSON Schema | B: GoRules JDM | C: OpenAPI | D: OASF | E: Custom YAML |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Entity + field definition | 10 | 30 | 10 | 30 | 10 | 30 |
| Business rule definition | 10 | 10 | 30 | 10 | 0 | 30 |
| AI field-level permissions | 9 | 9 | 0 | 9 | 18 | 27 |
| Schema lock / version control | 7 | 7 | 7 | 7 | 14 | 21 |
| Auto-generate MCP tools | 9 | 27 | 9 | 18 | 9 | 18 |
| Human-readable | 8 | 16 | 16 | 16 | 16 | 24 |
| LLM-friendly | 8 | 24 | 16 | 16 | 8 | 8 |
| Portable | 7 | 21 | 21 | 21 | 14 | 7 |
| Template/inheritance | 6 | 12 | 6 | 12 | 6 | 18 |
| Ecosystem/adoption | 8 | 24 | 8 | 24 | 8 | 0 |
| **TOTAL** | **82** | **180** | **123** | **163** | **103** | **183** |

### Analysis

**Custom YAML (E) scores highest (183)** but has fatal weaknesses: zero ecosystem, zero LLM familiarity, and EzyBusiness must build everything from scratch. High score comes from "full control" on features nobody else has — but full control = full cost.

**JSON Schema (A) scores second (180)** with massive advantages in ecosystem, LLM familiarity, and MCP tool generation. Its weakness (business rules, AI permissions) is addressed via custom vocabularies — a blessed extension mechanism.

**The optimal path is A+E hybrid:** YAML authoring (the DX of E) compiled to JSON Schema + custom vocabularies (the ecosystem of A). This gets the human-readability and full control of custom YAML while retaining JSON Schema's ecosystem, LLM familiarity, and native MCP compatibility.

For complex business rules that exceed simple conditions, embed **GoRules JDM decision tables** within the schema (referenced by URI or inline). This handles the business rules gap in JSON Schema without reinventing a rules engine.

### Final Scoring: Hybrid Approach (A+E+B)

| Requirement | Weight | A+E+B Hybrid Score | Notes |
|---|:-:|:-:|---|
| Entity + field definition | 10 | 30 | JSON Schema native |
| Business rule definition | 10 | 27 | Simple: FEEL-like conditions in YAML. Complex: GoRules JDM |
| AI field-level permissions | 9 | 27 | Custom vocabulary `x-ai-permissions` |
| Schema lock / version control | 7 | 21 | Custom vocabulary `x-schema-governance` |
| Auto-generate MCP tools | 9 | 27 | JSON Schema → MCP is direct |
| Human-readable | 8 | 24 | YAML authoring layer |
| LLM-friendly | 8 | 24 | LLMs know JSON Schema; YAML is readable |
| Portable | 7 | 21 | JSON Schema is universal |
| Template/inheritance | 6 | 18 | `$ref` + `allOf` + custom `extends` keyword |
| Ecosystem/adoption | 8 | 24 | JSON Schema ecosystem + GoRules ZEN engine |
| **TOTAL** | **82** | **243** | **vs 183 for best single approach** |

---

## 8. Final Recommendation

### The EzyBusiness Schema Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EzyBusiness Schema Stack                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Layer 1: YAML Authoring Format                             │ │
│  │  - Human-friendly entity/field/rule definitions              │ │
│  │  - FEEL-inspired expression syntax for conditions            │ │
│  │  - Template inheritance via `extends` keyword                │ │
│  │  - Developer writes THIS                                     │ │
│  └──────────────────────┬──────────────────────────────────────┘ │
│                         │ ezybiz compile                         │
│  ┌──────────────────────▼──────────────────────────────────────┐ │
│  │  Layer 2: JSON Schema + Custom Vocabularies (Runtime)       │ │
│  │  - Standard JSON Schema draft 2020-12 for types/validation   │ │
│  │  - x-ai-permissions vocabulary (field-level AI access)       │ │
│  │  - x-business-rules vocabulary (conditions, hooks, actions)  │ │
│  │  - x-schema-governance vocabulary (lock, version, approval)  │ │
│  │  - Machine processes THIS                                    │ │
│  └──────────────────────┬──────────────────────────────────────┘ │
│                         │ ezybiz generate                        │
│  ┌──────────────────────▼──────────────────────────────────────┐ │
│  │  Layer 3: Output Targets                                     │ │
│  │  - MCP Tool Definitions (primary)                            │ │
│  │  - OpenAI Function Calling definitions                       │ │
│  │  - Database DDL (SQLite, Postgres)                           │ │
│  │  - TypeScript/Python type definitions                        │ │
│  │  - A2A Agent Cards (agent discovery)                         │ │
│  │  - OpenAPI spec (REST API description)                       │ │
│  │  - Consumers use THESE                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Sidecar: GoRules JDM (Complex Decision Tables)             │ │
│  │  - Referenced from YAML schema via `rules_file:` pointer     │ │
│  │  - Evaluated by ZEN engine at runtime                        │ │
│  │  - For rules too complex for inline FEEL expressions         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Custom Vocabulary Definitions

**`x-ai-permissions` vocabulary:**
```yaml
# Controls what AI agents can do with each entity/field
x-ai-permissions:
  create: true | false
  read: true | false
  update: true | false | { allowed_fields: [...] }
  delete: true | false
  list: { max_results: number, default_sort: string }
  aggregate: { allowed: [sum, count, avg], group_by: [...] }
  can_change_schema: false
  can_propose_schema_change: true
```

**`x-business-rules` vocabulary:**
```yaml
# Deterministic rules enforced at the data layer
x-business-rules:
  - name: rule_name
    when: before_create | before_update | after_create | after_update | before_delete
    condition: "FEEL-like expression"  # e.g., "amount <= 50000"
    error: "Human-readable error message"
    action: reject | warn | require_approval | tag("label") | notify_owner("msg")
```

**`x-schema-governance` vocabulary:**
```yaml
# Schema lock and version control
x-schema-governance:
  locked: true | false
  version: "semver"
  last_modified: "ISO 8601 date"
  owner: "email"
  unlock_requires: owner_auth | multi_party
  change_history: "./schema-history/"
```

### Why This Recommendation

| Factor | Decision | Rationale |
|--------|----------|-----------|
| **Foundation** | JSON Schema 2020-12 | Universal, extensible, LLM-friendly, MCP/OpenAI native |
| **Authoring** | YAML | Human-readable, developer-friendly, superset of JSON |
| **Business rules** | FEEL-inspired expressions + GoRules JDM | Simple rules inline, complex rules in decision tables |
| **AI permissions** | Custom vocabulary `x-ai-permissions` | Nothing exists for this — must be custom |
| **Schema governance** | Custom vocabulary `x-schema-governance` | Nothing exists for this — must be custom |
| **Primary output** | MCP tools | Dominant standard, JSON Schema native |
| **Import sources** | Prisma, Postgres, JSON Schema, CSV | Meet developers where they are |
| **Rule engine** | GoRules ZEN (Rust/Node/Python/Go) | Open source, battle-tested, multi-language |
| **Expression language** | FEEL-inspired (not full FEEL) | Readable, LLM-friendly, well-specified subset |

### What This Means for the MVP

For the 1-week prototype SDK (Phase 1 from DISCOVERY.md):

1. **Define the YAML schema format** — entities, fields, types, validations, `x-ai-permissions`, simple `x-business-rules`
2. **Build YAML → JSON Schema compiler** — converts authoring format to runtime format with custom vocabularies
3. **Build rule evaluator** — evaluate FEEL-like conditions on CRUD operations (no need for GoRules JDM in MVP)
4. **Build MCP tool generator** — auto-generate MCP tool definitions from compiled schema
5. **Build permission enforcer** — check `x-ai-permissions` before executing any AI-initiated operation
6. **Test with expenses app** — Jazz's personal expenses schema as the dogfood test

GoRules JDM integration, A2A Agent Cards, import/export, and template inheritance come in Phase 2+.

---

## 9. Sources

### Business Rules Standards
- [DMN - Object Management Group](https://www.omg.org/dmn/)
- [DMN - Wikipedia](https://en.wikipedia.org/wiki/Decision_Model_and_Notation)
- [Capital One - The Power of DMN](https://www.capitalone.com/tech/software-engineering/decision-model-and-notation/)
- [SBVR 1.5 - OMG](https://www.omg.org/spec/SBVR/1.5/About-SBVR)
- [Drools DRL - Red Hat Documentation](https://docs.redhat.com/en/documentation/red_hat_process_automation_manager/7.13/html/developing_decision_services_in_red_hat_process_automation_manager/drl-rules-con_drl-rules)
- [GoRules JDM Format](https://docs.gorules.io/reference/json-decision-model-jdm)
- [JDM Standard - GoRules](https://docs.gorules.io/developers/jdm/standard)
- [ZEN Engine - GitHub](https://github.com/gorules/zen)
- [FEEL Handbook - Drools](https://kiegroup.github.io/dmn-feel-handbook/)
- [FEEL - Camunda](https://docs.camunda.io/docs/components/modeler/feel/what-is-feel/)
- [dmnmd - DMN in Markdown](https://github.com/smucclaw/dmnmd)
- [BPMN Assistant - LLM-Based Approach](https://arxiv.org/html/2509.24592v1)

### Data Schema Standards
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)
- [Extending JSON Schema Using Vocabularies](https://docs.json-everything.net/schema/vocabs/)
- [OpenAPI Specification v3.1.0](https://swagger.io/specification/)
- [GraphQL Schemas and Types](https://graphql.org/learn/schema/)
- [Protovalidate](https://protovalidate.com/)
- [OData CSDL v4.0](https://docs.oasis-open.org/odata/odata/v4.0/odata-v4.0-part3-csdl.html)
- [OASF - Open Agentic Schema Framework](https://docs.agntcy.org/oasf/open-agentic-schema-framework/)
- [Prisma Schema Overview](https://www.prisma.io/docs/orm/prisma-schema/overview)
- [ZenStack - Modeling Authorization in Prisma](https://zenstack.dev/blog/model-authz)

### AI Agent Standards
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [2026 MCP Roadmap](http://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/)
- [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Google A2A Protocol](https://a2a-protocol.org/latest/specification/)
- [ACP Joins Forces with A2A](https://lfaidata.foundation/communityblog/2025/08/29/acp-joins-forces-with-a2a-under-the-linux-foundations-lf-ai-data/)
- [12-Factor Agents - GitHub](https://github.com/humanlayer/12-factor-agents)
- [LangChain StructuredTool](https://python.langchain.com/api_reference/core/tools/langchain_core.tools.structured.StructuredTool.html)

### Business Application Frameworks
- [Odoo 19 ORM API](https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html)
- [Odoo 19 AI Features](https://www.certumsolutions.com/library/odoo-ai-setup-your-own-agents)
- [Frappe Framework Guide 2025](https://medium.com/@the.scideas/frappe-framework-guide-features-architecture-use-cases-benefits-2025-edition-9d0af8a3c047)
- [Frappe DocType Documentation](https://docs.frappe.io/erpnext/user/manual/en/doctype)
- [Directus Documentation](https://directus.io/)
- [Hasura GraphQL Schema](https://hasura.io/docs/2.0/schema/overview/)
- [Payload CMS Collection Configs](https://payloadcms.com/docs/configuration/collections)
- [Baserow 2.0 Release Notes](https://baserow.io/blog/baserow-2-0-release-notes)
- [Budibase 2026 Roadmap](https://budibase.com/blog/updates/future-of-budibase-2026/)

---

*Research conducted: 2026-03-18*
*Method: 4 parallel research agents analyzing 30+ standards and frameworks across business rules, data schemas, AI agent protocols, and application frameworks*
*Standards analyzed: DMN, BPMN, SBVR, Drools DRL, OpenRules, GoRules JDM, FEEL, JSON Schema, OpenAPI, GraphQL SDL, Avro/Protobuf/Thrift, CSDL, OASF, Prisma, MCP, OpenAI Functions, LangChain, AgentProtocol, ACP, A2A, 12-Factor Agents, Odoo, Frappe, Directus, Hasura, Payload CMS, Budibase, Appsmith, Baserow*
