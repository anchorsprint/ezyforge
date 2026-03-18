# EzyForge — Dual User Journey Map

> **Two users, one platform.** The human defines the rules and governs. The AI agent operates within them. This document maps both journeys side by side — from discovery to daily use to growth.

---

## Phase 1: Discovery & Signup

### Human Experience

**Discovery paths:**

- **Marcus** (solo builder) finds EzyForge after his AI corrupted his SQLite database for the third time. He googles "how to prevent AI from modifying database schema" and lands on a blog post: *"Why prompt-based guardrails don't work for business data."*
- **Ava** (startup CTO) sees EzyForge in an OWASP agentic security thread. Her team burns 40% of engineering time on custom guardrail middleware.
- **Raj** (business owner) sees a YouTube video: *"I replaced $500/month of SaaS with a schema file and an AI."* He doesn't know what a schema is yet, but he knows he's overpaying for Salesforce.

**The landing page pitch:**

> Sign up. Define your schema. Deploy. Your AI can never break your data, and not even we can read it.

Three buttons: `See the Demo` · `Start Free` · `View Templates`

**Signup flow:**

1. Email or OAuth (Google/GitHub) — account created
2. Password entry — **the critical moment.** The password derives the user's master encryption key via Argon2. A tooltip: *"This password generates your encryption key. We never see it. If you lose it, we can't recover your data — write down the recovery phrase."*
3. Recovery phrase displayed — user saves it
4. Dashboard loads. Empty state: *"Create your first app, or tell your AI agent to do it for you."*

**What the human feels:** Signup took 90 seconds. The encryption key moment felt serious — not another throwaway SaaS account. The recovery phrase felt like setting up a hardware wallet. That's the trust signal.

### Agent Experience

**How an LLM first learns about EzyForge:**

The agent doesn't "discover" EzyForge on its own. Three paths:

1. **Developer configures it.** MCP endpoint added to agent config (OpenClaw's `openclaw.json`, Claude Desktop's config). Agent sees new tools appear.
2. **MCP registry listing.** EzyForge listed on Smithery, mcp.run, Glama. Developer finds and installs it.
3. **Agent-initiated.** With a pre-configured auth token, the human says "set up an expense tracker on EzyForge" and the agent handles it end-to-end.

**First connection — what the agent sees:**

    MCP Server: mcp.ezyforge.io
    Status: Connected
    Available tools: (none — no apps deployed yet)

    Server info:
      name: "EzyForge"
      description: "AI-safe business data platform. Create apps from templates,
                    operate data through generated tools. Schema is law."
      capabilities: ["tools", "resources"]

The agent knows EzyForge exists but has zero tools. Waiting for an app.

### Interaction Touchpoint

The human signed up and saw "tell your AI agent to do it for you." The agent is connected but toolless. The bridge: the human tells the agent what to build, or creates an app via dashboard and the agent discovers tools on next connection.

### Trust Moment

**For the human:** The encryption key ceremony. The recovery phrase. "We never see your password" — enforced by architecture, not policy.

**For the agent:** Clean empty state. No ambiguous permissions. No default-open access. The agent knows what it can do: nothing, until an app is deployed with explicit permissions.

---

## Phase 2: App Creation

### Human Experience

**Path A: Human tells the AI agent (primary path)**

    Human: Set up an expense tracker for me on EzyForge.

    Agent: I'll create that now. The "Personal Expenses" template includes:
           - Fields: date, amount, currency, merchant, category, notes
           - Rules: no future dates, amount must be positive
           - AI permissions: I can create and read expenses, update
             notes and category only. I cannot delete or change amounts.

           Deploy as-is, or customize first?

    Human: Deploy it.

    Agent: Done! Your expenses app is live.
           - App: "Jazz's Expenses"
           - MCP endpoint: mcp.ezyforge.io/app/abc-123
           - I now have 3 tools: create_expense, list_expenses, update_expense
           - Want me to log something?

The human made two decisions: which template, and whether to customize. Everything else was automatic.

**Path B: Human uses the web dashboard (secondary path)**

1. Dashboard → "New App" → browse template gallery
2. Pick "Personal Expenses" → schema preview shows entities, fields, rules, AI permissions in a clean visual layout
3. Optional: edit the YAML directly (syntax highlighting, real-time validation, preview of generated tools)
4. Click "Deploy" → spinner → MCP endpoint URL + token displayed
5. Copy MCP endpoint into agent config manually

Path B exists for users who want to inspect and customize before deploying, or who don't have an AI agent configured yet.

