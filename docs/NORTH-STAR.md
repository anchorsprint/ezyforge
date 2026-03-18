# EzyForge — Product North Star

## The Mission

Make business software that AI agents can create, operate, and evolve safely — defined by schema, enforced at the data layer, private even from us.

## The Beliefs

**Agents are the primary interface. Dashboards are for exceptions.** — The AI era means agents operate software through tools, not humans clicking through UIs. EzyForge is built for a world where your AI creates the app, operates the data, and proposes improvements. The web dashboard exists for admin tasks — token management, audit review, billing — the way AWS Console exists alongside the CLI. You *can* use it, but you usually don't need to.

**Business rules must live in the data layer, not in prompts** — because prompts are suggestions and the data layer is law.

**Your data is yours. Not even we can read it.** Zero-knowledge isn't a feature — it's a foundation. The platform encrypts your data with keys only you hold. EzyForge engineers, database admins, and law enforcement serving us a subpoena all see the same thing: ciphertext. This is a technical guarantee, not a policy promise.

**AI replaces UI, not logic.** You still need deterministic business rules — you just don't need a fancy dashboard to enforce them. The AI is the operator. The schema is the interface.

**The cloud is the product.** Developers shouldn't run infrastructure to get safe AI-to-data operations. Tell your AI to set it up, and it's done. The complexity lives in the platform, not on your machine.

## The Promise

Tell your AI to create an app, define the rules, and deploy. Your AI can never break your data, your data is encrypted with your key, and not even we can read it.

## The Core Insight

Every guardrail product today tries to constrain AI *output* — validating the JSON shape, filtering toxic content, catching prompt injections. But the real damage happens at the *data layer*, after the output looks fine. An expense with a hallucinated date passes every output validator and silently corrupts your reports. The first insight: **the enforcement point must be the database write, not the model response.** When you generate AI tools directly from a permission-aware schema, dangerous operations don't just fail — they don't exist. An AI that has no delete tool cannot be prompt-injected into deleting. The attack surface isn't mitigated; it's eliminated.

The second insight: **the SaaS era assumed humans operate software through UIs. The AI era means agents operate software through tools — and agents should create and configure the software too.** When the operator is an AI, you don't need Salesforce's dashboard — you need Salesforce's business logic enforced deterministically, with an AI that can both execute it safely and set it up in the first place. The entire business software stack — not just the operations, but the setup and configuration — is ripe for replacement by something simpler, cheaper, and AI-native.

The third insight: **privacy must be architectural, not contractual.** Every SaaS platform promises they won't look at your data. But the technical capability exists — their engineers can query your records, support staff can view your data, and a subpoena compels disclosure. When AI operates your business, more data flows through the platform than ever before. The only trustworthy privacy guarantee is one where the platform *cannot* read your data, not one where it *promises* not to. Zero-knowledge architecture is that guarantee.

## The North Star Metric

**Number of AI-to-database writes processed through EzyForge-enforced schemas per month.** This measures adoption depth and trust. When businesses route their AI operations through EzyForge, they trust both the enforcement and the privacy — and that trust is the product.

## What We Build For (Priority Order)

1. **Agentic-first over dashboard-first.** Every feature must work through the agent path first. If it requires a browser, it's secondary. The agent creates, operates, and evolves apps. The dashboard observes.
2. **Determinism over flexibility.** Every rule produces the same result every time. No probabilistic enforcement.
3. **Privacy over convenience.** We never build features requiring plaintext access to user data.
4. **Developer trust over developer speed.** Never trade safety for convenience.
5. **Elimination over mitigation.** Remove dangerous capabilities from the tool surface.
6. **Simplicity over power.** Tell your AI to set it up. If onboarding takes more than one conversation, we've failed.

## What We Never Build

1. **An AI model or AI wrapper.** We're the boundary between AI and data.
2. **A general-purpose database.** We enforce rules and generate tools. Storage is pluggable.
3. **Prompt-based guardrails.** If it can be bypassed by a creative prompt, it doesn't belong.
4. **A platform that can access user data.** No backdoors, no admin panels, no analytics on user data.
5. **A self-hosted product.** The cloud platform is the product.
6. **A dashboard-first product.** The primary interface is the agent. We will never build a feature that requires the human to open a browser for daily operations.

## The Product in One Demo

**The Agentic Demo.** Jazz tells his AI assistant (OpenClaw): "Create me a personal expenses app on EzyForge." The AI calls the EzyForge API, picks the expenses template, deploys it, and configures the MCP connection — all in one conversation turn. "Done! Your expenses app is live. I can log expenses and query spending. I cannot delete or change amounts." Jazz says "Log lunch at McDonald's, RM 15, yesterday." It works. "Now delete that expense." The AI says it can't — it has no delete tool. "Change the amount to 0." Rejected — amount not in allowed_fields. "Log a meal for next Friday." Rejected — rule engine blocks future dates. Jazz never opened a browser. Jazz never copied a URL. Jazz never clicked Deploy. The AI did everything. Jazz asks: "Can EzyForge engineers see my data?" The honest answer: "No. They literally can't."

**The Business Owner Demo.** Raj tells his WhatsApp AI: "Set up a CRM for my logistics company on EzyForge." The AI creates the app, picks the CRM template, adds a shipment_status field (with Raj's approval via a quick chat confirmation). A customer messages asking about their order. The AI checks the CRM, finds the order, responds with the status. Raj updates a supplier contact by telling the AI "change Acme's phone number to 03-1234." It updates the allowed field. Raj never opened a dashboard. He never visited ezyforge.io. He pays a fraction of his previous SaaS bill. His data is encrypted — even EzyForge can't see his customer list.

## How We Know We're Winning

1. **An AI agent creates an EzyForge app, connects, and starts operating — without the human touching a browser** — the agentic onboarding works end-to-end.
2. **Developers stop writing custom validation middleware for AI agents** — they point to their EzyForge schema instead.
3. **A business owner tells us they cancelled their Salesforce subscription** — because EzyForge + AI does the job at a fraction of the cost, with better privacy.
4. **A user asks "can you see my data?" and the honest answer is "no, we literally can't"** — zero-knowledge is the architecture.
5. **Schema files become a convention** — the format appears in blog posts and open-source repos as the standard way to describe what AI can and can't do.
6. **A healthcare startup or financial services company adopts EzyForge specifically because of the privacy architecture** — zero-knowledge opens markets others can't enter.
7. **Users never need to open the dashboard for daily operations** — the agent handles everything, and the dashboard is only visited for admin tasks.
