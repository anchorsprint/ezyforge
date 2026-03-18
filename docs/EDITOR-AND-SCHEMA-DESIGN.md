# EzyForge — Business App Editor & Comprehensive Schema Design

> **Purpose:** Deep design document covering (1) how the business app editor should work across two modes, and (2) a comprehensive YAML schema format that can model real business applications.

---

## Part 1: Editor Research — What the Best Platforms Do

We analyzed 10 platforms that let users define data models and build apps. Here are the key findings.

### Platform-by-Platform Analysis

#### Airtable — The Gold Standard for Non-Developers
- **Entry point:** Spreadsheet grid. Click "+" on column header → field type picker with icons and descriptions.
- **Views:** Grid, Kanban, Calendar, Gallery, Form — saved presets per table.
- **What works:** Spreadsheet-as-entry-point is universally understood. Inline field creation from the grid header. Field Manager shows dependencies before deleting. Interface Designer lets non-devs build dashboards.
- **What fails:** Relational concepts (linked records, lookups, rollups) require a major conceptual leap. Proprietary formula language. Schema changes are live and immediate — no staging. No schema-as-code story.

#### Notion Databases — Lowest Friction Property Adding
- **Entry point:** Any page becomes a database. Properties added via "+" dropdown.
- **What works:** Relation/Rollup pattern is surprisingly intuitive (three-step wizard). Views as tabs. Database lives inside documents — schema is contextualized alongside narrative.
- **What fails:** No field validation, required fields, or constraints. Performance degrades past 1000 rows. Formulas are limited. No schema versioning.

#### Retool — Developer IDE for Internal Tools
- **Entry point:** Three-panel layout (component tree, canvas, inspector). SQL queries in bottom panel.
- **What works:** IDE-like layout developers instantly understand. `{{ }}` binding syntax. Auto-generation from database tables. 100+ production-quality components.
- **What fails:** Not for non-developers at all. No schema editor — consumes existing schemas only. Vendor lock-in.

#### Baserow — Open Source Airtable
- **Entry point:** Spreadsheet grid, 25+ field types with focused config panels.
- **What works:** Clean Airtable-like UX. Double-click header to edit. Open-source, API-first.
- **What fails:** Application Builder still in beta. Limited UI customization beyond the spreadsheet paradigm.

#### Directus — Best Separation of Data Type from Presentation
- **Entry point:** Settings > Data Model. Each field has a type, interface, display, and layout options.
- **What works:** Interface system is excellent — a string field can render as text input, WYSIWYG, or code editor. Field width (half/full/fill). Visual relationship config. Conditional fields, field grouping.
- **What fails:** Data Model config is separate from content editing (context-switching). Exposes database concepts (foreign keys, junction tables) to non-devs.

#### Supabase Table Editor — Postgres Made Friendly
- **Entry point:** Spreadsheet-like editor + SQL Editor + Visual Schema Designer (ER diagrams).
- **What works:** Real Postgres through friendly UI. AI SQL Editor (natural language → SQL). Dual-mode: spreadsheet for simple edits, SQL for complex. Drag-and-drop schema design.
- **What fails:** Exposes raw Postgres types (`int4`, `timestamptz`). No schema versioning in UI. RLS requires SQL.

#### Frappe/ERPNext — DocType = Schema + Form + API + Permissions
- **Entry point:** DocType form with row-by-row field editor. Newer Form Builder adds drag-and-drop.
- **What works:** DocType is schema + form + API + permissions in one definition. Customize Form lets non-devs modify without touching core. Rich business field types (Currency, Link, Table, Attach, Signature).
- **What fails:** Layout defined as special field types (Section Break, Column Break) — mixes data with presentation. Developer mode gating. Steep framework learning curve.

#### Payload CMS — Code-First Gold Standard
- **Entry point:** TypeScript config files. Admin panel auto-generated from code.
- **What works:** Full TypeScript typing with IDE autocomplete. Schema in Git — diffable, version-controlled. Per-field access control functions. Hooks at data layer. Custom React components for any admin UI element.
- **What fails:** No visual schema editor at all. Non-developers cannot participate. Requires Next.js dev environment.

#### Budibase — AI-Powered Table Generation
- **Entry point:** Data section with table editor. Visual app builder with drag-and-drop.
- **What works:** Auto-generation from existing databases. AI table generation from natural language. Visual automation builder (flowchart-style). Zero-config built-in database.
- **What fails:** Built-in DB is limited. Apps look similar. Less flexible than Retool for complex logic.

#### Appsmith — Developer-Focused with Visual Query Builder
- **Entry point:** Connect datasource → write queries → drag widgets to canvas.
- **What works:** Visual query builder abstracts SQL. Auto-generation of CRUD queries. JSONForm auto-generates from schema. Git integration.
- **What fails:** Steep learning curve. No schema creation/editing. Property pane has too many options (cognitive overload).

### Synthesis: Patterns to Adopt vs. Avoid

**Adopt These Patterns:**

| Pattern | Source | Why |
|---------|--------|-----|
| Spreadsheet-as-entry-point | Airtable, Baserow, Supabase | Universal familiarity, zero onboarding |
| Inline "+" to add fields from header | Airtable, Baserow | Minimal context-switching |
| Field type picker with icons + descriptions | Airtable, Baserow, Directus | Makes types discoverable |
| Separate data type from presentation | Directus | Same field, different rendering contexts |
| Code-first config with auto-generated UI | Payload CMS | Best DX — schema in Git, typed, diffable |
| Visual relationship mapping / ER diagrams | Supabase, Directus | Spatial understanding of data model |
| Views as saved presets per table | Airtable, Baserow, Notion | Different stakeholders, same data |
| AI-powered schema generation | Supabase, Budibase | Natural language bridges the skill gap |
| Dual-mode (visual + code) | Supabase | Users graduate naturally from visual to code |
| Non-destructive customization layer | Frappe | Safe modifications without touching core |

**Avoid These Anti-Patterns:**

| Anti-Pattern | Source | Why It Fails |
|-------------|--------|-------------|
| Live schema changes, no staging | Airtable, Supabase | Risky for production data |
| Proprietary formula languages | Airtable, Notion | Cannot transfer knowledge |
| Layout mixed with data fields | Frappe | Section Break as "field type" is confusing |
| Raw database types exposed | Supabase | `int4` vs `timestamptz` overwhelms non-devs |
| No visual editor at all | Payload, Retool | Locks out non-developers |
| Too many options in property panes | Appsmith | Cognitive overload |
| No schema-as-code story | Airtable, Notion | No versioning, no Git, no diffing |

---

## Part 2: EzyForge Editor Design

### Design Philosophy

EzyForge's editor must serve two users simultaneously:

1. **Raj** (business owner) — thinks in business terms: "I need a field for invoice amount." Doesn't know YAML. Needs visual, guided editing.
2. **Marcus/Ava** (developers) — thinks in schema terms: "I need a `decimal` field with `min: 0`, `precision: 2`, and a `before_create` rule." Wants raw YAML with autocomplete.

**The key insight from research:** The best platforms offer dual-mode editing where both modes stay in sync. Supabase's spreadsheet-UI-plus-SQL-editor is the closest precedent. EzyForge does this with Visual Editor + YAML Editor, both reading/writing the same schema.

### Mode A: Visual Editor (for Raj)

#### Screen 1: Entity List View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  My Expenses App                                        Schema v3  🔒  │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Entities                                              [+ New Entity]   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  📋 expense                                                       │  │
│  │  8 fields · 3 rules · AI: create, read, update (2 fields)        │  │
│  │  Last modified: 2 days ago                                        │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │  📋 budget                                                        │  │
│  │  5 fields · 1 rule · AI: create, read                             │  │
│  │  Last modified: 1 week ago                                        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Relationships                                                    │  │
│  │                                                                   │  │
│  │  expense ──belongs_to──▶ budget                                   │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  MCP Tools Preview                         [View Full Tool Defs]  │  │
│  │                                                                   │  │
│  │  ✅ create_expense    ✅ list_expenses    ✅ update_expense       │  │
│  │  ✅ create_budget     ✅ list_budgets     ✅ get_budget           │  │
│  │  ❌ delete_expense    ❌ delete_budget    (disabled by schema)    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [View YAML]  [Deploy Changes]  [Diff from Last Version]               │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Entity cards show a **summary** — field count, rule count, AI permission summary — so Raj sees the shape without opening each entity.
- **Relationship diagram** is inline, not buried in settings. Uses simple arrow notation, not full ER diagrams.
- **MCP Tools Preview** shows exactly what tools exist. Red/disabled tools show what's intentionally blocked. This is the trust signal — Raj can see that `delete_expense` doesn't exist.
- **View YAML** button transitions to Mode B. Always accessible, never forced.