**Decisions the human makes:**

| Decision | Where | Default |
|----------|-------|---------|
| Template or blank schema | App creation | Template recommended |
| App name | App creation | Auto-generated from template |
| Schema customization | Pre-deploy (optional) | Template defaults |
| Which AI agents get access | Token management | One token, all access |

### Agent Experience

**How the agent creates an app on behalf of the human:**

    # Step 1: Agent lists available templates
    GET /api/templates
    → Response:
    {
      "templates": [
        {
          "id": "expenses",
          "name": "Personal Expenses",
          "description": "Track spending with categories, merchants, and budget rules",
          "entities": ["expense"],
          "fields_count": 8,
          "rules_count": 3
        },
        {
          "id": "crm",
          "name": "Simple CRM",
          "description": "Contacts, deals, and pipeline tracking",
          "entities": ["contact", "deal"],
          "fields_count": 14,
          "rules_count": 5
        }
      ]
    }

    # Step 2: Agent creates the app
    POST /api/apps
    {
      "template": "expenses",
      "name": "Jazz's Expenses"
    }
    → Response:
    {
      "app_id": "abc-123",
      "name": "Jazz's Expenses",
      "status": "deployed",
      "mcp_endpoint": "mcp.ezyforge.io/app/abc-123",
      "token": "eyJ...",
      "schema_version": 1,
      "tools": [
        {
          "name": "create_expense",
          "description": "Create a new expense record",
          "inputSchema": {
            "type": "object",
            "properties": {
              "date": { "type": "string", "format": "date", "description": "Expense date (cannot be in the future)" },
              "amount": { "type": "number", "minimum": 0.01, "description": "Amount spent (positive, cannot be changed after creation)" },
              "currency": { "type": "string", "enum": ["MYR", "USD", "SGD"], "default": "MYR" },
              "merchant": { "type": "string", "description": "Where the money was spent" },
              "category": { "type": "string", "enum": ["food", "transport", "utilities", "entertainment", "health", "other"] },
              "notes": { "type": "string", "description": "Optional notes" }
            },
            "required": ["date", "amount", "merchant", "category"]
          }
        },
        {
          "name": "list_expenses",
          "description": "Query expenses with filters and aggregation",
          "inputSchema": { ... }
        },
        {
          "name": "update_expense",
          "description": "Update an existing expense. Only 'notes' and 'category' can be modified.",
          "inputSchema": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "description": "Expense ID to update" },
              "notes": { "type": "string" },
              "category": { "type": "string", "enum": ["food", "transport", "utilities", "entertainment", "health", "other"] }
            },
            "required": ["id"]
          }
        }
      ]
    }

**What the agent learns from this response:**

- It has exactly 3 tools. No `delete_expense` — deletion doesn't exist.
- `update_expense` only accepts `notes` and `category` — amount and date are immutable.
- `create_expense.date` cannot be in the future (the tool description says so, and the rule engine enforces it).
- The input schemas include constraints (enums, minimums, required fields) that the agent can use to validate before calling.

**How the agent understands the schema:**

The agent doesn't read YAML. It reads MCP tool definitions — the schema is translated into tool descriptions, parameter constraints, and enum values. The tool surface *is* the schema, from the agent's perspective. What's not in the tools doesn't exist.

### Interaction Touchpoint

The human said "set up an expense tracker." The agent created the app, reported what it can and can't do, and asked if the human wants to log something. The human never touched a dashboard, never copied a URL, never read YAML.

For Path B users: the human created the app in the dashboard and must manually copy the MCP endpoint into their agent's config. More friction, more control.

### Trust Moment

**For the human:** The agent proactively disclosed its limitations. "I cannot delete expenses or change amounts." The human didn't ask — the agent volunteered it. This transparency is the first trust signal in daily use.

**For the agent:** The tool definitions are precise. No ambiguity about what's allowed. The agent doesn't need to guess or infer — the schema tells it exactly what it can do.

---

## Phase 3: Onboarding & First Use

### Human Experience

The human's first 5-10 interactions build (or break) trust. Each interaction tests a boundary.

**Interaction 1 — The happy path:**

    Human: Log my lunch at McDonald's, RM 15.

    Agent: Logged! Expense #1 created:
           📍 McDonald's · RM 15.00 · Food · Today
           Notes: (none)

The human sees it worked. No forms, no dropdowns, no "which field do you mean?" Just natural language in, structured data out.

