You are a UX and product designer. Read docs/ARCHITECTURE.md, docs/FEATURES.md, docs/NORTH-STAR.md, docs/PROBLEM.md for context.

EzyForge is an agentic-first cloud platform. The primary interface is an AI agent connecting via MCP. Web UI is secondary (admin/config only).

## Your Task

Create docs/USER-JOURNEY.md that maps out BOTH the human journey and the LLM/agent journey — side by side.

The document should cover the complete lifecycle of using EzyForge, from discovery to daily use to growth.

## Structure

### Phase 1: Discovery & Signup

**Human Journey:**
- How does the human discover EzyForge?
- What motivates them to sign up?
- What is the signup experience?

**LLM Journey:**
- How does the LLM first learn about EzyForge? (tool discovery, MCP registry, developer configures it)
- What happens when an LLM is first connected?

### Phase 2: App Creation

**Human Journey:**
- What does the human do to create their first app?
- Two paths: (A) human tells their AI agent to set it up, (B) human uses web UI directly
- What decisions does the human make? (template, name, which AI agents can access)

**LLM Journey:**
- How does the agent create an app on behalf of the human?
- What API calls does the agent make?
- What does the agent receive back? (MCP endpoint, tools list, schema summary)
- How does the agent understand the schema? (tool descriptions, field descriptions)

### Phase 3: Onboarding & First Use

**Human Journey:**
- Human tells agent to do something ("log my lunch expense")
- Human sees it worked (agent confirms)
- Human builds trust through first 5-10 interactions

**LLM Journey:**
- Agent receives MCP tools and understands capabilities
- Agent makes first tool call (e.g., create_expense)
- Agent hits a rule violation — how does it handle it?
- Agent hits a permission denial — how does it respond?
- Agent discovers what it CAN'T do (no delete tool)

### Phase 4: Daily Operations

**Human Journey:**
- Human interacts with agent naturally — never opens dashboard
- "Log this" "How much did I spend?" "What's my budget status?"
- Human receives periodic summaries from agent

**LLM Journey:**
- Agent handles CRUD through MCP tools
- Agent handles queries and aggregations
- Agent translates structured responses into natural language
- Agent maintains context across conversations
- Agent handles errors gracefully (rule violations, permission denials)

Show example conversations and the MCP calls underneath.

### Phase 5: Schema Evolution

**Human Journey:**
- Human realizes they need a new field or rule
- Two paths: (A) AI proposes it, human approves (B) human edits schema directly
- Approval flow: notification → review → approve/reject

**LLM Journey:**
- Agent notices a pattern ("you always mention tips, should I track those?")
- Agent proposes schema change via API
- Agent waits for approval
- Agent receives updated tools after approval
- Agent can now use the new field

### Phase 6: Growth & Multiple Apps

**Human Journey:**
- Human creates second app (CRM, booking, etc.)
- Human manages multiple apps from dashboard
- Human manages which AI agents have access to which apps

**LLM Journey:**
- Agent operates across multiple apps
- Agent understands different schemas per app
- Agent respects different permission sets per app
- Agent can create new apps on behalf of human

### Phase 7: Trust & Governance

**Human Journey:**
- Human checks audit log — sees every AI action
- Human reviews AI proposals queue
- Human locks schema for production stability
- Human exports data (portable, owned)

**LLM Journey:**
- Agent operates within locked schema constraints
- Agent cannot propose schema changes when locked
- Agent's activity is fully logged and auditable
- Agent token can be revoked instantly

---

## Format

For each phase, use this format:

```
### Phase X: [Name]

**Human Experience:**
[Walk through what the human sees, feels, does. Include exact UI/conversation examples.]

**Agent Experience:**
[Walk through what the LLM does. Include exact MCP calls, API requests, responses.]

**Interaction Touchpoint:**
[Where human and agent interact — what the human approves, what the agent asks for.]

**Trust Moment:**
[What builds trust at this phase — the "aha" that keeps the user engaged.]
```

Include realistic conversation examples between human ↔ agent, and show the MCP calls happening underneath.

## Output

Save to: /mnt/d/openclaw-workspace/projects/ezybusiness/docs/USER-JOURNEY.md

When done:
openclaw system event --text "Done: EzyForge USER-JOURNEY.md ready" --mode now
