You are a market researcher. Your job is to find REAL developer complaints, posts, and discussions online that validate (or invalidate) the EzyForge pain points.

## The Pain Points to Validate

1. LLMs drift or corrupt data schemas when given database access
2. AI agents bypass business rules (future dates, invalid amounts, wrong enums)
3. AI has too much database access — field-level restrictions don't exist
4. Schema changes by AI are undiscoverable / ungoverned
5. Every team builds custom guardrails from scratch — no reusable solution

## Your Task

Search the web extensively for REAL developer posts, tweets, GitHub issues, HN threads, Reddit posts, blog posts, and Discord messages that show these pain points in the wild.

### Search Queries to Try (search ALL of these)
- "LLM corrupted my database"
- "AI agent changed my schema"
- "ChatGPT messed up database"
- "Claude deleted my data"
- "AI agent schema drift"
- "MCP database security"
- "Supabase MCP security"
- "LLM database permissions"
- "AI agent write access database"
- "agentic app data integrity"
- "LLM business rules unreliable"
- "AI ignores business logic"
- "vibe coding data problems"
- "Claude Code database corruption"
- "AI coding agent broke production"
- "Cursor deleted my data"
- "AI agent guardrails developer"
- "LLM field validation bypass"
- "building agentic app problems"
- "AI writes to wrong table"
- "schema enforcement LLM"
- site:reddit.com "AI agent" database problem
- site:news.ycombinator.com AI agent database
- site:x.com developer "AI messed up" database

### For Each Finding Report:
- Source (URL, platform, date if available)
- Quote or summary of what was said
- Engagement (upvotes, likes, comments if visible)
- Which pain point it validates
- Severity (how bad was the problem)

## Output Format

### Summary
- How many real posts/complaints found?
- Which pain point has the most evidence?
- Which pain point has the LEAST evidence (potential invalidation)?
- Overall verdict: is the developer pain real and widespread?

### Evidence by Pain Point
For each of the 5 pain points:
- Validated / Partially Validated / Not Validated
- Best 2-3 quotes/examples found
- Engagement numbers

### Most Compelling Evidence
Top 5 most credible, high-engagement posts that prove the pain is real.
Include direct quotes where possible.

### Counter-Evidence
Any posts where developers say "this isn't a problem" or "just use X tool"?
Be honest — include evidence that challenges the thesis.

### Raw Findings Log
All sources found, even minor ones.

---

Save to: /mnt/d/openclaw-workspace/projects/ezybusiness/SOCIAL-VALIDATION.md

When done:
openclaw system event --text "Done: EzyForge social validation research complete" --mode now