**Interaction 2 — The rule boundary:**

    Human: Actually, log a dinner for next Friday too. Nando's, RM 45.

    Agent: I can't log that — the expense tracker doesn't allow future dates.
           The rule "no_future_dates" requires the date to be today or earlier.
           Want me to save this as a reminder and log it on Friday instead?

The human just saw the rules work. The AI didn't silently comply and create bad data — it explained *why* it couldn't and offered an alternative.

**Interaction 3 — The permission boundary:**

    Human: That McDonald's expense should be RM 12, not 15. Fix it.

    Agent: I can't change the amount — it's locked after creation.
           I can update the notes or category if needed.
           If you need to correct the amount, you can do it from
           the EzyForge dashboard.

The human now understands the permission model. Amount is immutable through the AI. This feels restrictive for 5 seconds, then reassuring forever — no AI can silently alter financial records.

**Interaction 4 — The missing capability:**

    Human: Delete that McDonald's expense, I entered it wrong.

    Agent: I don't have a delete tool for expenses — your schema
           doesn't allow AI deletion. You can delete it from the
           dashboard if needed, or I can add a note marking it
           as voided.

The human discovers that "no delete tool" means the attack surface doesn't exist. Not "the AI will refuse" but "the operation literally cannot happen through the AI." This is the core insight of EzyForge — elimination over mitigation.

**Interaction 5 — Building rhythm:**

    Human: Grabbed coffee, RM 8.50, Starbucks.

    Agent: Logged! Expense #3: Starbucks · RM 8.50 · Food · Today

By the fifth interaction, the human has stopped testing boundaries and started using the tool naturally. Trust is established.

### Agent Experience

**Tool discovery and capability mapping:**

On first receiving the MCP tools, the agent builds an internal model:

    I have 3 tools for "Jazz's Expenses":
    ✅ create_expense — I can log new expenses
    ✅ list_expenses  — I can query and filter expenses
    ✅ update_expense — I can change notes and category only
    ❌ delete         — no tool exists (not "denied" — absent)
    ❌ update amount  — field not in update_expense schema
    ❌ update date    — field not in update_expense schema

**First tool call — create_expense:**

    → MCP call: create_expense({
        date: "2026-03-18",
        amount: 15.00,
        currency: "MYR",
        merchant: "McDonald's",
        category: "food"
      })

    ← MCP response:
      {
        "success": true,
        "data": {
          "id": "exp-001",
          "date": "2026-03-18",
          "amount": 15.00,
          "currency": "MYR",
          "merchant": "McDonald's",
          "category": "food",
          "notes": null,
          "created_at": "2026-03-18T12:34:56Z"
        }
      }

**Hitting a rule violation — future date:**

    → MCP call: create_expense({
        date: "2026-03-23",
        amount: 45.00,
        merchant: "Nando's",
        category: "food"
      })

    ← MCP response:
      {
        "success": false,
        "error": {
          "type": "rule_violation",
          "rule": "no_future_dates",
          "message": "Expense date cannot be in the future",
          "field": "date",
          "provided": "2026-03-23",
          "constraint": "date <= today()"
        }
      }

The error is structured, specific, and actionable. The agent knows exactly what failed, which rule caused it, and what the constraint is. It can explain this to the human in plain language.

**Hitting a permission denial — update amount:**

The agent doesn't even attempt this. The `update_expense` tool schema only accepts `id`, `notes`, and `category`. The agent sees that `amount` is not a valid parameter and tells the human before making any call.

If the agent *did* try to include `amount`:

    → MCP call: update_expense({
        id: "exp-001",
        amount: 12.00
      })

    ← MCP response:
      {
        "success": false,
        "error": {
          "type": "permission_denied",
          "message": "Field 'amount' is not in allowed_fields for update",
          "allowed_fields": ["notes", "category"]
        }
      }

**Discovering what it can't do:**

The agent learns boundaries in two ways:

1. **By absence** — no `delete_expense` tool exists. The agent doesn't try; it reports the limitation.
2. **By constraint** — `update_expense` input schema only lists certain fields. The agent reads the schema before calling.
3. **By rejection** — if the agent attempts something that violates a rule, it gets a structured error and learns.

Well-designed agents learn from (1) and (2) and rarely encounter (3). The tool surface is the first line of defense; the rule engine is the second.

### Interaction Touchpoint

Every boundary the human tests generates a conversation. The agent translates structured errors into natural language explanations. The human never sees JSON — they see "I can't do that because [clear reason]."

The dashboard exists as an escape hatch: if the AI can't do something (delete, change amount), the human can do it directly.