#### Screen 2: Single Entity Editor (Fields + Rules + Permissions)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Entities          expense                    [Save] [Undo]  │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Fields    Rules    AI Permissions    Workflow    Views                  │
│  ━━━━━━                                                                 │
│                                                                         │
│  Fields                                                  [+ Add Field]  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  🔑 id            uuid        auto-generated                      │ │
│  │  📅 date          date        required                            │ │
│  │  💰 amount        decimal     required · min: 0.01 · precision: 2 │ │
│  │  🏷️ currency      enum        MYR, USD, SGD · default: MYR        │ │
│  │  🏪 merchant      string      required · max: 200                 │ │
│  │  📂 category      enum        food, transport, utilities, ...     │ │
│  │  📝 notes         text        optional · max: 1000                │ │
│  │  💳 payment_method enum       cash, card, e-wallet                │ │
│  │  🕐 created_at    datetime    auto-generated                      │ │
│  │  🕐 updated_at    datetime    auto-generated                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Click any field to edit. Drag to reorder.                              │
└─────────────────────────────────────────────────────────────────────────┘
```

**Clicking a field opens an inline editor panel:**

```
┌────────────────────────────────────────────────────────────────────────┐
│  Edit Field: amount                                                    │
│  ──────────────────────────────────────────────────────────────────    │
│                                                                        │
│  Label        [Amount                    ]                             │
│  Name (key)   [amount                    ]  (auto from label)          │
│  Description  [How much was spent        ]  (shown to AI in tools)     │
│                                                                        │
│  Type         [Decimal  ▼]                                             │
│               ┌──────────────────────────┐                             │
│               │ 📝 String                │                             │
│               │ 🔢 Integer               │                             │
│               │ 💰 Decimal  ←            │                             │
│               │ ☑️  Boolean               │                             │
│               │ 📅 Date                  │                             │
│               │ 🕐 DateTime              │                             │
│               │ 🏷️ Enum                  │                             │
│               │ 📄 Text (long)           │                             │
│               │ 🔗 URL                   │                             │
│               │ 📧 Email                 │                             │
│               │ 🆔 UUID                  │                             │
│               │ 💵 Currency              │                             │
│               │ 📎 File                  │                             │
│               └──────────────────────────┘                             │
│                                                                        │
│  ┌─ Constraints ──────────────────────────────────────────────────┐    │
│  │  ☑ Required                                                    │    │
│  │  Minimum   [0.01        ]                                      │    │
│  │  Maximum   [             ]  (leave blank for no max)           │    │
│  │  Precision [2            ]  decimal places                     │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  [Delete Field]                                     [Done]             │
└────────────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- **Type picker uses icons + business-friendly names.** Not `int4` or `timestamptz`. "Decimal" not "float64". "Currency" is a first-class type that bundles amount + currency code.
- **Description field** is prominently placed because it goes directly into MCP tool definitions. This is how the AI understands the field.
- **Constraints** are toggles and inputs, not code. "Required" is a checkbox. "Minimum" is a number input.

#### Screen 3: Rule Builder

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Entities          expense                    [Save] [Undo]  │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Fields    Rules    AI Permissions    Workflow    Views                  │
│            ━━━━━                                                        │
│                                                                         │
│  Business Rules                                          [+ Add Rule]  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  🛑 no_future_dates                                               │ │
│  │  When: Before Create                                              │ │
│  │  If:   date > today()                                             │ │
│  │  Then: REJECT — "Expense date cannot be in the future"            │ │
│  │                                                          [Edit]   │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  🛑 positive_amount                                               │ │
│  │  When: Before Create                                              │ │
│  │  If:   amount <= 0                                                │ │
│  │  Then: REJECT — "Amount must be positive"                         │ │
│  │                                                          [Edit]   │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  🏷️ auto_tag_weekend                                              │ │
│  │  When: Before Create                                              │ │
│  │  If:   day_of_week(date) IN ["Saturday", "Sunday"]                │ │
│  │  Then: TAG weekend=true                                           │ │
│  │                                                          [Edit]   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Clicking [+ Add Rule] or [Edit] opens the rule builder:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Edit Rule: no_future_dates                                            │
│  ──────────────────────────────────────────────────────────────────    │
│                                                                         │
│  Rule Name   [no_future_dates            ]                              │
│                                                                         │
│  When does this rule run?                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Before Create│ │ Before Update│ │ After Create │ │ After Update │  │
│  │     ✅       │ │              │ │              │ │              │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                         │
│  Condition (when should it trigger?)                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [date    ▼]  [>    ▼]  [today()  ▼]                           │   │
│  │                                                                 │   │
│  │  + Add another condition (AND / OR)                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Or write the condition directly:                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  date > today()                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  What happens when the condition is true?                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  🛑 Reject   │ │  ⚠️ Warn     │ │  🏷️ Tag      │ │  ✏️ Set Field│  │
│  │     ✅       │ │              │ │              │ │              │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                         │
│  Rejection message:                                                     │
│  [Expense date cannot be in the future                              ]   │
│                                                                         │
│  [Delete Rule]                                          [Done]          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- **Dual input for conditions:** Dropdowns for guided building (field → operator → value) AND a raw text input for typing expressions directly. Non-devs use dropdowns; developers type directly. Both produce the same expression.
- **Action picker is visual cards** — Reject, Warn, Tag, Set Field — not a dropdown. The icon + color makes the severity obvious.
- Lifecycle hooks are **visual toggle cards**, not a dropdown. Raj sees "Before Create" and "Before Update" and clicks one or both.

#### Screen 4: AI Permissions Configurator

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Entities          expense                    [Save] [Undo]  │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Fields    Rules    AI Permissions    Workflow    Views                  │
│                     ━━━━━━━━━━━━━━━                                     │
│                                                                         │
│  What can the AI agent do with expenses?                                │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  Operation       Allowed    Impact on MCP Tools                   │ │
│  │  ───────────     ────────   ─────────────────────────             │ │
│  │  Create          [✅ ON ]   → create_expense tool generated       │ │
│  │  Read            [✅ ON ]   → list_expenses, get_expense tools    │ │
│  │  Update          [✅ ON ]   → update_expense tool generated       │ │
│  │  Delete          [❌ OFF]   → NO delete tool (eliminated)         │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Update — Which fields can the AI modify?                               │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Field            AI Can Update?    Why                           │ │
│  │  ─────            ──────────────    ─────────────────────         │ │
│  │  date             [❌ Locked  ]     Immutable after creation      │ │
│  │  amount           [❌ Locked  ]     Financial data — human only   │ │
│  │  currency         [❌ Locked  ]     Immutable after creation      │ │
│  │  merchant         [❌ Locked  ]     Immutable after creation      │ │
│  │  category         [✅ Allowed ]     AI can recategorize           │ │
│  │  notes            [✅ Allowed ]     AI can add context            │ │
│  │  payment_method   [❌ Locked  ]     Immutable after creation      │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ★ Insight ─────────────────────────────────────────────                │
│  │ When Delete is OFF, no delete tool is generated. The AI cannot     │ │
│  │ be tricked into deleting because the capability doesn't exist.     │ │
│  │ This is elimination, not mitigation.                               │ │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- **Toggle switches, not checkboxes.** ON/OFF is unambiguous. Green = allowed, red = blocked.
- **Impact column** shows what each toggle does to the MCP tool surface. Raj sees "→ NO delete tool (eliminated)" and understands the security model.
- **Field-level update permissions** show each field with a toggle. The "Why" column encourages documenting the reasoning — this becomes part of the schema.
- **Inline insight** explains the security model in plain language.

#### Screen 5: Schema Diff View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Schema Changes — v3 → v4 (draft)                                      │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌───────────────────────────── DIFF ─────────────────────────────────┐ │
│  │                                                                     │ │
│  │  expense:                                                           │ │
│  │    fields:                                                          │ │
│  │      ...existing fields...                                          │ │
│  │  +   tip:                                                           │ │
│  │  +     type: decimal                                                │ │
│  │  +     required: false                                              │ │
│  │  +     min: 0                                                       │ │
│  │  +     description: "Tip amount (optional)"                         │ │
│  │                                                                     │ │
│  │    rules:                                                           │ │
│  │      ...existing rules...                                           │ │
│  │  +   tip_less_than_amount:                                          │ │
│  │  +     when: before_create                                          │ │
│  │  +     condition: "tip != null AND tip >= amount"                   │ │
│  │  +     action: reject                                               │ │
│  │  +     message: "Tip cannot exceed the expense amount"              │ │
│  │                                                                     │ │
│  │    ai_permissions:                                                  │ │
│  │      create:                                                        │ │
│  │  -     allowed_fields: [date, amount, currency, ...]               │ │
│  │  +     allowed_fields: [date, amount, currency, ..., tip]          │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Tool Impact:                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  create_expense  →  +1 new parameter: tip (decimal, optional)   │   │
│  │  update_expense  →  no change (tip not in allowed update fields)│   │
│  │  list_expenses   →  tip included in response data               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Reject]  [Request Changes]  [Approve & Deploy]                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- **Git-style diff** with green (+) and red (-) lines. Developers recognize this instantly. Non-devs see "green = added."
- **Tool Impact section** translates the schema diff into what actually changes for the AI agent. Raj doesn't need to parse YAML diffs — he reads "create_expense gets 1 new parameter."
- **Three actions:** Reject, Request Changes (with comment), Approve & Deploy. Mirrors PR review workflow.

