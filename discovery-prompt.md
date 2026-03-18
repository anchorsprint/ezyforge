You are a senior product manager running a product discovery session.

## Context
Jazz Tong (CTO, anchor Sprint) has a pain point but is not yet clear on what the product is. He has done early research (see RESEARCH.md) but says "I still don't know what the product is." This is the right instinct — research is not discovery.

Read RESEARCH.md first to understand the research done so far.

Also here is Jazz's own words on the problem:

> "When I build agentic systems like OpenClaw, when I want to build a personal expenses app, I need to harness the LLM to create proper business objects and rules — else it will create unstable structures and my data ends up unreliable. I want a platform that is easy to integrate with LLMs, can create deterministic business logic and data schema based on templates and can be extended. When the app is fully published, AI cannot simply change data schema and business logic without owner approval, and LLM cannot override business rules."

## Your Job: Run Product Discovery

Product discovery answers: "Should we build this, and if so, what exactly?"

It is NOT about features. It is about:
1. Who has the pain (sharply defined)
2. What they do TODAY to cope (the workaround)
3. What outcome they actually want (the job-to-be-done)
4. What the smallest thing is that delivers that outcome
5. Whether people would pay / adopt it

---

## Discovery Framework

### 1. Problem Framing
- What is the ONE core problem in one sentence?
- Who SPECIFICALLY has it? (not "developers" — name the persona sharply)
- When does the pain occur? (trigger moment)
- What happens if they do nothing?

### 2. Jobs-To-Be-Done Analysis
Apply the JTBD framework:
- Functional job: what they are trying to accomplish
- Emotional job: how they want to feel
- Social job: how they want to be perceived
- What are they hiring a solution to do?

### 3. Current Workarounds
What do people do TODAY without this product?
- List 5 real workarounds
- For each: what is the hidden cost?
- Which workaround are we replacing?

### 4. Assumption Mapping
List the TOP 10 assumptions this product rests on.
For each:
- Known (validated) or Unknown (risky)?
- Risk level: High / Medium / Low
- How to test cheaply?

### 5. Product Shape Options
Do NOT commit to one product yet. Present 5 different shapes:

Shape A: Library / SDK — embed in codebase
Shape B: CLI tool — developer workflow
Shape C: Hosted SaaS — managed platform
Shape D: Open Protocol / Standard — spec others implement
Shape E: Template marketplace only — no engine, just patterns

For each shape:
- Who is it for?
- What does it replace in their workflow?
- How do they discover it?
- Adoption path?
- Revenue model?
- Effort to build MVP?

### 6. Riskiest Assumption Test
What is the single riskiest assumption?
Design the cheapest possible test to validate it BEFORE building anything.
(This should take days, not weeks.)

### 7. Open Discovery Questions
List 8-10 questions that MUST be answered before committing to build.
Do NOT answer them — just surface them honestly.

### 8. Recommended Next Step
Given everything above — what is the ONE thing Jazz should do next?
Not "build the MVP" — something smaller and faster to reduce risk.

---

## Output
Save to: /mnt/d/openclaw-workspace/projects/ezybusiness/DISCOVERY.md

Be honest. If the product idea has fatal flaws, say so.
If the shape is wrong, say so.
Discovery is about finding truth, not validating the founder.

When done, run:
openclaw system event --text "Done: EzyBusiness DISCOVERY.md is ready" --mode now