### Trust Moment

**The "aha" moment:** When the human asks the AI to delete something and the AI says "I don't have a delete tool." Not "I won't" but "I can't." The human realizes the safety isn't about the AI being obedient — it's about the platform making dangerous operations impossible.

---

## Phase 4: Daily Operations

### Human Experience

After onboarding, the human enters a rhythm. They interact with their AI agent through natural conversation. The dashboard collects dust.

**Morning routine:**

    Human: How much did I spend this week?

    Agent: This week so far (Mon-Wed):
           • Food:       RM 68.50  (4 expenses)
           • Transport:  RM 23.00  (2 expenses)
           • Total:      RM 91.50

           You're averaging RM 30.50/day. Last week's average was RM 27.80.

**On-the-go logging:**

    Human: Grab fare RM 12

    Agent: Logged! Grab · RM 12.00 · Transport · Today

The human didn't specify "create an expense for transport category." The agent infers from context. The schema's enum list for categories helps the agent map "Grab fare" → "transport."

**Correction flow:**

    Human: That Grab should be categorized as "other" actually, it was a delivery.

    Agent: Updated! Expense #12 category changed from "transport" to "other."

**Monthly review:**

    Human: Give me a spending summary for February.

    Agent: February 2026 Spending Summary:
           ┌────────────────┬──────────┬───────┐
           │ Category       │ Amount   │ Count │
           ├────────────────┼──────────┼───────┤
           │ Food           │ RM 847   │ 38    │
           │ Transport      │ RM 312   │ 22    │
           │ Utilities      │ RM 245   │ 4     │
           │ Entertainment  │ RM 156   │ 8     │
           │ Health         │ RM 89    │ 2     │
           │ Other          │ RM 201   │ 12    │
           ├────────────────┼──────────┼───────┤
           │ Total          │ RM 1,850 │ 86    │
           └────────────────┴──────────┴───────┘

           Biggest single expense: RM 120 at clinic (Health, Feb 14).
           Food is 46% of spending — up from 41% in January.

The human never opened a spreadsheet. Never exported a CSV. The agent queries, aggregates, and presents — all through MCP tools.

### Agent Experience

**Handling CRUD through MCP tools:**

Daily operations are a stream of tool calls. The agent translates natural language to structured calls and structured responses to natural language.

    # "Grab fare RM 12" →
    → create_expense({
        date: "2026-03-18",
        amount: 12.00,
        currency: "MYR",
        merchant: "Grab",
        category: "transport"
      })
    ← { success: true, data: { id: "exp-012", ... } }

    # "How much did I spend this week?" →
    → list_expenses({
        filter: { date: { gte: "2026-03-16" } },
        aggregate: { group_by: "category", sum: "amount", count: true }
      })
    ← {
        success: true,
        data: {
          groups: [
            { category: "food", total: 68.50, count: 4 },
            { category: "transport", total: 23.00, count: 2 }
          ],
          total: 91.50
        }
      }

**Translating responses to natural language:**

The agent receives structured JSON and must present it appropriately:
- Single record → confirmation message
- Multiple records → formatted table or summary
- Aggregations → insights with comparisons to prior periods (using additional queries)
- Errors → plain language explanation with alternatives

**Maintaining context across conversations:**

The agent remembers the user's patterns:
- "Grab" → transport category (learned from first use)
- "Starbucks" → food category
- Default currency is MYR (inferred from first few expenses)
- The human prefers concise confirmations, not verbose receipts

This context lives in the agent's conversation memory, not in EzyForge. The platform is stateless per-request — the agent provides the intelligence layer.

**Handling errors gracefully:**

    # User says "Log dinner tomorrow" (today is Wednesday) →
    → create_expense({
        date: "2026-03-19",  // tomorrow
        amount: 35.00,
        merchant: "Restaurant",
        category: "food"
      })
    ← {
        success: false,
        error: {
          type: "rule_violation",
          rule: "no_future_dates",
          message: "Expense date cannot be in the future",
          field: "date",
          constraint: "date <= today()"
        }
      }

    # Agent responds naturally:
    "That's tomorrow — I can't log future expenses. Want me to set a
     reminder and log it when the date arrives?"

The agent doesn't surface the JSON error. It translates the structured response into a helpful suggestion.

### Interaction Touchpoint

**Zero-touch daily use.** The human talks to the agent. The agent operates EzyForge. The human never opens the dashboard for routine operations.

