You are a sharp product strategist. Your job is to consolidate all research into two clean, definitive documents.

Read ALL documents first:
- PROBLEM.md
- SOCIAL-VALIDATION.md
- VALIDATION.md
- RESEARCH-VALIDATION.md
- DISCOVERY.md
- README.md

Then produce TWO documents:

---

## Document 1: Overwrite PROBLEM.md — Definitive Problem Statement

This replaces all previous problem statements. It is THE source of truth.

Rules:
- Max 2 pages
- No research dump, no bullet lists of findings
- Written like a product brief, not a research report
- Every sentence earns its place

Structure:

### The Problem
One paragraph. Razor sharp. What is broken, for whom, and why it matters now.
Use real numbers from the research (pick the 3 most shocking stats).

### Who Suffers Most
Two personas only. The most important ones.
Each: name, what they build, the exact moment pain hits, cost of the problem.
No fluff. 3-4 sentences per persona max.

### Why Existing Tools Fail
One paragraph. Name the approaches people try today and why each is insufficient.
Not a table. A narrative.

### Why Now
One paragraph. Three forces that make 2026 the inflection point.
Must reference: Salesforce admission, Supabase warning, OWASP standard, Gartner prediction.

### What Good Looks Like
One paragraph. The world after EzyForge exists.
Written from the developer's perspective. Emotional, not technical.

---

## Document 2: NORTH-STAR.md — Product North Star

This is the product compass. Everything EzyForge builds must serve this.

Structure:

### The Mission (1 sentence)
What EzyForge exists to do in the world.

### The Belief (1 sentence)
The core conviction that drives the product. The thing that must be true for EzyForge to matter.

### The Promise (1 sentence)
What EzyForge promises to every developer who uses it.

### The Core Insight
One paragraph. The single insight that competitors miss. The "aha" that makes EzyForge inevitable once you see it.

### The North Star Metric
The ONE number that tells us if EzyForge is working.
Not revenue. Not GitHub stars. The metric that proves developers trust their AI-powered apps more because of EzyForge.

### What We Build For (Priority Order)
3 things EzyForge always optimises for, in priority order.
Example: "1. Determinism over flexibility. 2. Developer trust over developer speed. 3. ..."

### What We Never Build
3 things EzyForge will never do, no matter how much it seems like a good idea.
These are the constraints that keep the product honest.

### The Product in One Demo
Describe the single most powerful 60-second demo of EzyForge.
What does the developer type? What does EzyForge produce? What is the "wow" moment?
Be specific. Use the expenses app.

### How We Know We're Winning
3 specific, observable signals that EzyForge is on the right track.
Not metrics — real-world signs.

---

Save files:
- /mnt/d/openclaw-workspace/projects/ezybusiness/PROBLEM.md (overwrite)
- /mnt/d/openclaw-workspace/projects/ezybusiness/NORTH-STAR.md (new file)

Keep both documents tight. PROBLEM.md max 600 words. NORTH-STAR.md max 500 words.

When done:
openclaw system event --text "Done: EzyForge PROBLEM.md and NORTH-STAR.md ready" --mode now
