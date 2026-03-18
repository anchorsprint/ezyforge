# EzyForge — Problem Statement

## The Problem

There are two problems. Both must be solved together.

### Problem 1: AI Agents Break Business Data

AI agents now write to databases, not just read from them — and nothing enforces the rules. When an LLM-powered agent logs an expense, books an appointment, or processes a claim, it operates with the permissions of a god and the judgment of a hallucinating intern. It invents field names between sessions, ignores business constraints baked into prompts, and treats `DELETE FROM production` as a reasonable problem-solving strategy. The result: 90% of organizations run MCP servers with excessive default permissions (Salt Security, 2026), Salesforce publicly admitted that LLMs start dropping instructions after just eight directives, and Gartner predicts 40% of agentic AI projects will be cancelled by 2027 due to inadequate risk controls. The $52B agentic AI market is bottlenecked not on capability, but on trust.

### Problem 2: Business Software Wasn't Built for AI Operators

Traditional business software was never designed for AI operators. Salesforce costs $500/month and assumes humans click through dashboards. Airtable traps your data behind API rate limits you don't control. SAP requires a consulting engagement to change a field name. None of these tools expose deterministic business logic that an AI agent can safely operate within — because they were built for a world where humans are the operators and UIs are the interface. In the AI era, agents are the operators and tools are the interface. The entire stack needs rethinking.

## Who Suffers Most

**Marcus — The Solo Builder.** He built a personal expense tracker where his AI assistant parses "Grabbed lunch at McDonald's, RM 15" and logs it to SQLite. Three weeks in, he asked the AI to improve categorization. It renamed `amount` to `cost`, added a `food_type` column, and created a duplicate table. His reports broke. He now manually backs up the database before every AI session and spends 30 minutes per session on damage control. He has considered going back to a spreadsheet. Marcus wants to sign up for a platform that handles all of this — safely and reliably.

**Ava — The Startup CTO.** Her 4-person team ships an AI-powered clinic booking system via WhatsApp. A model update caused the agent to write `appt_date` instead of `appointment_date`. Billing integrations broke silently. A client was double-charged. Root cause investigation took two days. Two of her four engineers now spend 40% of their time maintaining custom guardrail middleware instead of building product features — three separate codebases that must stay in sync, rebuilt from scratch for every new project. Ava wants a platform that enforces rules automatically.

**Raj — The Business Owner.** He runs a small logistics company and pays $500/month across three SaaS tools — a CRM, an invoicing system, and a shipment tracker. None of them talk to each other. None of them talk to AI. His data is scattered across three vendor databases he doesn't own and can't export cleanly. He heard AI could automate his operations, but his AI assistant can't read his Salesforce data, can't write to his invoicing tool, and the one time he connected it to a spreadsheet, it overwrote a formula column. Raj isn't a developer — he doesn't want to learn TypeScript. He wants to sign up, pick a template, define how his business works, and let AI handle the repetitive operations.

## Why Existing Tools Fail

Developers try prompt-based rules (the AI drifts after a few sessions), structured output libraries like Instructor and Guardrails AI (they validate JSON shape, not data-layer business logic), Supabase RLS (the service role key bypasses all row-level security — Supabase themselves warn "never connect MCP to production"), and read-only replicas (which kill the entire point of agentic apps). Every approach is partial. None combines schema enforcement, field-level AI permissions, and deterministic business rules.

The traditional SaaS tools — Salesforce, Airtable, SAP, Notion — aren't designed for AI operators either. They're designed for humans clicking through UIs. They expose limited APIs, charge per seat for access to your own data, and lock your business logic inside proprietary systems you can't inspect or modify.

## Why Now

Four forces converged in 2025–2026 to make this urgent. Salesforce admitted LLMs can't reliably follow business rules and pivoted their entire agent strategy to hybrid deterministic reasoning. Supabase officially warned developers against connecting their MCP server to production data — the most popular backend-as-a-service platform acknowledged it can't solve this. OWASP published the first Top 10 for Agentic Applications, codifying tool misuse and data leakage as industry-standard risks. And Gartner predicted that nearly half of all agentic AI projects will fail without governance — putting a number on the cost of inaction.

The AI era makes fancy UIs optional. What you need is deterministic business logic and an AI that can operate within it safely.

## What Good Looks Like

You sign up at ezyforge.io. You pick the "Personal Expenses" template. You tweak the schema — add a category, change the currency options. You deploy. You get an MCP endpoint URL and a token. You paste it into your AI agent's config. Done.

Your AI logs "Grabbed lunch at McDonald's, RM 15" and it shows up in your dashboard. The AI can create expenses and update notes — nothing more. There is no delete tool because you said no deletion. There is no way to write a future date because the rule engine catches it before it hits the database. When you come back next week to add a field, the AI proposes the change, you approve it in the dashboard, and the schema updates cleanly.

Your data is isolated per app, encrypted at rest, and you can export or delete it anytime. Every AI action is logged in an audit trail. A rogue token gets revoked with one click.

You replaced your $500/month SaaS stack with a schema and an AI. Your data is yours. Your rules are yours. You sleep without checking backups and without wondering what your AI did while you weren't looking.