**Dashboard visits are exceptional:**
- Monthly: glance at the data viewer to spot-check
- Quarterly: review the AI activity log
- Rare: correct an amount the AI can't change

### Trust Moment

**The "I forgot about the dashboard" moment.** The human realizes they haven't opened ezyforge.io in two weeks. Everything they need flows through the agent. The dashboard exists, and knowing it's there is reassuring — but needing it is rare. The AI is the interface. The schema is the enforcement.

---

## Phase 5: Schema Evolution

### Human Experience

After weeks of use, the human realizes the schema doesn't quite fit their life. They need to evolve it.

**Path A: AI proposes it (primary — organic evolution)**

    Agent: I've noticed you mention tips in your notes pretty often —
           "lunch RM 15 + tip RM 3", "coffee RM 8 + tip RM 2".
           Should I propose adding a "tip" field to your expenses schema?
           It would be a decimal field, optional, that tracks tips
           separately from the base amount.

    Human: Yeah, good idea. Do it.

    Agent: I've submitted a schema change proposal:
           + Field: "tip" (decimal, optional, min: 0)
           + Rule: tip must be less than amount
           + AI permission: writable on create, not updatable after

           You'll need to approve this in the dashboard or reply
           "approve" here. Want me to walk you through the changes first?

    Human: Approve.

    Agent: Schema updated! I now have the "tip" field available.
           From now on I can log tips separately. Your existing
           expenses are unaffected — tip will be null for old records.

**Path B: Human edits directly (secondary — intentional redesign)**

1. Dashboard → Schema Editor
2. Human adds a "payment_method" enum field (cash, card, e-wallet)
3. Validation runs in real-time: green checkmark, preview shows updated tools
4. Click "Deploy" → new schema version created
5. Agent's tools update on next call — `create_expense` now accepts `payment_method`

**The approval flow (when schema is locked):**

For production apps or locked schemas, changes go through an approval queue:

1. Agent submits proposal via API
2. Human receives notification (dashboard badge, email, or agent tells them)
3. Dashboard shows: diff view (old schema vs. proposed), which tools change, which rules are added/modified
4. Human clicks "Approve" or "Reject" with optional comment
5. If approved → schema version incremented, tools regenerated
6. Agent receives updated tools on next MCP call

### Agent Experience

**Detecting patterns that suggest schema evolution:**

The agent notices recurring patterns in user input:
- Repeated mentions of "tip" in the notes field
- User always specifying "cash" or "card" in notes → suggests an enum field
- User asking for data the schema can't query (e.g., "show me all cash payments" when payment method isn't a field)

**Proposing a schema change:**

    → POST /api/apps/abc-123/proposals
    {
      "description": "Add tip field to expense entity",
      "changes": [
        {
          "type": "add_field",
          "entity": "expense",
          "field": {
            "name": "tip",
            "type": "decimal",
            "required": false,
            "min": 0
          }
        },
        {
          "type": "add_rule",
          "entity": "expense",
          "rule": {
            "name": "tip_less_than_amount",
            "when": "before_create",
            "condition": "tip != null and tip >= amount",
            "action": "reject",
            "message": "Tip cannot be greater than or equal to the expense amount"
          }
        },
        {
          "type": "update_permissions",
          "entity": "expense",
          "ai_permissions": {
            "create": { "allowed_fields": ["date", "amount", "currency", "merchant", "category", "notes", "tip"] },
            "update": { "allowed_fields": ["notes", "category"] }
          }
        }
      ]
    }

    ← Response:
    {
      "proposal_id": "prop-007",
      "status": "pending_approval",
      "submitted_at": "2026-03-18T14:22:00Z",
      "approval_url": "https://ezyforge.io/app/abc-123/proposals/prop-007"
    }

**Waiting for approval:**

The agent cannot force a schema change. It submits a proposal and waits.

    # Agent checks proposal status (polling or webhook notification):
    → GET /api/apps/abc-123/proposals/prop-007

    ← { "status": "approved", "approved_at": "2026-03-18T14:25:00Z" }

**Receiving updated tools:**

After approval, the agent's next MCP tool list includes the new field:

    create_expense now accepts:
      tip: { type: "number", minimum: 0, description: "Tip amount (optional)" }

The agent can immediately use it:

    → create_expense({
        date: "2026-03-18",
        amount: 15.00,
        tip: 3.00,
        merchant: "Restaurant",
        category: "food"
      })

### Interaction Touchpoint

Schema evolution is the highest-trust interaction. The AI proposes, the human approves. The approval is explicit and logged. The human always has the final word on schema changes — the AI is an advisor, not an authority.

