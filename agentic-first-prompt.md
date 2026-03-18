You are a product architect. Read docs/ARCHITECTURE.md, docs/FEATURES.md, docs/NORTH-STAR.md, docs/PROBLEM.md, README.md, and CLAUDE.md first.

## Critical Correction from Founder

The current docs still have a human-UI-first approach: "sign up on web UI, pick template, edit schema in browser, view dashboard."

This is WRONG. EzyForge is **agentic-first**.

The PRIMARY interface is NOT a web dashboard. The PRIMARY interface is an AI agent (like OpenClaw, Claude, GPT) connecting via MCP.

### What "Agentic First" Means

1. **The agent discovers and connects** — not the human typing URLs
   - User tells their AI: "Create me a personal expenses app on EzyForge"
   - Agent calls EzyForge API to create the app, pick template, deploy
   - Agent returns the connection details to the user

2. **The agent operates the app** — not the human clicking dashboards
   - "Log lunch at McDonald's RM 15" → agent calls MCP → done
   - "Show me this month's spending" → agent queries via MCP → responds
   - "How much did I spend on food?" → agent aggregates → responds
   - No dashboard needed for daily operations

3. **The agent proposes changes** — human approves
   - Agent: "I notice you track tips. Should I add a tip field?"
   - EzyForge sends approval request (email/push/in-agent)
   - Human approves → schema updated → agent gets new tools

4. **Web UI exists but is SECONDARY**
   - For: reviewing schema, managing tokens, viewing audit log, billing
   - NOT for: daily data entry, querying data, managing records
   - Think: AWS Console. You CAN do everything there. But you USUALLY use the CLI/API.

### The Correct Interaction Model

```
Human ←→ AI Agent ←→ EzyForge Cloud
              ↑
        (primary path)

Human ←→ Web UI ←→ EzyForge Cloud
              ↑
        (admin/config path only)
```

### What Changes

**App creation:** Agent-initiated, not web-UI-initiated
```
User: "Set up an expense tracker for me on EzyForge"
Agent: calls POST /api/apps { template: "expenses" }
EzyForge: creates app, returns MCP endpoint + token
Agent: "Done! Your expenses app is live. I can start logging expenses."
```

**Schema changes:** Agent-proposed, human-approved
```
Agent: "Your expenses don't track payment method. Want me to add it?"
Human: "Yes"
Agent: calls POST /api/apps/{id}/proposals { add_field: "payment_method" }
EzyForge: queues proposal, sends approval to human
Human: approves (email/push notification/in-chat button)
Agent: "Done, I can now track payment methods."
```

**Data operations:** 100% through agent
```
All CRUD happens via MCP tools.
Human never opens a form to enter data.
Human never opens a table to view records.
Agent is the interface.
```

**Admin tasks:** Web UI (secondary)
```
- Manage API tokens
- View audit trail
- Billing/subscription
- Emergency schema unlock
- Export data
```

## Your Task

Update these 4 documents to be AGENTIC-FIRST:

### 1. docs/ARCHITECTURE.md
- Redesign the interaction model: agent is primary, web UI is secondary
- Show the agentic flow: agent creates apps, operates data, proposes changes
- MCP is the MAIN interface, REST API is for admin, Web UI is for config
- Update the architecture diagram

### 2. docs/FEATURES.md
- Reorganize: AI Integration features become P1, dashboard becomes P2
- Add: agentic app creation (agent calls API to create app from template)
- Add: agentic schema proposals (agent proposes, human approves)
- Add: agentic onboarding flow
- Demote: dashboard and web UI features to P2/P3

### 3. docs/NORTH-STAR.md
- Update belief: "Agents are the primary interface. Dashboards are for exceptions."
- Update demo: the wow moment is agent-initiated, not human-clicking-UI
- Update winning signals

### 4. README.md
- The quick start should show the AGENT flow, not the web UI flow
- Example: user talks to AI → AI sets up the app → AI operates it
- Web UI mentioned but secondary

Overwrite all 4 files in place.

When done:
openclaw system event --text "Done: EzyForge docs updated to agentic-first" --mode now
