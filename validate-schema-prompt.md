You are a senior business application architect. Read docs/SCHEMA-OBJECTS.md first — it defines the 10 schema objects EzyForge supports.

## Your Task

Validate the schema object model by writing COMPLETE, REALISTIC schemas for 3 different business apps. Each schema must use ALL 10 objects where they make sense.

The goal is to stress-test the object model:
- Does it cover everything a real business app needs?
- Are there gaps? Missing objects? Missing field types?
- Is the YAML syntax practical and readable?
- Would a developer or business owner understand it?

For each use case, after writing the schema, write a CRITIQUE:
- What worked well?
- What felt awkward or forced?
- What's missing that the business actually needs?
- Suggestions to improve the object model

---

## Use Case 1: Personal Expenses App

A solo user tracks daily expenses via AI agent. Simple but covers the core.

Think about:
- Multi-currency (MYR, SGD, USD)
- Categories and subcategories
- Budgets per category per month
- Receipt tracking
- Monthly summaries and trends
- Payment methods
- Reimbursement tracking
- What views does a real expenses user need?
- What actions beyond CRUD?

Write the FULL schema using all applicable objects.

---

## Use Case 2: Small Team CRM

A 3-person sales team manages contacts, deals, and activities. AI agent handles logging, follow-ups, and pipeline queries.

Think about:
- Contact and company management
- Deal pipeline with stages (lead → qualified → proposal → negotiation → won/lost)
- Activity logging (calls, emails, meetings, WhatsApp)
- Follow-up tracking with reminders
- Pipeline reporting
- Team roles (owner, sales rep, AI agent)
- Lead qualification logic
- What happens when a deal is won? Lost?
- What automations does a sales team need?
- What notifications?

Write the FULL schema using all applicable objects.

---

## Use Case 3: Invoice & Billing System

A freelancer or small business manages customers, invoices, line items, and payments. AI agent creates invoices, tracks payments, and alerts on overdue.

Think about:
- Customer management
- Invoice lifecycle (draft → sent → paid → overdue → cancelled → void)
- Line items with quantities and prices
- Tax calculation (SST/GST)
- Partial payments
- Payment tracking
- Overdue detection and reminders
- Monthly revenue reports
- What computed fields are needed (subtotal, tax, total, outstanding balance)?
- What automations?
- What happens when customer has outstanding balance?
- Credit notes / refunds?

Write the FULL schema using all applicable objects.

---

## Output Structure

For EACH use case:

### [Use Case Name]

#### Complete YAML Schema
```yaml
# Full schema using the 10 objects
```

#### MCP Tools Generated
List every tool the AI agent gets from this schema.

#### Critique
- What the object model handles well
- What felt awkward
- What's missing
- Suggested improvements

---

### Final Verdict

After all 3 use cases:
1. Are the 10 objects sufficient for real business apps?
2. What objects need to be added, removed, or changed?
3. What field types are missing?
4. What expression functions are needed beyond today()/now()?
5. Rate the object model: Ready to build / Needs refinement / Fundamentally flawed

Save to: /mnt/d/openclaw-workspace/projects/ezybusiness/docs/SCHEMA-VALIDATION.md

When done:
openclaw system event --text "Done: EzyForge schema object model validated against 3 use cases" --mode now