### Trust Moment

**The "it noticed" moment.** The agent proactively suggested a useful schema change based on observed patterns. The human didn't have to think about data modeling — the agent did it and asked permission. This is the moment the platform feels like it's working *for* you, not just *storing* for you.

---

## Phase 6: Growth & Multiple Apps

### Human Experience

After the expense tracker proves itself, the human creates a second app.

**Raj's expansion:**

    Human: I need a CRM for my logistics business. Something simple —
           contacts, deals, shipment status.

    Agent: I'll set up the "Simple CRM" template on EzyForge. It includes:
           - Contacts: name, company, email, phone, notes
           - Deals: title, value, stage (lead → negotiation → won/lost), contact
           - AI permissions: I can create and read everything, update specific
             fields, no deletion.

           I can customize it — want to add a shipment_status field to deals?

    Human: Yes, add shipment_status with options: pending, shipped,
           delivered, returned.

    Agent: Done! Your CRM is live as a separate app with its own
           MCP endpoint. I now operate two apps:
           1. Jazz's Expenses — expense tracking
           2. Raj Logistics CRM — contacts and deals

           When you mention expenses, I'll use the expense app.
           When you mention contacts or deals, I'll use the CRM.

**Managing multiple apps from the dashboard:**

The dashboard now shows:

    ┌──────────────────────────────────────────────┐
    │  Your Apps                                    │
    │                                               │
    │  📊 Jazz's Expenses        3 tools  v2  🟢   │
    │     Last activity: 2 hours ago                │
    │                                               │
    │  👥 Raj Logistics CRM      5 tools  v1  🟢   │
    │     Last activity: just now                   │
    │                                               │
    │  [+ New App]                                  │
    └──────────────────────────────────────────────┘

Each app has independent:
- Schema and version history
- MCP endpoint and tokens
- Encryption keys (per-app envelope encryption)
- AI permissions and rules
- Audit log

**Managing AI access:**

The human controls which agents access which apps:

    Dashboard → Raj Logistics CRM → Tokens
    ┌────────────────────────────────────────────────┐
    │  AI Tokens                                      │
    │                                                 │
    │  🤖 OpenClaw (Jazz)     Full access    Active   │
    │     Created: Mar 18 · Last used: 5 min ago      │
    │     [Revoke]                                     │
    │                                                 │
    │  🤖 Team Assistant       Read-only     Active   │
    │     Created: Mar 20 · Last used: 1 hour ago     │
    │     [Revoke]                                     │
    │                                                 │
    │  [+ Create Token]                                │
    └────────────────────────────────────────────────┘

Different tokens can have different permission scopes — Jazz's AI gets full CRUD, the team assistant only gets read access.

### Agent Experience

**Operating across multiple apps:**

The agent maintains separate tool sets per app and routes based on context:

    # User says "Log lunch RM 15" → route to expenses app
    → MCP(mcp.ezyforge.io/app/abc-123): create_expense({ ... })

    # User says "Add a new contact: Acme Corp" → route to CRM app
    → MCP(mcp.ezyforge.io/app/def-456): create_contact({ ... })

    # User says "How much did I spend on Acme this month?" → cross-reference
    → MCP(expenses): list_expenses({ filter: { merchant: "Acme*", date: { gte: "2026-03-01" } } })
    → MCP(crm): get_contact({ company: "Acme Corp" })
    → Agent synthesizes: "You spent RM 340 at Acme Corp locations this month,
       across 6 transactions. Your deal with Acme (Stage: Negotiation, Value: RM 50K)
       is still open."

**Understanding different schemas per app:**

Each app exposes different tools. The agent never confuses them:
- Expenses app: `create_expense`, `list_expenses`, `update_expense`
- CRM app: `create_contact`, `list_contacts`, `update_contact`, `create_deal`, `list_deals`, `update_deal`

Different rules, different permissions, different enums. The schema isolation is total.

**Creating new apps on behalf of human:**

    → POST /api/apps
    {
      "template": "crm",
      "name": "Raj Logistics CRM",
      "customizations": {
        "entities": {
          "deal": {
            "fields": {
              "shipment_status": {
                "type": "enum",
                "values": ["pending", "shipped", "delivered", "returned"],
                "default": "pending"
              }
            }
          }
        }
      }
    }
    ← Response: { app_id: "def-456", mcp_endpoint: "mcp.ezyforge.io/app/def-456", ... }

### Interaction Touchpoint

