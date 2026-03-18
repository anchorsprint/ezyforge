# EzyForge — Problem Statement

## The Problem

AI agents now write to databases, not just read from them — and nothing enforces the rules. When an LLM-powered agent logs an expense, books an appointment, or processes a claim, it operates with the permissions of a god and the judgment of a hallucinating intern. It invents field names between sessions, ignores business constraints baked into prompts, and treats `DELETE FROM production` as a reasonable problem-solving strategy. The result: 90% of organizations run MCP servers with excessive default permissions (Salt Security, 2026), Salesforce publicly admitted that LLMs start dropping instructions after just eight directives, and Gartner predicts 40% of agentic AI projects will be cancelled by 2027 due to inadequate risk controls. The $52B agentic AI market is bottlenecked not on capability, but on trust.

## Who Suffers Most

**Marcus — The Solo Builder.** He built a personal expense tracker where his AI assistant parses "Grabbed lunch at McDonald's, RM 15" and logs it to SQLite. Three weeks in, he asked the AI to improve categorization. It renamed `amount` to `cost`, added a `food_type` column, and created a duplicate table. His reports broke. He now manually backs up the database before every AI session and spends 30 minutes per session on damage control. He has considered going back to a spreadsheet.

**Ava — The Startup CTO.** Her 4-person team ships an AI-powered clinic booking system via WhatsApp. A model update caused the agent to write `appt_date` instead of `appointment_date`. Billing integrations broke silently. A client was double-charged. Root cause investigation took two days. Two of her four engineers now spend 40% of their time maintaining custom guardrail middleware instead of building product features — three separate codebases that must stay in sync, rebuilt from scratch for every new project.

## Why Existing Tools Fail

Developers try prompt-based rules (the AI drifts after a few sessions), structured output libraries like Instructor and Guardrails AI (they validate JSON shape, not data-layer business logic), Supabase RLS (the service role key bypasses all row-level security — Supabase themselves warn "never connect MCP to production"), and read-only replicas (which kill the entire point of agentic apps). Every approach is partial. None combines schema enforcement, field-level AI permissions, and deterministic business rules. The pattern everyone needs exists in blog posts and architecture diagrams. The product doesn't exist.

## Why Now

Four forces converged in 2025–2026 to make this urgent. Salesforce admitted LLMs can't reliably follow business rules and pivoted their entire agent strategy to hybrid deterministic reasoning. Supabase officially warned developers against connecting their MCP server to production data — the most popular backend-as-a-service platform acknowledged it can't solve this. OWASP published the first Top 10 for Agentic Applications, codifying tool misuse and data leakage as industry-standard risks. And Gartner predicted that nearly half of all agentic AI projects will fail without governance — putting a number on the cost of inaction. The pattern of "bounded autonomy" is becoming consensus across CockroachDB, Composio, Authority Partners, and Dextra Labs. Everyone describes the same solution. Nobody ships it.

## What Good Looks Like

You define your schema once — entities, fields, what the AI can touch, what it can't — and you never think about it again. You run one command and your AI agent gets exactly the tools it needs: create, read, update the fields you allow, nothing more. There is no delete tool because you said no deletion. There is no way to write a future date because the rule engine catches it before it hits the database. When you come back next week to add a feature, the schema is exactly as you left it — locked, versioned, yours. The AI is powerful within its boundaries and powerless outside them. You ship with confidence. You sleep without checking backups.