#### Screen 6: Tool Preview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MCP Tool Preview — expense entity                                      │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  These tools are auto-generated from your schema and AI permissions.    │
│  This is exactly what your AI agent sees.                               │
│                                                                         │
│  ┌─ create_expense ──────────────────────────────────────────────────┐ │
│  │  "Create a new expense record"                                     │ │
│  │                                                                    │ │
│  │  Parameters:                                                       │ │
│  │  ├── date*         date        "Expense date (not future)"        │ │
│  │  ├── amount*       number      min: 0.01, precision: 2            │ │
│  │  ├── currency      string      enum: MYR, USD, SGD (default: MYR)│ │
│  │  ├── merchant*     string      max: 200                           │ │
│  │  ├── category*     string      enum: food, transport, ...         │ │
│  │  ├── notes         string      max: 1000                          │ │
│  │  └── payment_method string     enum: cash, card, e-wallet         │ │
│  │                                                * = required        │ │
│  │                                                                    │ │
│  │  Rules enforced: no_future_dates, positive_amount                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ update_expense ──────────────────────────────────────────────────┐ │
│  │  "Update an existing expense. Only notes and category allowed."    │ │
│  │                                                                    │ │
│  │  Parameters:                                                       │ │
│  │  ├── id*           string      "Expense ID to update"             │ │
│  │  ├── notes         string      max: 1000                          │ │
│  │  └── category      string      enum: food, transport, ...         │ │
│  │                                                                    │ │
│  │  ⚠ amount, date, merchant, currency, payment_method: NOT updatable│ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ list_expenses ───────────────────────────────────────────────────┐ │
│  │  "Query expenses with filters, sorting, and aggregation"           │ │
│  │                                                                    │ │
│  │  Filters: any field · Sort: any field · Pagination: limit, offset │ │
│  │  Aggregations: sum, count, avg (group_by any field)               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ❌ delete_expense — NOT GENERATED (delete: false in AI permissions)   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mode B: YAML Editor (for Marcus/Ava)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Schema Editor — YAML                          [Visual Editor] [Deploy] │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌────────────────────────────────┬────────────────────────────────────┐│
│  │  Monaco Editor                 │  Live Preview                      ││
│  │                                │                                    ││
│  │  app:                          │  ✅ Schema valid                   ││
│  │    name: "My Expenses"         │                                    ││
│  │    version: 3                  │  Entities: 2                       ││
│  │                                │  ├── expense (8 fields, 3 rules)  ││
│  │  entities:                     │  └── budget (5 fields, 1 rule)    ││
│  │    expense:                    │                                    ││
│  │      description: "A single   │  MCP Tools: 6                      ││
│  │        expense record"         │  ├── ✅ create_expense             ││
│  │      fields:                   │  ├── ✅ list_expenses              ││
│  │        date:                   │  ├── ✅ update_expense             ││
│  │          type: date            │  ├── ✅ create_budget              ││
│  │          required: true        │  ├── ✅ list_budgets               ││
│  │  ~~~~ red underline ~~~~       │  └── ✅ get_budget                 ││
│  │        amount:                 │                                    ││
│  │          type: decimal         │  ❌ Errors:                        ││
│  │          required: true        │  Line 42: Unknown field type       ││
│  │          min: 0.01             │  "strng" — did you mean "string"?  ││
│  │          precision: 2          │                                    ││
│  │        ...                     │  ⚠ Warnings:                       ││
│  │                                │  Line 78: Rule "no_future_dates"   ││
│  │      rules:                    │  uses today() — ensure timezone    ││
│  │        no_future_dates:        │  is handled.                       ││
│  │          when: before_create   │                                    ││
│  │          condition: ...        │                                    ││
│  │                                │                                    ││
│  │      ai_permissions:           │                                    ││
│  │        create: true            │                                    ││
│  │        read: true              │                                    ││
│  │        update:                 │                                    ││
│  │          allowed_fields:       │                                    ││
│  │            - notes             │                                    ││
│  │            - category          │                                    ││
│  │        delete: false           │                                    ││
│  └────────────────────────────────┴────────────────────────────────────┘│
│                                                                         │
│  Autocomplete: field types, rule hooks, permission options, functions   │
│  Validation: real-time red underlines on errors, yellow on warnings     │
│  Keyboard: Ctrl+Space for suggestions, Ctrl+S to validate              │
└─────────────────────────────────────────────────────────────────────────┘
```

**YAML Editor Features:**
- **Monaco Editor** with EzyForge YAML language support (syntax highlighting, autocomplete, error markers).
- **Live Preview pane** on the right — shows entity summary, MCP tool list, errors, and warnings. Updates on every keystroke (debounced).
- **Autocomplete:** Type `type: ` → dropdown shows all valid field types. Type `when: ` → shows `before_create`, `before_update`, etc. Type `condition: ` → shows available functions (`today()`, `now()`, `day_of_week()`, `contains()`).
- **Inline errors:** Red underlines on invalid YAML (typos in type names, missing required keys, invalid conditions). Error panel on the right shows line number + fix suggestion.
- **Tool preview:** Right pane always shows which MCP tools will be generated from the current schema state.

### Mode Transition: Visual ↔ YAML

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Visual Editor ←──── always in sync ────→ YAML Editor   │
│                                                          │
│   User clicks         YAML auto-generated   User clicks  │
│   [View YAML]    ←──  from visual state  ──→ [Visual]    │
│                                                          │
│   Visual changes       YAML changes parsed               │
│   update YAML          update visual state               │
│   instantly             on switch                        │
│                                                          │
│   Conflict handling:                                     │
│   If YAML has syntax errors, switching to Visual shows   │
│   a warning: "Fix YAML errors before switching views"    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Transition rules:**
1. Visual editor always generates valid YAML. You can switch to YAML anytime.
2. YAML editor may have invalid state (mid-editing). Must be valid to switch to visual.
3. Both modes operate on the same in-memory schema object. Changes in one reflect in the other.
4. A small banner shows which mode was last used: "Last edited in Visual Editor 5 min ago."

---

## Part 3: Comprehensive YAML Schema Format

### Why Extend the Format

The current format supports entities, fields, rules, and AI permissions — enough for a simple expenses app. But real business apps need:

- **Relationships** — every app beyond a single entity needs them (9/10 apps analyzed)
- **State machines** — pipelines, approval flows, order lifecycles (9/10 apps)
- **Computed fields** — totals, balances, percentages, durations (10/10 apps)
- **Named views/queries** — "overdue invoices", "this month's spending" (10/10 apps)
- **Notifications** — event-triggered alerts, reminders, threshold warnings (8/10 apps)
- **Automations** — scheduled checks, cascade updates, auto-record creation (7/10 apps)
- **Multi-user roles** — beyond owner + AI (6/10 apps)

### The Full YAML Schema Format

```yaml
# ═══════════════════════════════════════════════════════════
# EzyForge Schema Format — Comprehensive Reference
# ═══════════════════════════════════════════════════════════

# ─── App Metadata ─────────────────────────────────────────
app:
  name: "My Business App"
  description: "What this app does"
  version: 1                        # auto-incremented on deploy
  locked: false                     # when true, no schema changes allowed
  timezone: "Asia/Kuala_Lumpur"     # default timezone for date functions
  currency: "MYR"                   # default currency

# ─── Entities ─────────────────────────────────────────────
entities:

  expense:
    description: "A single expense record"
    icon: "receipt"                  # optional, for dashboard display

    # ─── Fields ─────────────────────────────────────
    fields:

      # Auto-generated fields (always present)
      id:
        type: uuid
        auto: generate
        description: "Unique identifier"

      created_at:
        type: datetime
        auto: now
        description: "When this record was created"

      updated_at:
        type: datetime
        auto: now_on_update
        description: "When this record was last updated"

      # User-defined fields
      date:
        type: date
        required: true
        description: "When the expense occurred"

      amount:
        type: decimal
        required: true
        min: 0.01
        precision: 2
        description: "Amount spent"

      currency:
        type: enum
        values: [MYR, USD, SGD]
        default: MYR
        description: "Currency code"

      merchant:
        type: string
        required: true
        max_length: 200
        description: "Where the money was spent"

      category:
        type: enum
        values: [food, transport, utilities, entertainment, health, other]
        required: true
        description: "Spending category"

      notes:
        type: text
        required: false
        max_length: 1000
        description: "Optional notes or context"

      payment_method:
        type: enum
        values: [cash, card, e-wallet]
        required: false
        description: "How the expense was paid"

    # ─── Field Groups (UI organization) ─────────────
    field_groups:
      main:
        label: "Expense Details"
        fields: [date, amount, currency, merchant, category]
      metadata:
        label: "Additional Info"
        fields: [notes, payment_method]

    # ─── Rules ──────────────────────────────────────
    rules:

      no_future_dates:
        when: before_create
        condition: "date > today()"
        action: reject
        message: "Expense date cannot be in the future"

      positive_amount:
        when: before_create
        condition: "amount <= 0"
        action: reject
        message: "Amount must be positive"

      auto_tag_weekend:
        when: before_create
        condition: "day_of_week(date) IN ['Saturday', 'Sunday']"
        action: tag
        tag: { weekend: true }

    # ─── AI Permissions ─────────────────────────────
    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [notes, category]
      delete: false

# ═══════════════════════════════════════════════════════════
# EXTENDED FORMAT — Features beyond MVP 1.0
# ═══════════════════════════════════════════════════════════

# ─── Relationships ────────────────────────────────────────
# Defines how entities connect to each other.
#
# Types:
#   belongs_to  — many-to-one (this entity has a foreign key)
#   has_many    — one-to-many (other entity has the foreign key)
#   has_one     — one-to-one
#   many_to_many — junction table auto-managed
#
# Example: expense belongs_to budget
#          invoice has_many line_items (parent-child)
#          deal belongs_to contact AND company

