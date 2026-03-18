You are a sharp product strategist. Read these docs first:

- docs/DUAL-PROBLEM-ANALYSIS.md (the analysis that identified the missing vision)
- docs/PROBLEM.md (current — needs rewriting)
- docs/NORTH-STAR.md (current — needs updating)
- docs/DISCOVERY.md (Jazz's original interview answers in Q8 and final question)

## Your Task

Rewrite PROBLEM.md and NORTH-STAR.md to capture the FULL founder vision — both the foundation (AI-safe data layer) and the building (AI-native business platform that replaces expensive SaaS).

Follow the recommendations in DUAL-PROBLEM-ANALYSIS.md exactly.

---

## PROBLEM.md — Rewrite Rules

Structure:
### The Problem
Two paragraphs:
- Paragraph 1: The surface problem (AI corrupts business data — keep existing content, it's excellent)
- Paragraph 2: The deeper problem (traditional SaaS is expensive, not AI-native, vendor lock-in, you don't own your data)
- Connect them: "You can't let AI replace your SaaS unless the AI can be trusted with your data."

### Who Suffers Most
THREE personas now:
- **Marcus** (solo developer) — keep existing, he's great
- **Ava** (startup CTO) — keep existing, she's great  
- **Raj** (business owner) — NEW. Small business owner paying $500/mo for Salesforce or multiple SaaS tools. AI can't talk to any of them. Data is trapped. He wants to own his business logic, own his data, and let AI handle operations instead of hiring more staff. Not a developer — he needs templates and a simple setup.

### Why Existing Tools Fail
Expand: add that Salesforce/Airtable/SAP are not designed for AI operators. They're designed for humans clicking through UIs. When AI is the operator, the entire stack needs rethinking.

### Why Now
Keep existing forces + add: "The AI era makes fancy UIs optional. What you need is deterministic business logic and an AI that can operate within it."

### What Good Looks Like
Expand: not just "my data is safe" but also "I replaced my $500/mo Salesforce with a YAML file and an AI that runs my business operations. I own every record. I can switch databases, switch AI models, switch everything — because my business logic is in a file I control."

Max 800 words total. Still tight. Still sharp.

---

## NORTH-STAR.md — Update Rules

### Mission
Expand from "Make AI agents trustworthy operators of business data" to include the platform vision. One sentence that covers both the safety and the replacement.

### Belief
Add TWO new beliefs:
- "Data belongs to the owner, not the vendor."
- "AI replaces UI, not logic. You still need deterministic business rules — you just don't need a fancy dashboard to enforce them."

### Promise
Expand from "your AI can never break your data" to also promise data ownership and SaaS independence.

### Core Insight
Keep existing insight (enforcement at the data layer, not the model response). It's perfect. Add a second insight about the SaaS shift.

### What We Build For
Add: "Ownership over convenience. Your schema is a file. Your database is a file. You never need permission from a vendor."

### What We Never Build
Add: "A SaaS platform that locks in your data. If we can't export everything in one command, we've failed."

### The Product in One Demo
Keep the existing 60-second demo (it's perfect). Add a SECOND demo — the business owner demo:
"Raj runs forge init my-crm --template crm, runs forge serve, connects his WhatsApp AI. A customer asks about their order. The AI checks the schema, finds the order, responds with status. Raj never opened a dashboard."

### How We Know We're Winning
Add: "A business owner tells us they cancelled their Salesforce subscription because forge + AI does the job."

Max 600 words total.

---

## Output

Overwrite both files:
- /mnt/d/openclaw-workspace/projects/ezybusiness/docs/PROBLEM.md
- /mnt/d/openclaw-workspace/projects/ezybusiness/docs/NORTH-STAR.md

When done:
openclaw system event --text "Done: PROBLEM.md and NORTH-STAR.md updated with full vision" --mode now
