You are a senior product designer and systems architect. Read these docs first:
- docs/NORTH-STAR.md
- docs/PROBLEM.md
- docs/ARCHITECTURE.md
- docs/FEATURES.md
- docs/MVP-1.0.md
- docs/USER-JOURNEY.md

## Context

EzyForge is an agentic-first cloud platform. Users define business apps via YAML schema. AI agents operate on the data via MCP. The schema defines entities, rules, and AI permissions.

The founder wants to deeply think through TWO things:
1. What should the business app editor look like?
2. How comprehensive should the YAML schema format be to cover real business apps?

## Task 1: Business App Editor — Research & Design

Research how the best schema/app editors work, then design EzyForge's editor.

### Research These Editors
Search the web and analyze:
- **Airtable** — how do they let users define tables, fields, views?
- **Notion databases** — how do they let users add properties, relations?
- **Retool** — how do they build internal tools visually?
- **Baserow** — open source Airtable, how does their field editor work?
- **Directus** — how do they let you configure collections and fields?
- **Supabase Table Editor** — how do they present schema editing?
- **Frappe/ERPNext** — how do DocType editors work?
- **Payload CMS** — how do collection configs look in their admin?
- **Budibase** — their data section and schema editor
- **Appsmith** — their datasource + query builder

For each:
- What works well? (UX patterns to steal)
- What sucks? (UX patterns to avoid)
- How do non-developers use it?
- How do developers use it?

### Design the EzyForge Editor

Design TWO editor modes:

**Mode A: Visual Editor (for non-developers like Raj)**
- How does creating an entity look?
- How does adding a field look? (type selector, constraints, descriptions)
- How do business rules look visually? (not raw YAML)
- How do AI permissions look? (toggle switches? checkboxes?)
- How does the approval flow look when AI proposes a change?

**Mode B: YAML Editor (for developers like Marcus/Ava)**
- Monaco editor with syntax highlighting
- Schema validation in real-time (red underlines on errors)
- Auto-complete for field types, rule hooks, permission options
- Preview pane: "these MCP tools will be generated"

Design the TRANSITION between modes:
- Visual editor generates YAML underneath
- YAML editor can switch to visual view
- Both always in sync

Sketch the editor layouts in ASCII art. Show the key screens:
1. Entity list view
2. Single entity editor (fields + rules + permissions)
3. Rule builder
4. AI permissions configurator
5. Schema diff view (before/after changes)
6. Tool preview (what MCP tools will be generated)

## Task 2: YAML Schema Format — Comprehensive Design

The current YAML format covers basics (entities, fields, rules, permissions). But real business apps need more.

### Research What Real Business Apps Need
Think about these 10 real apps and what their YAML schemas would need:

1. **Personal Expenses** (the dogfood app)
2. **CRM** (contacts, companies, deals, pipeline)
3. **Appointment Booking** (services, availability, bookings)
4. **Invoice / Billing** (customers, invoices, line items, payments)
5. **Inventory Management** (products, stock, orders, suppliers)
6. **Project Management** (projects, tasks, members, time tracking)
7. **HR / Leave Management** (employees, leave requests, approvals)
8. **Real Estate Listings** (properties, agents, inquiries, viewings)
9. **Restaurant Orders** (menu items, orders, tables, reservations)
10. **Subscription Management** (plans, customers, subscriptions, usage)

For each: what schema features are needed that we DON'T currently support?

### Design the Extended YAML Format
Based on the research, design a COMPREHENSIVE YAML schema format that covers:

**Entities & Fields (current)**
- All field types needed
- Computed fields
- Field groups / sections (for UI organization)

**Relationships (missing)**
- belongs_to, has_many
- How they appear in YAML
- How MCP tools handle them (nested queries, related data)

**Workflows / State Machines (missing)**
- State field with valid transitions
- Who can trigger each transition (owner, staff, AI)
- Actions on transition (send notification, update related entity)

**Automations / Triggers (missing)**
- When X happens, do Y
- Scheduled rules (every Monday, check overdue invoices)
- Cross-entity triggers (when invoice is paid, update customer balance)

**Views / Queries (missing)**
- Named queries ("overdue invoices", "this month's expenses")
- Dashboard widgets (total, count, recent list)
- How AI uses named queries as tools

**Notifications (missing)**
- When to notify the owner
- Channels: email, webhook, in-app
- Templates

**Multi-user / Roles (missing from MVP)**
- Custom roles beyond owner and AI
- Per-role permissions at entity and field level
- How team members get tokens

**Integrations (future)**
- Webhook on events
- Connect to external APIs
- Import/sync from other sources

### Show 3 Complete Schema Examples
Write full YAML schemas for:
1. Personal Expenses (simple — validate current format works)
2. CRM (medium — tests relationships, pipeline workflow, roles)
3. Invoice/Billing (complex — tests computed fields, automations, multi-entity rules)

Each should be realistic, not toy examples. Show features that work in 1.0 vs features marked as future.

## Output

Save to: /mnt/d/openclaw-workspace/projects/ezybusiness/docs/EDITOR-AND-SCHEMA-DESIGN.md

When done:
openclaw system event --text "Done: EzyForge editor design and comprehensive schema format ready" --mode now