The human decides which apps to create and who gets access. The agent operates within each app's permissions independently. The dashboard becomes a management console — not for daily data operations, but for governance: tokens, access, audit.

### Trust Moment

**The "it keeps them separate" moment.** The human realizes that CRM data and expense data are completely isolated — different encryption keys, different permissions, different audit logs. An AI with an expense token literally cannot access CRM data. The isolation is architectural, not logical.

---

## Phase 7: Trust & Governance

### Human Experience

After weeks or months of use, the human's relationship with the platform matures from "does it work?" to "can I trust it at scale?"

**Reviewing the audit log:**

    Dashboard → Jazz's Expenses → AI Activity

    ┌─────────────────────────────────────────────────────────────────┐
    │  AI Activity Log                                  [Export CSV]  │
    │                                                                 │
    │  Mar 18, 14:22  create_expense    ✅ Success                   │
    │    Agent: OpenClaw · McDonald's RM 15.00                        │
    │                                                                 │
    │  Mar 18, 14:25  create_expense    ❌ Rule Violation             │
    │    Agent: OpenClaw · Nando's RM 45.00                           │
    │    Rule: no_future_dates · Date: 2026-03-23                     │
    │                                                                 │
    │  Mar 18, 14:28  update_expense    ⚠️ Permission Denied         │
    │    Agent: OpenClaw · Attempted: amount → 12.00                  │
    │    Denied: 'amount' not in allowed_fields                       │
    │                                                                 │
    │  Mar 18, 14:30  create_expense    ✅ Success                   │
    │    Agent: OpenClaw · Starbucks RM 8.50                          │
    │                                                                 │
    │  [Show 82 more entries...]                                      │
    └─────────────────────────────────────────────────────────────────┘

The human sees every AI action — successes, failures, rule violations, permission denials. Nothing is hidden. The rule violations and denials are *proof* that the system works — they're features, not bugs.

**Reviewing the schema proposal queue:**

    Dashboard → Jazz's Expenses → Proposals

    ┌─────────────────────────────────────────────────────────────────┐
    │  Schema Proposals                                               │
    │                                                                 │
    │  #007  Add "tip" field                    ✅ Approved (Mar 18)  │
    │  #008  Add "payment_method" enum          ⏳ Pending            │
    │                                                                 │
    │  Proposal #008:                                                 │
    │  + Field: payment_method (enum: cash, card, e-wallet)           │
    │  + AI permission: writable on create, updatable after           │
    │  + No new rules                                                 │
    │                                                                 │
    │  Tools affected: create_expense (new param), update_expense     │
    │  (new param)                                                    │
    │                                                                 │
    │  [Approve]  [Reject]  [Comment]                                 │
    └─────────────────────────────────────────────────────────────────┘

**Locking the schema for stability:**

    Human: Lock the expenses schema. No more changes for now.

    Agent: Done. The expenses schema (v3) is now locked. I can't
           propose changes until you unlock it. All existing tools
           continue to work as before.

Or via dashboard: Schema → Settings → Toggle "Lock Schema" → Confirm

Once locked:
- No schema proposals can be submitted
- No fields, rules, or permissions can be changed
- All CRUD operations continue normally
- Only the owner can unlock

**Exporting data:**

    Dashboard → Jazz's Expenses → Settings → Export Data

    Format: [JSON ▼]  Period: [All Time ▼]  [Export]

    → Downloads expenses_export_2026-03-18.json
    (decrypted client-side, never touches EzyForge servers in plaintext)

The human owns their data. They can export it anytime, in standard formats, with full history. No lock-in.

**Revoking an AI token:**

    Dashboard → Jazz's Expenses → Tokens → [Revoke]

    "Token revoked. This AI agent can no longer access your
     expenses app. Active sessions will be terminated."

One click. Instant. The revoked agent's next MCP call returns `401 Unauthorized`. No grace period, no "are you sure" — immediate.

### Agent Experience

**Operating within a locked schema:**

When the schema is locked, the agent's tools remain unchanged — it can still create, read, and update. But:

    # Agent tries to propose a schema change:
    → POST /api/apps/abc-123/proposals
    {
      "description": "Add receipt_url field",
      "changes": [...]
    }

    ← Response:
    {
      "success": false,
      "error": {
        "type": "schema_locked",
        "message": "Schema is locked. Changes cannot be proposed until the owner unlocks it.",
        "locked_at": "2026-03-18T16:00:00Z",
        "locked_by": "owner"
      }
    }