relationships:

  # Many-to-one: expense has a budget_id foreign key
  expense_budget:
    type: belongs_to
    from: expense
    to: budget
    foreign_key: budget_id          # field auto-added to expense
    required: false                 # expense can exist without a budget
    description: "Which budget this expense is charged against"

  # One-to-many parent-child: invoice owns its line items
  invoice_line_items:
    type: has_many
    from: invoice
    to: line_item
    foreign_key: invoice_id
    cascade_delete: true            # deleting invoice deletes line items
    description: "Line items belonging to this invoice"

  # Many-to-many: service can be performed by multiple providers
  service_providers:
    type: many_to_many
    from: service
    to: provider
    junction_table: service_provider # auto-created
    junction_fields:                 # extra fields on the junction
      hourly_rate:
        type: decimal
        required: true
    description: "Which providers can perform which services"

  # Self-referential: employee reports to another employee
  employee_manager:
    type: belongs_to
    from: employee
    to: employee
    foreign_key: manager_id
    required: false
    description: "Manager/reporting hierarchy"

  # How MCP tools handle relationships:
  #
  # belongs_to:
  #   - create_expense accepts budget_id parameter
  #   - get_expense returns budget object inline (or budget_id)
  #   - list_expenses can filter by budget_id
  #
  # has_many (parent-child):
  #   - get_invoice includes line_items array
  #   - create_line_item requires invoice_id
  #   - list_line_items can filter by invoice_id
  #
  # many_to_many:
  #   - list_providers accepts service_id filter
  #   - list_services accepts provider_id filter
  #   - link_service_provider / unlink_service_provider tools

# ─── Workflows / State Machines ───────────────────────────
# Define entity lifecycle states with valid transitions.
# The AI agent can only trigger transitions that are permitted.
#
# States have:
#   - A name and description
#   - Which roles can trigger transitions TO this state
#   - Actions that run on entering/exiting
#
# Transitions have:
#   - from → to (which states can transition)
#   - guards (conditions that must be true)
#   - actions (side effects on transition)

workflows:

  # Invoice lifecycle
  invoice_lifecycle:
    entity: invoice
    field: status                    # which field holds the state
    initial: draft

    states:
      draft:
        description: "Invoice being prepared"
      sent:
        description: "Invoice sent to customer"
      partially_paid:
        description: "Some payments received"
      paid:
        description: "Fully paid"
      overdue:
        description: "Past due date, unpaid"
      void:
        description: "Cancelled/voided"

    transitions:
      send:
        from: draft
        to: sent
        allowed_roles: [owner, ai]
        guard: "line_items_count > 0"   # must have at least one line item
        actions:
          - type: set_field
            field: sent_at
            value: "now()"
          - type: notify
            channel: email
            template: invoice_sent

      record_payment:
        from: [sent, partially_paid]
        to: partially_paid
        allowed_roles: [owner, ai]
        # Auto-transition to 'paid' handled by trigger (see automations)

      mark_paid:
        from: [sent, partially_paid]
        to: paid
        allowed_roles: [owner, ai]
        guard: "balance_due == 0"

      mark_overdue:
        from: [sent, partially_paid]
        to: overdue
        allowed_roles: [system]         # time-triggered, not user-triggered
        guard: "due_date < today() AND balance_due > 0"

      void_invoice:
        from: [draft, sent, overdue]
        to: void
        allowed_roles: [owner]          # only owner can void
        guard: "total_paid == 0"        # can't void if payments exist
        actions:
          - type: notify
            channel: email
            template: invoice_voided

    # How MCP tools handle workflows:
    #
    # - AI gets transition tools: send_invoice, record_payment_invoice, etc.
    # - Each tool checks the guard condition before executing
    # - The state field is not directly settable — only transitions change it
    # - AI cannot trigger transitions where allowed_roles excludes 'ai'
    # - Transition tools include the current state in error messages:
    #   { error: "invalid_transition", current: "paid", attempted: "void" }

  # Deal pipeline (CRM)
  deal_pipeline:
    entity: deal
    field: stage
    initial: lead

    states:
      lead:
        description: "New potential deal"
      qualified:
        description: "Confirmed as real opportunity"
      proposal:
        description: "Proposal sent to prospect"
      negotiation:
        description: "Active negotiation"
      closed_won:
        description: "Deal won"
      closed_lost:
        description: "Deal lost"

    transitions:
      qualify:
        from: lead
        to: qualified
        allowed_roles: [owner, ai]

      send_proposal:
        from: qualified
        to: proposal
        allowed_roles: [owner, ai]
        guard: "amount != null AND amount > 0"  # must have a value
        actions:
          - type: set_field
            field: proposal_sent_at
            value: "now()"

      start_negotiation:
        from: proposal
        to: negotiation
        allowed_roles: [owner, ai]

      win:
        from: [proposal, negotiation]
        to: closed_won
        allowed_roles: [owner]          # only owner can close deals
        actions:
          - type: set_field
            field: closed_at
            value: "now()"
          - type: notify
            template: deal_won

      lose:
        from: [lead, qualified, proposal, negotiation]
        to: closed_lost
        allowed_roles: [owner, ai]
        actions:
          - type: set_field
            field: closed_at
            value: "now()"

# ─── Computed Fields ──────────────────────────────────────
# Fields whose values are derived from other data.
# These are read-only — cannot be set directly.
#
# Types:
#   formula     — calculated from fields on the same record
#   aggregation — calculated from related records
#   time_relative — calculated from a date field and now()

computed_fields:

  # Same-record formula
  line_item_subtotal:
    entity: line_item
    type: formula
    expression: "quantity * unit_price"
    result_type: decimal
    precision: 2
    description: "Line item total before tax"

  # Cross-entity aggregation
  invoice_subtotal:
    entity: invoice
    type: aggregation
    source: line_item                  # aggregate from this entity
    relationship: invoice_line_items   # via this relationship
    function: sum
    field: subtotal                    # sum this field (computed above)
    result_type: decimal
    precision: 2
    description: "Sum of all line items"

  invoice_total:
    entity: invoice
    type: formula
    expression: "subtotal + tax_amount"
    result_type: decimal
    precision: 2

  invoice_balance_due:
    entity: invoice
    type: formula
    expression: "total - total_paid"
    result_type: decimal
    precision: 2

  # Time-relative
  deal_age_days:
    entity: deal
    type: time_relative
    expression: "days_between(created_at, now())"
    result_type: integer
    description: "Days since deal was created"

  # Windowed aggregation
  monthly_category_total:
    entity: expense
    type: aggregation
    source: expense
    function: sum
    field: amount
    group_by: category
    window: current_month
    result_type: decimal
    description: "Total spending per category this month"

  # How MCP tools handle computed fields:
  #
  # - Computed fields appear in read responses but NOT in create/update inputs
  # - AI can filter and sort by computed fields in list queries
  # - Aggregation tools can reference computed fields
  # - Tool descriptions note which fields are computed

# ─── Automations / Triggers ───────────────────────────────
# Actions that happen automatically when conditions are met.
# Different from rules (which validate/block) — automations DO things.
#
# Trigger types:
#   on_create     — when a record is created
#   on_update     — when a record is updated
#   on_transition — when a workflow state changes
#   on_schedule   — runs on a cron schedule
#   on_threshold  — when a computed value crosses a threshold

automations:

  # Auto-transition: invoice becomes "paid" when balance_due hits 0
  auto_mark_paid:
    trigger: on_update
    entity: invoice
    condition: "balance_due == 0 AND status IN ['sent', 'partially_paid']"
    actions:
      - type: transition
        workflow: invoice_lifecycle
        transition: mark_paid

  # Scheduled: check for overdue invoices daily
  check_overdue_invoices:
    trigger: on_schedule
    schedule: "0 9 * * *"             # daily at 9 AM
    entity: invoice
    condition: "due_date < today() AND status == 'sent'"
    actions:
      - type: transition
        workflow: invoice_lifecycle
        transition: mark_overdue
      - type: notify
        template: invoice_overdue

  # Threshold: budget warning when spending hits 80%
  budget_warning:
    trigger: on_threshold
    entity: budget
    computed_field: monthly_category_total
    threshold: "monthly_category_total >= budget_amount * 0.8"
    actions:
      - type: notify
        template: budget_warning
    cooldown: 24h                     # don't re-trigger for 24 hours

  # Cascade: recalculate invoice total when line item changes
  recalc_invoice_on_line_item_change:
    trigger: on_create
    entity: line_item
    actions:
      - type: recompute
        target: invoice
        fields: [subtotal, total, balance_due]

  # Cross-entity: update customer last_contact_date when activity created
  update_last_contact:
    trigger: on_create
    entity: activity
    actions:
      - type: update_related
        relationship: activity_contact
        set:
          last_contact_date: "now()"

# ─── Views / Named Queries ────────────────────────────────
# Pre-defined queries that become MCP tools.
# AI agents can call these as tools: query_overdue_invoices(), etc.
#
# Views define:
#   - Which entity to query
#   - Default filters, sorting, grouping
#   - What aggregations to include
#   - Display type (for dashboard rendering)

views:

  overdue_invoices:
    entity: invoice
    description: "All unpaid invoices past their due date"
    filter:
      status: { in: [sent, overdue] }
      due_date: { lt: "today()" }
    sort: { due_date: asc }
    display: list
    # MCP tool generated: query_overdue_invoices()

  monthly_spending_summary:
    entity: expense
    description: "Spending breakdown for the current month"
    filter:
      date: { gte: "start_of_month()", lte: "today()" }
    aggregate:
      - function: sum
        field: amount
        group_by: category
      - function: count
        group_by: category
    sort: { total: desc }
    display: summary
    # MCP tool generated: query_monthly_spending_summary()

  pipeline_board:
    entity: deal
    description: "All active deals grouped by pipeline stage"
    filter:
      stage: { not_in: [closed_won, closed_lost] }
    group_by: stage
    aggregate:
      - function: sum
        field: amount
      - function: count
    sort: { updated_at: desc }
    display: board
    # MCP tool generated: query_pipeline_board()

  stale_deals:
    entity: deal
    description: "Deals with no activity in the last 14 days"
    filter:
      stage: { not_in: [closed_won, closed_lost] }
      last_activity_date: { lt: "today() - 14" }
    sort: { last_activity_date: asc }
    display: list

  dashboard_metrics:
    description: "Key business metrics"
    metrics:
      - name: total_revenue_mtd
        entity: invoice
        filter: { status: paid, paid_at: { gte: "start_of_month()" } }
        function: sum
        field: total
      - name: active_deals
        entity: deal
        filter: { stage: { not_in: [closed_won, closed_lost] } }
        function: count
      - name: avg_deal_size
        entity: deal
        filter: { stage: closed_won }
        function: avg
        field: amount
    display: metrics
    # MCP tool generated: query_dashboard_metrics()

