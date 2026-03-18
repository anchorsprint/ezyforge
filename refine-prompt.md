You are a senior product manager and solutions architect.

Read ALL existing docs first (in this order):
1. DISCOVERY.md
2. RESEARCH.md
3. RESEARCH-VALIDATION.md
4. PROTOCOL-RESEARCH.md
5. FEATURES.md

Then produce the following 4 documents. Save each as a separate file.

---

## Document 1: PROBLEM.md — Refined Problem Statement

Write a crisp, precise problem statement document. Not a research dump — a sharp product brief.

Structure:
### The Problem in One Sentence
One sharp sentence. No jargon.

### Who Has This Problem
3 personas — specific, named archetypes with real context. Not "developers in general."
For each persona: name/archetype, what they're building, exactly when the pain hits, what they do today, what it costs them.

### The Core Pain Points (5 max)
Each pain point:
- Name
- What happens
- Concrete example (realistic scenario)
- Why existing tools don't solve it

### What "Solved" Looks Like
One paragraph — what the world looks like when this is fixed. From the user's perspective.

### Why Now
Why is this problem urgent in 2026 specifically? What changed?

---

## Document 2: ARCHITECTURE.md — High-Level Architecture

Write a clean architecture document for EzyBusiness. Focus on WHAT each component does and HOW they connect. Not implementation details.

Structure:

### System Overview
ASCII diagram showing all components and data flow.

### Core Components (one section per component)
For each component:
- Name
- Responsibility (1-2 sentences)
- Inputs
- Outputs
- Key design decisions (why built this way)

Components to cover:
1. Schema Registry — stores and validates the YAML schema
2. Schema Compiler — YAML → JSON Schema + custom vocabularies
3. Rule Engine — evaluates conditions and enforces business rules
4. Permission Layer — enforces AI field-level access control
5. Tool Generator — auto-generates MCP/OpenAI tools from schema
6. Tool Execution Runtime — executes tool calls through the full pipeline
7. Data Layer — SQLite/Postgres adapter
8. CLI — developer tooling
9. MCP Server — exposes tools to AI agents

### Data Flow
Step-by-step: from "AI wants to create an expense" to "record saved or rejected"

### Schema Format
Show the canonical YAML schema format with all key sections annotated.
Use the expenses app as the example.

### Extension Points
How does EzyBusiness connect to:
- Any LLM (Claude, GPT, Gemini)
- Any AI agent framework (OpenClaw, LangChain, CrewAI)
- Any database (SQLite, Postgres)

### What EzyBusiness Is NOT
Explicit boundaries — what is out of scope by design.

---

## Document 3: FEATURES.md — Refined Feature List

Rewrite FEATURES.md. The current version is too verbose. Make it:
- Scannable in 5 minutes
- Prioritized clearly (P1/P2/P3)
- Honest about what's essential vs nice-to-have
- Each feature: name, one-line description, priority, why it matters

Structure:
### P1 — Core (must have to prove the concept works)
### P2 — Complete (needed for real-world use)
### P3 — Scale (needed for open-source launch and adoption)
### Out of Scope (explicitly excluded)

Rules:
- P1 must be buildable in 2 weeks solo
- Each feature gets: Name | Description | Why | Acceptance criteria (2-3 bullets max)
- No feature padding — if it's not essential, it's P2 or P3
- Group related features together, not by technical category

---

## Document 4: README.md — Project README

Write the GitHub README for EzyBusiness. This is the public face of the project.

Structure:
### Header
Project name + tagline (one line, memorable)

### The Problem (3 sentences max)

### The Solution (3 sentences max)

### How It Works
Show a YAML schema example (expenses app — 30-40 lines max, clean and realistic)
Show what it generates (MCP tools list, maybe a curl example)

### Quick Start
```bash
npm install -g ezybiz
ezybiz init my-expenses --template expenses
ezybiz serve
```

### Core Concepts
3-4 bullet points explaining Schema is Law / AI is Operator / Owner is Governor

### Feature Status
Simple table: Feature | Status (✅ Done / 🚧 In Progress / 📋 Planned)

### Roadmap
3 phases, each one sentence

### Contributing / License

Keep README under 150 lines. Developer-first, not marketing fluff.

---

## Output Files
- /mnt/d/openclaw-workspace/projects/ezybusiness/PROBLEM.md
- /mnt/d/openclaw-workspace/projects/ezybusiness/ARCHITECTURE.md
- /mnt/d/openclaw-workspace/projects/ezybusiness/FEATURES.md (overwrite existing)
- /mnt/d/openclaw-workspace/projects/ezybusiness/README.md

When all 4 files are saved, run:
openclaw system event --text "Done: EzyBusiness docs refined — PROBLEM, ARCHITECTURE, FEATURES, README ready" --mode now