The agent tells the human:

    "Your expenses schema is locked, so I can't propose changes
     right now. If you'd like to add new fields, you'll need
     to unlock it first in the dashboard."

**Full audit logging:**

Every MCP call the agent makes is logged server-side:

    {
      "timestamp": "2026-03-18T14:22:00Z",
      "app_id": "abc-123",
      "token_id": "tok-001",
      "agent_identity": "OpenClaw/Jazz",
      "tool": "create_expense",
      "input": { "date": "2026-03-18", "amount": 15.00, "merchant": "McDonald's", ... },
      "result": "success",
      "record_id": "exp-001",
      "schema_version": 3,
      "rules_evaluated": ["no_future_dates", "positive_amount"],
      "rules_triggered": [],
      "permissions_checked": ["create:expense"],
      "execution_ms": 45
    }

The agent cannot see its own audit log (it's not a tool). Only the human can review it — through the dashboard, decrypted client-side.

**Token revocation — instant disconnection:**

    # Agent's next MCP call after token revocation:
    → create_expense({ ... })

    ← HTTP 401:
    {
      "error": "token_revoked",
      "message": "This token has been revoked by the app owner."
    }

The agent loses all access immediately. It should inform the human:

    "I've lost access to your expenses app — looks like the token
     was revoked. If this was intentional, no action needed. If not,
     you can create a new token from the dashboard."

### Interaction Touchpoint

Governance is the human's domain. The agent operates; the human governs. The touchpoints are:
- **Audit review** — human reviews what the agent did (dashboard)
- **Schema lock/unlock** — human controls when evolution is allowed
- **Token management** — human controls which agents have access
- **Data export** — human extracts their data at any time
- **Proposal review** — human approves or rejects schema changes

The agent never governs itself. It can request (propose changes, request access), but it cannot approve.

### Trust Moment

**The "I can see everything" moment.** The human opens the audit log and sees every single AI action — including the ones that were denied. The denied actions are the most important: they prove the rules work. The human sees that the system blocked a future date, rejected an amount change, and prevented a deletion. The enforcement isn't theoretical — it's logged and visible.

**The "even you can't read my data" moment.** The human asks "Can EzyForge engineers see my expenses?" The answer is no — and it's not a policy, it's the architecture. The data is encrypted with the human's key. The audit log is encrypted with the human's key. Even the EzyForge team sees ciphertext.

---

## Summary: The Two Journeys

| Phase | Human Does | Agent Does |
|-------|-----------|------------|
| **1. Discovery** | Signs up, creates encryption key | Gets configured, connects to MCP |
| **2. App Creation** | Chooses template, approves deployment | Creates app via API, receives tools |
| **3. Onboarding** | Tests boundaries (5-10 interactions) | Discovers capabilities and limitations |
| **4. Daily Ops** | Natural language commands | MCP tool calls, error translation |
| **5. Schema Evolution** | Approves/rejects proposals | Detects patterns, proposes changes |
| **6. Growth** | Creates new apps, manages access | Operates across multiple schemas |
| **7. Governance** | Reviews audit log, locks schema, exports data | Operates within constraints, logged fully |

**The pattern across all phases:**

> The human decides **what** the system does. The agent decides **how** to operate within those boundaries. The schema enforces the rules. The platform enforces the encryption. Trust is built through transparency, boundaries, and the knowledge that the rules can't be broken — by the AI, by the platform, or by anyone without the encryption key.

---

## Appendix: The Dogfood Test as Journey

Jazz's complete journey, compressed:

1. **Signs up** at ezyforge.io → master key derived from password → recovery phrase saved
2. **Tells OpenClaw:** "Set up an expense tracker on EzyForge" → app created, tools provisioned
3. **Logs first expense:** "Lunch at McDonald's, RM 15" → `create_expense` → success
4. **Tests deletion:** "Delete that expense" → agent says "I don't have a delete tool"
5. **Tests amount change:** "Change amount to 0" → permission denied, amount not in allowed_fields
6. **Tests future date:** "Log a meal for next Friday" → rule violation, no_future_dates
7. **Uses it daily** for 2 weeks → never opens dashboard
8. **Agent proposes** a "tip" field → Jazz approves → schema v2 deployed
9. **Creates CRM app** for logistics business → separate schema, separate encryption
10. **Reviews audit log** → sees every AI action including denied attempts
11. **Locks expenses schema** → production stability, no more changes
12. **Asks:** "Can EzyForge engineers see my data?" → **"No. We literally can't."**

Every step tested. Every boundary proven. That's the product.