# ─── Notifications ────────────────────────────────────────
# Define when and how to notify the app owner.
# Notifications are triggered by automations, transitions, or thresholds.

notifications:

  templates:
    invoice_sent:
      subject: "Invoice #{invoice_number} sent to {customer_name}"
      body: "Invoice for {total} {currency} has been sent."
      channels: [email, in_app]

    invoice_overdue:
      subject: "Invoice #{invoice_number} is overdue"
      body: "Invoice for {total} {currency} was due on {due_date}. Balance: {balance_due}."
      channels: [email, in_app, webhook]
      priority: high

    budget_warning:
      subject: "Budget alert: {category} at {percentage}%"
      body: "You've spent {spent} of your {budget_amount} budget for {category}."
      channels: [in_app]

    deal_won:
      subject: "Deal won: {title} — {amount}"
      body: "Congratulations! The deal '{title}' worth {amount} has been closed."
      channels: [email, in_app]

  channels:
    email:
      enabled: true
    in_app:
      enabled: true
    webhook:
      enabled: true
      url: "https://hooks.example.com/ezyforge"

# ─── Roles (beyond owner + AI) ───────────────────────────
# Custom roles for team-based apps.
# Each role has entity-level and field-level permissions.

roles:
  owner:
    description: "App owner — full access to everything"
    permissions: "*"                   # unrestricted

  ai:
    description: "AI agent — restricted per entity ai_permissions"
    # Permissions defined in each entity's ai_permissions block

  manager:
    description: "Team manager — can approve and view all data"
    entities:
      expense:
        create: true
        read: true
        update:
          allowed_fields: [notes, category, status]
        delete: false
      leave_request:
        create: true
        read: { scope: team }         # sees their team's requests only
        update:
          allowed_fields: [status]    # can approve/reject
        delete: false

  member:
    description: "Team member — can create and view own data"
    entities:
      expense:
        create: true
        read: { scope: own }          # sees only their own expenses
        update:
          allowed_fields: [notes, category]
          scope: own                   # can only update their own
        delete: false
      leave_request:
        create: true
        read: { scope: own }
        update: false
        delete: false

# ─── Integrations ─────────────────────────────────────────
# Webhook and external system connections.

integrations:

  webhooks:
    on_expense_created:
      event: "expense.created"
      url: "https://hooks.example.com/expenses"
      method: POST
      headers:
        Authorization: "Bearer ${WEBHOOK_SECRET}"

    on_invoice_overdue:
      event: "invoice.transition.overdue"
      url: "https://hooks.example.com/overdue"

  # Future: calendar sync, payment gateway, email sending
```

### Field Type Reference

| Type | Description | Constraints | Example |
|------|-------------|-------------|---------|
| `string` | Short text | `min_length`, `max_length`, `pattern` (regex) | Name, title |
| `text` | Long text | `max_length` | Notes, description |
| `integer` | Whole number | `min`, `max` | Quantity, count |
| `decimal` | Decimal number | `min`, `max`, `precision` | Amount, rate |
| `boolean` | True/false | — | Active, archived |
| `date` | Date only | `min`, `max` | Expense date, due date |
| `datetime` | Date + time | `min`, `max` | Created at, scheduled at |
| `enum` | Fixed options | `values` (list) | Status, category |
| `uuid` | Unique ID | `auto: generate` | Record ID |
| `email` | Email address | Validated format | Contact email |
| `url` | Web URL | Validated format | Website, link |
| `phone` | Phone number | Validated format | Contact phone |
| `currency` | Money value | `precision`, `currency_code` | Price, amount |
| `file` | File attachment | `max_size`, `allowed_types` | Receipt image |
| `json` | Arbitrary JSON | `schema` (optional JSON Schema) | Metadata |
| `auto_increment` | Sequential number | `prefix`, `padding` | INV-0001 |

### Expression Language Reference

Used in rule conditions, workflow guards, computed field formulas, and automation conditions.

**Operators:**
- Comparison: `==`, `!=`, `<`, `<=`, `>`, `>=`
- Boolean: `AND`, `OR`, `NOT`
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Membership: `IN`, `NOT IN`
- Null: `is null`, `is not null`

**Functions:**
- Date: `today()`, `now()`, `day_of_week(date)`, `start_of_month()`, `end_of_month()`, `days_between(a, b)`
- String: `contains(field, value)`, `starts_with(field, value)`, `upper(field)`, `lower(field)`
- Aggregation (in computed fields): `sum(field)`, `count()`, `avg(field)`, `min(field)`, `max(field)`

### Feature Availability by Version

| Feature | 1.0 | 1.1 | 1.2 | 2.0+ |
|---------|-----|-----|-----|------|
| Entities & Fields | ✅ | ✅ | ✅ | ✅ |
| Field constraints (required, min, max, enum) | ✅ | ✅ | ✅ | ✅ |
| Rules (before/after hooks, reject/warn) | ✅ | ✅ | ✅ | ✅ |
| AI Permissions (CRUD + field-level) | ✅ | ✅ | ✅ | ✅ |
| Schema lock/unlock/versioning | ✅ | ✅ | ✅ | ✅ |
| Field groups (UI organization) | ✅ | ✅ | ✅ | ✅ |
| Relationships (belongs_to, has_many) | — | ✅ | ✅ | ✅ |
| Computed fields (formula) | — | ✅ | ✅ | ✅ |
| Named views / queries | — | ✅ | ✅ | ✅ |
| Schema proposals (AI-initiated) | — | ✅ | ✅ | ✅ |
| Workflows / state machines | — | — | ✅ | ✅ |
| Automations (on_create, on_update) | — | — | ✅ | ✅ |
| Notifications (email, in-app) | — | — | ✅ | ✅ |
| Many-to-many relationships | — | — | ✅ | ✅ |
| Computed fields (aggregation, windowed) | — | — | ✅ | ✅ |
| Custom roles (beyond owner + AI) | — | — | — | ✅ |
| Automations (scheduled, threshold) | — | — | — | ✅ |
| Integrations (webhooks) | — | — | — | ✅ |
| Self-referential relationships | — | — | — | ✅ |

---

## Part 4: Complete Schema Examples

### Example 1: Personal Expenses (Simple — validates 1.0 format)

```yaml
# ═══════════════════════════════════════════════════════════
# Personal Expenses — EzyForge Template
# Complexity: Simple (1 entity, basic rules, AI permissions)
# Version compatibility: 1.0
# ═══════════════════════════════════════════════════════════

app:
  name: "Personal Expenses"
  description: "Track daily spending with categories, merchants, and budget rules"
  version: 1
  locked: false
  timezone: "Asia/Kuala_Lumpur"
  currency: "MYR"

entities:

  expense:
    description: "A single expense record — the core entity"

    fields:
      id:
        type: uuid
        auto: generate

      date:
        type: date
        required: true
        description: "When the expense occurred (cannot be in the future)"

      amount:
        type: decimal
        required: true
        min: 0.01
        precision: 2
        description: "Amount spent (positive, immutable after creation)"

      currency:
        type: enum
        values: [MYR, USD, SGD]
        default: MYR
        description: "Currency code"

      merchant:
        type: string
        required: true
        max_length: 200
        description: "Where the money was spent"

      category:
        type: enum
        values: [food, transport, utilities, entertainment, health, shopping, other]
        required: true
        description: "Spending category"

      notes:
        type: text
        required: false
        max_length: 1000
        description: "Optional notes or context"

      payment_method:
        type: enum
        values: [cash, card, e-wallet, bank_transfer]
        required: false
        description: "How the expense was paid"

      created_at:
        type: datetime
        auto: now

      updated_at:
        type: datetime
        auto: now_on_update

    field_groups:
      main:
        label: "Expense Details"
        fields: [date, amount, currency, merchant, category]
      extra:
        label: "Additional Info"
        fields: [notes, payment_method]

    rules:
      no_future_dates:
        when: before_create
        condition: "date > today()"
        action: reject
        message: "Expense date cannot be in the future"

      positive_amount:
        when: before_create
        condition: "amount <= 0"
        action: reject
        message: "Amount must be positive"

      auto_tag_weekend:
        when: before_create
        condition: "day_of_week(date) IN ['Saturday', 'Sunday']"
        action: tag
        tag: { weekend: true }

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [notes, category]
      delete: false

  budget:
    description: "Monthly spending budget per category"

    fields:
      id:
        type: uuid
        auto: generate

      category:
        type: enum
        values: [food, transport, utilities, entertainment, health, shopping, other]
        required: true
        description: "Budget category (matches expense categories)"

      amount:
        type: decimal
        required: true
        min: 0
        precision: 2
        description: "Monthly budget limit"

      month:
        type: string
        required: true
        pattern: "^\\d{4}-\\d{2}$"
        description: "Budget month in YYYY-MM format"

      created_at:
        type: datetime
        auto: now

    rules:
      unique_category_month:
        type: unique
        fields: [category, month]
        message: "Budget already exists for this category and month"

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [amount]
      delete: false

