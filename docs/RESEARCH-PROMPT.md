You are a senior product researcher. Your job is to validate a product idea through real market research.

Read DISCOVERY.md and RESEARCH.md first to understand the full context.

## The Core Question
Jazz Tong (CTO, anchor Sprint) wants to know:
1. Does a product that solves this ALREADY EXIST in the market?
2. Is this pain point VALIDATED by real developers in the wild?
3. Based on your findings — how should DISCOVERY.md be improved?

## Research Tasks

### Task 1: Search for Existing Solutions
Search the web for products/tools that solve "LLM schema drift" and "deterministic business rules for AI agents". Look for:

- "schema enforcement for AI agents"
- "deterministic business logic LLM"
- "AI agent data governance"
- "schema-first agentic framework"
- "LLM structured data guardrails"
- "business rules engine AI"
- Any GitHub repos with 100+ stars solving this problem
- Any YC companies (W24, S24, W25, S25) in this space
- Any ProductHunt launches for "AI data integrity" or "schema enforcement"

For each tool found — answer: does it FULLY solve Jazz's pain? (schema lock + AI permissions + business rules + portable)

### Task 2: Validate the Pain Point
Search developer communities for evidence this pain is real and widespread:

- Search for "LLM corrupts database", "AI agent schema drift", "ChatGPT messed up my database"
- Search Hacker News for discussions about AI data reliability
- Search Reddit r/LocalLLaMA, r/MachineLearning for complaints about AI schema inconsistency
- Search Twitter/X for developer complaints about LLM data integrity
- Look for blog posts from developers describing this exact pain

For each piece of evidence — note: how many people engaged? What was the sentiment?

### Task 3: Competitive Gap Analysis
Based on your research — fill in this table with REAL findings:

| Tool/Product | Does it exist? | Solves schema lock? | Solves AI permissions? | Solves business rules? | Portable? | Gap? |
|---|---|---|---|---|---|---|

### Task 4: Pain Point Evidence Summary
List the TOP 5 most compelling pieces of evidence that this pain is real (quotes from developers, upvote counts, GitHub issues, etc.)

### Task 5: Update DISCOVERY.md
Based on your research:
- Update Section 3 (Current Workarounds) with any tools developers actually use today
- Update Section 4 (Assumption Mapping) — mark assumptions as validated/invalidated based on evidence
- Update Section 7 (Open Discovery Questions) — answer any questions the research resolves
- Add a new Section: "Market Evidence" with your top findings
- Add a verdict: "Build / Don't Build / Validate More" with clear reasoning

Save the updated DISCOVERY.md to: /mnt/d/openclaw-workspace/projects/ezybusiness/DISCOVERY.md

Also save a separate raw research log to: /mnt/d/openclaw-workspace/projects/ezybusiness/RESEARCH-VALIDATION.md

When completely done, run:
openclaw system event --text "Done: EzyBusiness discovery updated with market research" --mode now
