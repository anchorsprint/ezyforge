You are a senior technical researcher and standards architect.

Read DISCOVERY.md and RESEARCH.md first for full context on the EzyBusiness product.

## The Question
Before building a new schema format from scratch, we need to know:
**Is there an existing well-known protocol, standard, or schema format we should build ON TOP OF — rather than inventing from scratch?**

Jazz wants EzyBusiness to be "business domain agnostic, portable." Building on an existing standard accelerates adoption, avoids NIH (not-invented-here) syndrome, and gives credibility.

## Research Tasks

### Task 1: Business Rules / Decision Standards
Research these and answer: can they form the foundation for EzyBusiness business rules?

- **DMN (Decision Model and Notation)** — OMG standard for decision tables
- **BPMN (Business Process Model and Notation)** — OMG standard for workflows
- **SBVR (Semantics of Business Vocabulary and Rules)** — OMG standard for business rules
- **Drools Rule Language (DRL)** — Red Hat business rules engine
- **OpenRules** — open-source business rules management
- **GoRules JDM (JSON Decision Model)** — modern JSON-based decision standard
- **FEEL (Friendly Enough Expression Language)** — part of DMN standard

For each: what is it, who uses it, is it LLM-friendly, would it work as EzyBusiness rule syntax?

### Task 2: Data Schema Standards
Research these for defining entities and data models:

- **JSON Schema (draft 2020-12)** — widely used for data validation
- **OpenAPI 3.x** — REST API schema standard (already uses JSON Schema)
- **GraphQL Schema Definition Language (SDL)** — type system for APIs
- **Avro / Protobuf / Thrift** — data serialization schemas
- **CSDL (Common Schema Definition Language)** — OData standard
- **OASF (Open Agent Schema Framework)** — new standard for AI agents
- **Prisma Schema Language** — TypeScript-native ORM schema
- **YAML (YAML Ain't Markup Language)** — human-friendly data format

For each: can it define entities + fields + validations + AI permissions? What's missing?

### Task 3: AI Agent / Tool Standards
Research emerging standards specifically for AI agents:

- **MCP (Model Context Protocol)** — Anthropic's standard for AI tools
- **OpenAI Function Calling schema** — JSON Schema for tool definitions
- **OASF (Open Agent Schema Framework)** — agent schemas
- **LangChain Tool schema** — tool definitions in LangChain
- **AgentProtocol (e2b)** — HTTP standard for agent communication
- **ACP (Agent Communication Protocol)** — IBM/BeeAI standard
- **Google A2A (Agent-to-Agent Protocol)** — Google's new agent standard (April 2025)
- **12-Factor Agents** — principles for agentic app design

For each: does it define HOW tools are structured? Does it include business rule enforcement? Could EzyBusiness generate these natively?

### Task 4: Existing Business Application Frameworks
Look at frameworks that define "business apps as config/schema":

- **Odoo** — Python ERP with declarative business models
- **ERPNext / Frappe Framework** — JSON-based business app builder
- **Directus** — schema-based headless CMS/app builder
- **Hasura** — auto-generates GraphQL from Postgres schema
- **Payload CMS** — TypeScript collection-based schema
- **Budibase** — low-code with schema-driven apps
- **Appsmith** — open source low-code
- **Baserow** — open source Airtable alternative

For each: how do they define business objects? What can EzyBusiness learn or borrow?

### Task 5: Hybrid Recommendation
Based on all research, answer:

1. **What existing standard is CLOSEST to what EzyBusiness needs?**
2. **Should EzyBusiness extend an existing standard, or define a new one?**
3. **What is the recommended schema format?**
   - Option A: Extend JSON Schema with custom keywords (`x-ai-permissions`, `x-business-rules`)
   - Option B: Build on OpenAPI 3.x (entities become schemas, rules become extensions)
   - Option C: Build on OASF (already designed for AI agents)
   - Option D: Invent a new YAML-based format (EzyBusiness Schema Language)
   - Option E: Support multiple formats (YAML authoring → JSON Schema runtime)
4. **What is the migration/interop story?** If I have a Prisma schema or Supabase table — how would I import it into EzyBusiness?

### Task 6: Decision Matrix
Build a decision matrix comparing the top 5 candidate standards against EzyBusiness requirements:

Requirements:
- Entity + field definition
- Business rule definition
- AI field-level permissions
- Schema lock/version control
- Auto-generate MCP tools
- Human-readable (YAML/JSON)
- LLM-friendly (AI can read/write it)
- Portable (Node, Python, Go)
- Template/inheritance support
- Existing ecosystem/adoption

## Output
Save to: /mnt/d/openclaw-workspace/projects/ezybusiness/PROTOCOL-RESEARCH.md

Also add a section to DISCOVERY.md: "## 10. Schema Format Decision" with your recommendation.

When done:
openclaw system event --text "Done: EzyBusiness protocol research complete" --mode now