# Named views for AI tools (1.1+)
views:
  monthly_summary:                          # [1.1]
    entity: expense
    description: "Spending breakdown for the current month"
    filter:
      date: { gte: "start_of_month()", lte: "today()" }
    aggregate:
      - function: sum
        field: amount
        group_by: category
      - function: count
        group_by: category
    display: summary

  recent_expenses:                          # [1.1]
    entity: expense
    description: "Last 20 expenses"
    sort: { date: desc, created_at: desc }
    limit: 20
    display: list
```

### Example 2: CRM (Medium — tests relationships, pipeline, roles)

```yaml
# ═══════════════════════════════════════════════════════════
# Simple CRM — EzyForge Template
# Complexity: Medium (3 entities, relationships, pipeline workflow)
# Version compatibility: 1.1+ (relationships, computed fields)
#                        1.2+ (workflow, automations)
# ═══════════════════════════════════════════════════════════

app:
  name: "Simple CRM"
  description: "Manage contacts, companies, and deals with a sales pipeline"
  version: 1
  locked: false
  timezone: "Asia/Kuala_Lumpur"
  currency: "MYR"

entities:

  company:
    description: "A business or organization"

    fields:
      id:
        type: uuid
        auto: generate
      name:
        type: string
        required: true
        max_length: 200
        description: "Company name"
      industry:
        type: enum
        values: [technology, logistics, retail, manufacturing, services, finance, other]
        required: false
        description: "Industry sector"
      website:
        type: url
        required: false
        description: "Company website"
      phone:
        type: phone
        required: false
      email:
        type: email
        required: false
      address:
        type: text
        required: false
        max_length: 500
      notes:
        type: text
        required: false
        max_length: 2000
      created_at:
        type: datetime
        auto: now
      updated_at:
        type: datetime
        auto: now_on_update

    rules:
      unique_company_name:
        type: unique
        fields: [name]
        message: "A company with this name already exists"

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [phone, email, website, address, notes, industry]
      delete: false

  contact:
    description: "A person, usually associated with a company"

    fields:
      id:
        type: uuid
        auto: generate
      first_name:
        type: string
        required: true
        max_length: 100
      last_name:
        type: string
        required: true
        max_length: 100
      email:
        type: email
        required: false
        description: "Primary email address"
      phone:
        type: phone
        required: false
      job_title:
        type: string
        required: false
        max_length: 200
      notes:
        type: text
        required: false
        max_length: 2000
      last_contact_date:
        type: date
        required: false
        description: "When this contact was last reached out to"
      created_at:
        type: datetime
        auto: now
      updated_at:
        type: datetime
        auto: now_on_update

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [email, phone, job_title, notes, last_contact_date]
      delete: false

  deal:
    description: "A sales opportunity linked to a contact and company"

    fields:
      id:
        type: uuid
        auto: generate
      title:
        type: string
        required: true
        max_length: 200
        description: "Deal name or description"
      amount:
        type: decimal
        required: false
        min: 0
        precision: 2
        description: "Deal value (required before sending proposal)"
      currency:
        type: enum
        values: [MYR, USD, SGD]
        default: MYR
      stage:
        type: enum
        values: [lead, qualified, proposal, negotiation, closed_won, closed_lost]
        default: lead
        description: "Current pipeline stage (managed by workflow)"
      priority:
        type: enum
        values: [low, medium, high]
        default: medium
      expected_close_date:
        type: date
        required: false
        description: "When this deal is expected to close"
      close_reason:
        type: text
        required: false
        max_length: 500
        description: "Why the deal was won or lost"
      proposal_sent_at:
        type: datetime
        required: false
      closed_at:
        type: datetime
        required: false
      notes:
        type: text
        required: false
        max_length: 2000
      created_at:
        type: datetime
        auto: now
      updated_at:
        type: datetime
        auto: now_on_update

    field_groups:
      main:
        label: "Deal Info"
        fields: [title, amount, currency, stage, priority, expected_close_date]
      outcome:
        label: "Outcome"
        fields: [close_reason, proposal_sent_at, closed_at]
      notes:
        label: "Notes"
        fields: [notes]

    rules:
      no_negative_amount:
        when: before_create
        condition: "amount != null AND amount < 0"
        action: reject
        message: "Deal amount cannot be negative"

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [notes, priority, expected_close_date, amount]
      delete: false

  activity:
    description: "A logged interaction with a contact (call, email, meeting)"

    fields:
      id:
        type: uuid
        auto: generate
      type:
        type: enum
        values: [call, email, meeting, note]
        required: true
        description: "Type of activity"
      subject:
        type: string
        required: true
        max_length: 200
      description:
        type: text
        required: false
        max_length: 2000
      activity_date:
        type: datetime
        required: true
        description: "When this activity happened"
      created_at:
        type: datetime
        auto: now

    rules:
      no_future_activities:
        when: before_create
        condition: "activity_date > now()"
        action: reject
        message: "Cannot log activities in the future"

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [subject, description]
      delete: false

# ─── Relationships ──────────────────────────────── [1.1+]
relationships:

  contact_company:
    type: belongs_to
    from: contact
    to: company
    foreign_key: company_id
    required: false
    description: "Which company this contact works for"

  deal_contact:
    type: belongs_to
    from: deal
    to: contact
    foreign_key: contact_id
    required: true
    description: "Primary contact for this deal"

  deal_company:
    type: belongs_to
    from: deal
    to: company
    foreign_key: company_id
    required: false
    description: "Company associated with this deal"

  activity_contact:
    type: belongs_to
    from: activity
    to: contact
    foreign_key: contact_id
    required: true
    description: "Which contact this activity was with"

  activity_deal:
    type: belongs_to
    from: activity
    to: deal
    foreign_key: deal_id
    required: false
    description: "Optionally linked to a specific deal"

# ─── Computed Fields ────────────────────────────── [1.1+]
computed_fields:

  deal_age_days:
    entity: deal
    type: time_relative
    expression: "days_between(created_at, now())"
    result_type: integer
    description: "Days since deal was created"

  contact_full_name:
    entity: contact
    type: formula
    expression: "first_name + ' ' + last_name"
    result_type: string
    description: "Full name"

  company_total_deal_value:
    entity: company
    type: aggregation
    source: deal
    relationship: deal_company
    function: sum
    field: amount
    filter: { stage: { in: [closed_won] } }
    result_type: decimal
    description: "Total value of won deals for this company"

  company_deal_count:
    entity: company
    type: aggregation
    source: deal
    relationship: deal_company
    function: count
    result_type: integer
    description: "Number of deals associated with this company"

# ─── Workflow ───────────────────────────────────── [1.2+]
workflows:

  deal_pipeline:
    entity: deal
    field: stage
    initial: lead

    states:
      lead:
        description: "New potential opportunity"
      qualified:
        description: "Verified as real opportunity"
      proposal:
        description: "Proposal sent"
      negotiation:
        description: "Active negotiation"
      closed_won:
        description: "Deal won!"
      closed_lost:
        description: "Deal lost"

    transitions:
      qualify:
        from: lead
        to: qualified
        allowed_roles: [owner, ai]

      send_proposal:
        from: qualified
        to: proposal
        allowed_roles: [owner, ai]
        guard: "amount != null AND amount > 0"
        actions:
          - type: set_field
            field: proposal_sent_at
            value: "now()"

      start_negotiation:
        from: proposal
        to: negotiation
        allowed_roles: [owner, ai]

      win:
        from: [proposal, negotiation]
        to: closed_won
        allowed_roles: [owner]
        actions:
          - type: set_field
            field: closed_at
            value: "now()"

      lose:
        from: [lead, qualified, proposal, negotiation]
        to: closed_lost
        allowed_roles: [owner, ai]
        actions:
          - type: set_field
            field: closed_at
            value: "now()"

# ─── Automations ────────────────────────────────── [1.2+]
automations:

  update_contact_last_activity:
    trigger: on_create
    entity: activity
    actions:
      - type: update_related
        relationship: activity_contact
        set:
          last_contact_date: "today()"

  stale_deal_warning:
    trigger: on_schedule
    schedule: "0 9 * * 1"            # every Monday at 9 AM
    entity: deal
    condition: "stage NOT IN ['closed_won', 'closed_lost'] AND updated_at < now() - 14"
    actions:
      - type: notify
        template: stale_deal_reminder

# ─── Views ──────────────────────────────────────── [1.1+]
views:

  pipeline_board:
    entity: deal
    description: "All active deals grouped by pipeline stage"
    filter:
      stage: { not_in: [closed_won, closed_lost] }
    group_by: stage
    aggregate:
      - function: sum
        field: amount
      - function: count
    sort: { updated_at: desc }
    display: board

  stale_deals:
    entity: deal
    description: "Deals with no updates in 14+ days"
    filter:
      stage: { not_in: [closed_won, closed_lost] }
      updated_at: { lt: "now() - 14" }
    sort: { updated_at: asc }
    display: list

  recent_activities:
    entity: activity
    description: "Last 50 activities across all contacts"
    sort: { activity_date: desc }
    limit: 50
    display: list

  top_companies:
    entity: company
    description: "Companies ranked by total deal value"
    sort: { total_deal_value: desc }
    limit: 20
    display: list

