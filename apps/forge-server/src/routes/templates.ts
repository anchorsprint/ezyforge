import { Hono } from "hono";

// ---------------------------------------------------------------------------
// Template registry — built-in schema templates
// ---------------------------------------------------------------------------

export interface Template {
  name: string;
  defaultName: string;
  description: string;
  schemaYaml: string;
}

const templates: Map<string, Template> = new Map();

// Register the expenses template (the canonical dogfood test).
templates.set("expenses", {
  name: "expenses",
  defaultName: "Personal Expenses",
  description:
    "Track personal and business expenses with categories, rules, and AI-safe permissions.",
  schemaYaml: `
app:
  name: Personal Expenses
  description: Track and manage personal expenses
  version: 1

entities:
  expense:
    fields:
      id:       { type: uuid, generated: true, auto: uuid }
      amount:   { type: decimal, required: true, min: 0.01 }
      currency: { type: enum, values: [MYR, SGD, USD], default: MYR }
      category: { type: enum, values: [food, transport, housing, utilities, entertainment, health, education, shopping, other], required: true }
      merchant: { type: string, required: true, max_length: 100 }
      date:     { type: date, required: true }
      notes:    { type: text }
      payment:  { type: enum, values: [cash, card, e_wallet, transfer] }
      created_at: { type: datetime, generated: true, auto: now }
      updated_at: { type: datetime, generated: true, auto: now_on_update }

rules:
  - name: no_future_dates
    entity: expense
    when: [before_create, before_update]
    condition: "date <= today()"
    error: "Expense date cannot be in the future"

  - name: positive_amount
    entity: expense
    when: [before_create, before_update]
    condition: "amount > 0"
    error: "Amount must be greater than zero"

permissions:
  ai:
    expense:
      create: true
      read: true
      update: [notes, category]
      delete: false
  owner:
    expense:
      create: true
      read: true
      update: true
      delete: true

functions:
  auto: true
`.trim(),
});

export function getTemplate(name: string): Template | undefined {
  return templates.get(name);
}

export function listTemplates(): Template[] {
  return Array.from(templates.values());
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const templateRoutes = new Hono();

templateRoutes.get("/", (c) => {
  const list = listTemplates().map((t) => ({
    name: t.name,
    default_name: t.defaultName,
    description: t.description,
  }));
  return c.json({ ok: true, templates: list });
});

templateRoutes.get("/:name", (c) => {
  const name = c.req.param("name");
  const t = getTemplate(name);
  if (!t) {
    return c.json({ error: "not_found", message: `Template "${name}" not found` }, 404);
  }
  return c.json({
    ok: true,
    template: {
      name: t.name,
      default_name: t.defaultName,
      description: t.description,
      schema_yaml: t.schemaYaml,
    },
  });
});