# ─── Notifications ──────────────────────────────── [1.2+]
notifications:
  templates:
    stale_deal_reminder:
      subject: "Stale deals need attention"
      body: "You have {count} deals with no activity in 14+ days."
      channels: [in_app]

    deal_won:
      subject: "Deal won: {title}"
      body: "Congratulations! Deal '{title}' worth {amount} {currency} has been closed."
      channels: [email, in_app]
```

### Example 3: Invoice/Billing (Complex — tests computed fields, automations, multi-entity rules)

```yaml
# ═══════════════════════════════════════════════════════════
# Invoice & Billing — EzyForge Template
# Complexity: Complex (5 entities, computed fields, parent-child,
#             workflow, automations, cross-entity rules)
# Version compatibility: 1.1+ (relationships, computed fields)
#                        1.2+ (workflow, automations, notifications)
# ═══════════════════════════════════════════════════════════

app:
  name: "Invoice & Billing"
  description: "Create invoices, track line items, record payments, manage customers"
  version: 1
  locked: false
  timezone: "Asia/Kuala_Lumpur"
  currency: "MYR"

entities:

  customer:
    description: "A customer who receives invoices"

    fields:
      id:
        type: uuid
        auto: generate
      name:
        type: string
        required: true
        max_length: 200
        description: "Customer or company name"
      email:
        type: email
        required: true
        description: "Billing email address"
      phone:
        type: phone
        required: false
      billing_address:
        type: text
        required: false
        max_length: 500
      tax_id:
        type: string
        required: false
        max_length: 50
        description: "Tax registration number"
      payment_terms:
        type: enum
        values: [net_7, net_14, net_30, net_60, due_on_receipt]
        default: net_30
        description: "Default payment terms for new invoices"
      notes:
        type: text
        required: false
        max_length: 2000
      created_at:
        type: datetime
        auto: now
      updated_at:
        type: datetime
        auto: now_on_update

    rules:
      unique_email:
        type: unique
        fields: [email]
        message: "A customer with this email already exists"

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [phone, billing_address, notes, payment_terms]
      delete: false

  product:
    description: "A product or service that appears on invoices"

    fields:
      id:
        type: uuid
        auto: generate
      name:
        type: string
        required: true
        max_length: 200
        description: "Product or service name"
      description:
        type: text
        required: false
        max_length: 1000
      unit_price:
        type: decimal
        required: true
        min: 0
        precision: 2
        description: "Default price per unit"
      currency:
        type: enum
        values: [MYR, USD, SGD]
        default: MYR
      tax_rate:
        type: decimal
        required: false
        min: 0
        max: 100
        precision: 2
        description: "Tax rate as percentage (e.g., 6 for 6%)"
      active:
        type: boolean
        default: true
        description: "Whether this product is available for new invoices"
      created_at:
        type: datetime
        auto: now
      updated_at:
        type: datetime
        auto: now_on_update

    rules:
      unique_product_name:
        type: unique
        fields: [name]
        message: "A product with this name already exists"

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [description, unit_price, tax_rate, active]
      delete: false

  invoice:
    description: "An invoice sent to a customer for payment"

    fields:
      id:
        type: uuid
        auto: generate
      invoice_number:
        type: auto_increment
        prefix: "INV-"
        padding: 5
        description: "Sequential invoice number (e.g., INV-00001)"
      status:
        type: enum
        values: [draft, sent, partially_paid, paid, overdue, void]
        default: draft
        description: "Invoice lifecycle status (managed by workflow)"
      issue_date:
        type: date
        required: true
        description: "Date the invoice is issued"
      due_date:
        type: date
        required: true
        description: "Payment due date"
      currency:
        type: enum
        values: [MYR, USD, SGD]
        default: MYR
      notes:
        type: text
        required: false
        max_length: 2000
        description: "Notes or terms shown on the invoice"
      sent_at:
        type: datetime
        required: false
      paid_at:
        type: datetime
        required: false
      created_at:
        type: datetime
        auto: now
      updated_at:
        type: datetime
        auto: now_on_update

    field_groups:
      header:
        label: "Invoice Details"
        fields: [invoice_number, status, issue_date, due_date, currency]
      financial:
        label: "Amounts"
        fields: []                  # computed fields displayed here
      notes:
        label: "Notes"
        fields: [notes]

    rules:
      due_after_issue:
        when: before_create
        condition: "due_date < issue_date"
        action: reject
        message: "Due date must be on or after the issue date"

      no_edit_after_sent:
        when: before_update
        condition: "status NOT IN ['draft']"
        action: reject
        message: "Cannot edit invoice after it has been sent"
        # Exception: notes can always be updated (handled by allowed_fields)

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [notes, due_date]
        # due_date only editable while in draft (enforced by no_edit_after_sent rule)
      delete: false

  line_item:
    description: "A single line on an invoice — quantity x price"

    fields:
      id:
        type: uuid
        auto: generate
      description:
        type: string
        required: true
        max_length: 500
        description: "What this line item is for"
      quantity:
        type: decimal
        required: true
        min: 0.01
        precision: 2
        description: "Number of units"
      unit_price:
        type: decimal
        required: true
        min: 0
        precision: 2
        description: "Price per unit"
      tax_rate:
        type: decimal
        required: false
        min: 0
        max: 100
        precision: 2
        default: 0
        description: "Tax rate as percentage"
      created_at:
        type: datetime
        auto: now

    rules:
      no_edit_after_invoice_sent:
        when: before_update
        condition: "invoice.status NOT IN ['draft']"
        action: reject
        message: "Cannot modify line items after invoice is sent"

      no_add_to_sent_invoice:
        when: before_create
        condition: "invoice.status NOT IN ['draft']"
        action: reject
        message: "Cannot add line items to a sent invoice"

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [description, quantity, unit_price, tax_rate]
      delete: false                 # line items cannot be deleted by AI

  payment:
    description: "A payment received against an invoice"

    fields:
      id:
        type: uuid
        auto: generate
      amount:
        type: decimal
        required: true
        min: 0.01
        precision: 2
        description: "Payment amount"
      payment_date:
        type: date
        required: true
        description: "When the payment was received"
      payment_method:
        type: enum
        values: [bank_transfer, credit_card, cash, cheque, e_wallet, other]
        required: true
      reference:
        type: string
        required: false
        max_length: 200
        description: "Payment reference number or transaction ID"
      notes:
        type: text
        required: false
        max_length: 500
      created_at:
        type: datetime
        auto: now

    rules:
      no_future_payment:
        when: before_create
        condition: "payment_date > today()"
        action: reject
        message: "Cannot record a future payment"

      payment_not_exceed_balance:
        when: before_create
        condition: "amount > invoice.balance_due"
        action: reject
        message: "Payment amount exceeds the remaining balance"

      invoice_must_be_sent:
        when: before_create
        condition: "invoice.status NOT IN ['sent', 'partially_paid', 'overdue']"
        action: reject
        message: "Can only record payments for sent or overdue invoices"

    ai_permissions:
      create: true
      read: true
      update:
        allowed_fields: [notes]     # only notes editable after recording
      delete: false

# ─── Relationships ──────────────────────────────── [1.1+]
relationships:

  invoice_customer:
    type: belongs_to
    from: invoice
    to: customer
    foreign_key: customer_id
    required: true
    description: "Which customer this invoice is for"

  invoice_line_items:
    type: has_many
    from: invoice
    to: line_item
    foreign_key: invoice_id
    cascade_delete: true
    description: "Line items on this invoice"

  invoice_payments:
    type: has_many
    from: invoice
    to: payment
    foreign_key: invoice_id
    cascade_delete: false           # payments are financial records, never cascade delete
    description: "Payments received for this invoice"

  line_item_product:
    type: belongs_to
    from: line_item
    to: product
    foreign_key: product_id
    required: false                  # line items can be ad-hoc without a product
    description: "Product/service this line item references"

# ─── Computed Fields ────────────────────────────── [1.1+]
computed_fields:

  # Line item level
  line_item_subtotal:
    entity: line_item
    type: formula
    expression: "quantity * unit_price"
    result_type: decimal
    precision: 2
    description: "Subtotal before tax"

  line_item_tax:
    entity: line_item
    type: formula
    expression: "quantity * unit_price * (tax_rate / 100)"
    result_type: decimal
    precision: 2
    description: "Tax amount for this line"

  line_item_total:
    entity: line_item
    type: formula
    expression: "subtotal + tax"
    result_type: decimal
    precision: 2
    description: "Total including tax"

  # Invoice level — aggregated from line items
  invoice_subtotal:
    entity: invoice
    type: aggregation
    source: line_item
    relationship: invoice_line_items
    function: sum
    field: subtotal
    result_type: decimal
    precision: 2
    description: "Sum of all line items before tax"

  invoice_tax_total:
    entity: invoice
    type: aggregation
    source: line_item
    relationship: invoice_line_items
    function: sum
    field: tax
    result_type: decimal
    precision: 2
    description: "Total tax across all line items"

  invoice_total:
    entity: invoice
    type: formula
    expression: "subtotal + tax_total"
    result_type: decimal
    precision: 2
    description: "Grand total (subtotal + tax)"

  invoice_total_paid:
    entity: invoice
    type: aggregation
    source: payment
    relationship: invoice_payments
    function: sum
    field: amount
    result_type: decimal
    precision: 2
    description: "Sum of all payments received"

  invoice_balance_due:
    entity: invoice
    type: formula
    expression: "total - total_paid"
    result_type: decimal
    precision: 2
    description: "Remaining amount owed"

  invoice_line_count:
    entity: invoice
    type: aggregation
    source: line_item
    relationship: invoice_line_items
    function: count
    result_type: integer
    description: "Number of line items"

  invoice_is_overdue:
    entity: invoice
    type: formula
    expression: "due_date < today() AND balance_due > 0 AND status IN ['sent', 'partially_paid']"
    result_type: boolean
    description: "Whether this invoice is past due"

  # Customer level
  customer_total_invoiced:
    entity: customer
    type: aggregation
    source: invoice
    relationship: invoice_customer
    function: sum
    field: total
    result_type: decimal
    precision: 2
    description: "Total amount invoiced to this customer (all time)"

  customer_total_outstanding:
    entity: customer
    type: aggregation
    source: invoice
    relationship: invoice_customer
    function: sum
    field: balance_due
    filter: { status: { in: [sent, partially_paid, overdue] } }
    result_type: decimal
    precision: 2
    description: "Total unpaid balance for this customer"

  customer_invoice_count:
    entity: customer
    type: aggregation
    source: invoice
    relationship: invoice_customer
    function: count
    result_type: integer

# ─── Workflow ───────────────────────────────────── [1.2+]
workflows:

  invoice_lifecycle:
    entity: invoice
    field: status
    initial: draft

    states:
      draft:
        description: "Invoice being prepared — editable"
      sent:
        description: "Invoice sent to customer — locked for editing"
      partially_paid:
        description: "Some payments received, balance remaining"
      paid:
        description: "Fully paid — balance is zero"
      overdue:
        description: "Past due date with outstanding balance"
      void:
        description: "Cancelled — no longer valid"

    transitions:
      send:
        from: draft
        to: sent
        allowed_roles: [owner, ai]
        guard: "line_count > 0"
        actions:
          - type: set_field
            field: sent_at
            value: "now()"
          - type: notify
            template: invoice_sent

      record_partial_payment:
        from: [sent, overdue]
        to: partially_paid
        allowed_roles: [owner, ai]
        # Triggered automatically when payment is recorded and balance > 0

      mark_paid:
        from: [sent, partially_paid, overdue]
        to: paid
        allowed_roles: [owner, ai]
        guard: "balance_due <= 0"
        actions:
          - type: set_field
            field: paid_at
            value: "now()"
          - type: notify
            template: invoice_paid

      mark_overdue:
        from: [sent, partially_paid]
        to: overdue
        allowed_roles: [system]
        guard: "due_date < today() AND balance_due > 0"

      void_invoice:
        from: [draft, sent, overdue]
        to: void
        allowed_roles: [owner]
        guard: "total_paid == 0"
        actions:
          - type: notify
            template: invoice_voided

# ─── Automations ────────────────────────────────── [1.2+]
automations:

  # When a payment is recorded, update invoice status
  auto_update_invoice_on_payment:
    trigger: on_create
    entity: payment
    actions:
      - type: recompute
        target: invoice
        fields: [total_paid, balance_due]
      - type: conditional_transition
        workflow: invoice_lifecycle
        conditions:
          - if: "invoice.balance_due <= 0"
            transition: mark_paid
          - if: "invoice.balance_due > 0 AND invoice.balance_due < invoice.total"
            transition: record_partial_payment

  # Daily check for overdue invoices (9 AM)
  check_overdue:
    trigger: on_schedule
    schedule: "0 9 * * *"
    entity: invoice
    condition: "due_date < today() AND status IN ['sent', 'partially_paid']"
    actions:
      - type: transition
        workflow: invoice_lifecycle
        transition: mark_overdue

  # Overdue reminder escalation
  overdue_reminders:
    trigger: on_schedule
    schedule: "0 9 * * *"
    entity: invoice
    condition: "status == 'overdue'"
    actions:
      - type: notify
        template: invoice_overdue_reminder
        conditions:
          - if: "days_between(due_date, today()) == 1"
            template: invoice_overdue_1day
          - if: "days_between(due_date, today()) == 7"
            template: invoice_overdue_7day
          - if: "days_between(due_date, today()) == 30"
            template: invoice_overdue_30day

  # Recalculate invoice totals when line items change
  recalc_invoice:
    trigger: on_create
    entity: line_item
    actions:
      - type: recompute
        target: invoice
        fields: [subtotal, tax_total, total, balance_due]

# ─── Views ──────────────────────────────────────── [1.1+]
views:

  outstanding_invoices:
    entity: invoice
    description: "All unpaid invoices"
    filter:
      status: { in: [sent, partially_paid, overdue] }
    sort: { due_date: asc }
    display: list

  overdue_invoices:
    entity: invoice
    description: "Invoices past their due date"
    filter:
      status: overdue
    sort: { due_date: asc }
    display: list

  aging_report:
    entity: invoice
    description: "Invoice aging — grouped by overdue period"
    filter:
      status: { in: [sent, partially_paid, overdue] }
    aggregate:
      - function: sum
        field: balance_due
        group_by: aging_bucket       # 0-30, 31-60, 61-90, 90+ days
    display: summary

  revenue_this_month:
    entity: payment
    description: "Total payments received this month"
    filter:
      payment_date: { gte: "start_of_month()", lte: "today()" }
    aggregate:
      - function: sum
        field: amount
    display: metric

  customer_balances:
    entity: customer
    description: "All customers with outstanding balances"
    filter:
      total_outstanding: { gt: 0 }
    sort: { total_outstanding: desc }
    display: list

  recent_payments:
    entity: payment
    description: "Last 20 payments received"
    sort: { payment_date: desc }
    limit: 20
    display: list

  dashboard_metrics:
    description: "Key billing metrics"
    metrics:
      - name: total_outstanding
        entity: invoice
        filter: { status: { in: [sent, partially_paid, overdue] } }
        function: sum
        field: balance_due
      - name: overdue_count
        entity: invoice
        filter: { status: overdue }
        function: count
      - name: revenue_mtd
        entity: payment
        filter: { payment_date: { gte: "start_of_month()" } }
        function: sum
        field: amount
      - name: invoices_sent_mtd
        entity: invoice
        filter: { sent_at: { gte: "start_of_month()" }, status: { not_in: [draft, void] } }
        function: count
    display: metrics

# ─── Notifications ──────────────────────────────── [1.2+]
notifications:
  templates:
    invoice_sent:
      subject: "Invoice #{invoice_number} — {total} {currency}"
      body: "Invoice for {customer.name} has been sent. Due: {due_date}."
      channels: [email, in_app]

    invoice_paid:
      subject: "Invoice #{invoice_number} fully paid"
      body: "Payment of {total} {currency} received from {customer.name}."
      channels: [in_app]

    invoice_overdue_1day:
      subject: "Invoice #{invoice_number} is overdue"
      body: "Invoice for {balance_due} {currency} from {customer.name} was due yesterday."
      channels: [in_app]

    invoice_overdue_7day:
      subject: "Invoice #{invoice_number} — 7 days overdue"
      body: "Invoice for {balance_due} {currency} from {customer.name} is 7 days overdue."
      channels: [email, in_app]

    invoice_overdue_30day:
      subject: "URGENT: Invoice #{invoice_number} — 30 days overdue"
      body: "Invoice for {balance_due} {currency} from {customer.name} is 30 days overdue. Consider follow-up."
      channels: [email, in_app, webhook]
      priority: high

    invoice_voided:
      subject: "Invoice #{invoice_number} voided"
      body: "Invoice for {customer.name} has been voided."
      channels: [in_app]

  channels:
    email:
      enabled: true
    in_app:
      enabled: true
    webhook:
      enabled: false
      url: ""
```

---

## Summary: Design Decisions

### Editor
1. **Dual-mode** — Visual editor for business owners, YAML editor for developers, always in sync.
2. **Visual editor** uses cards, toggles, and guided builders — never exposes raw YAML to non-devs.
3. **YAML editor** uses Monaco with autocomplete, validation, and a live preview pane showing generated MCP tools.
4. **Tool Preview** is a first-class screen — users always see exactly what their AI agent will be able to do.
5. **Diff view** translates schema changes into tool impact — "what changes for my AI agent?"

### Schema Format
1. **Entities + Fields** — 1.0, works today.
2. **Relationships** — 1.1, essential for any multi-entity app. `belongs_to`, `has_many`, `many_to_many` with cascade and junction options.
3. **Computed Fields** — 1.1, formulas and aggregations. `invoice.total = sum(line_items.subtotal) + tax`.
4. **Named Views** — 1.1, pre-defined queries that become MCP tools. AI calls `query_overdue_invoices()`.
5. **Workflows** — 1.2, state machines with guards, transition actions, and role-based access.
6. **Automations** — 1.2, event-triggered and scheduled actions. Auto-mark invoices overdue, cascade recompute.
7. **Notifications** — 1.2, template-based alerts via email/in-app/webhook.
8. **Custom Roles** — 2.0+, beyond owner+AI. Row-level scoping (own, team, all).

### What Makes This Format Different
- **AI-native:** Every feature is designed around how an AI agent will interact with it. Permissions shape the tool surface. Views become callable tools. Workflows generate transition tools.
- **Declarative:** No code. YAML in, behavior out. The schema IS the application.
- **Progressive:** Start simple (expenses template, 1.0 features), grow into complex (invoicing with workflows, 1.2 features). Same format, more sections.
- **FEEL-inspired expressions:** Readable, deterministic, sandboxed. Not a proprietary formula language — close to DMN/FEEL standards that developers recognize.
