You are a senior full-stack architect. Read these docs first:

- CLAUDE.md
- docs/MVP-1.0.md
- docs/ARCHITECTURE.md
- docs/FEATURES.md
- docs/NORTH-STAR.md

## Context

EzyForge is an agentic-first cloud platform. Users' AI agents create accounts, init apps from templates, and operate business data via MCP. Owners approve via web console.

The monorepo has 3 apps + 1 shared package:

```
ezyforge/
├── packages/engine/         ← shared core (parser, rules, permissions, tools, runtime)
├── apps/forge-server/       ← backend (Platform API + MCP server in one process)
├── apps/forge-console/      ← owner dashboard (login, review, app management)
├── apps/forge-web/          ← landing page + marketing site
├── templates/expenses.yaml  ← first template
└── docker-compose.yml       ← local dev (Postgres + Mailpit)
```

Tech stack:
- Language: TypeScript
- Backend: Hono + Node.js
- Frontend: Next.js 15 + Tailwind + shadcn/ui
- Database: Postgres (Docker local, Neon cloud)
- MCP: @modelcontextprotocol/sdk
- Email: SMTP (Mailpit local, Resend cloud)
- Monorepo: pnpm workspaces + turborepo
- Auth: Email OTP (custom, not Clerk/Supabase Auth)

Local dev: same code runs locally with Docker (Postgres + Mailpit) and deploys to cloud (Neon + Resend + Railway + Vercel) with only env var changes.

## Your Task

Write a detailed implementation plan for EACH service. Save as separate files.

---

### Document 1: docs/PLAN-ENGINE.md — packages/engine

The shared core library. Zero infra dependencies. Takes a Postgres connection and a schema, does everything else.

Cover:
- Module structure (parser, rules, permissions, tools, runtime, db)
- For each module:
  - Purpose
  - Public API (function signatures with TypeScript types)
  - Key data structures / interfaces
  - Implementation approach
  - Edge cases to handle
- YAML schema format specification (canonical reference — field types, constraints, rules, permissions, metadata)
- Expression evaluator design (supported operators, functions, sandboxing)
- Tool generation logic (how schema + permissions → MCP tool definitions)
- Execution pipeline (step by step: tool call → permissions → validate → rules → DB → response)
- Error types and structured error format
- Database adapter interface (so it works with any Postgres)
- Testing strategy (what to unit test, what to integration test)

---

### Document 2: docs/PLAN-SERVER.md — apps/forge-server

The backend service. Hono API + MCP server in one process.

Cover:
- Route structure (every endpoint with method, path, request/response types)
- Auth flow (email OTP — initiate, verify, session tokens, API keys)
- App lifecycle (create draft → owner approves → publish → live)
- Token management (first token auto-issued, additional via console)
- MCP hosting (how per-app MCP works within one process — routing by app ID/token)
- Database schema (platform tables: accounts, apps, schemas, tokens, activity_log)
- App database provisioning (create schema per app in same Postgres, or separate DB)
- Activity logging (what to log on every MCP call)
- Email sending (OTP emails, approval notification emails)
- Middleware (auth, rate limiting, error handling, CORS)
- Environment config (.env.local vs .env.production)
- Deployment plan (Railway / Fly.io)
- Testing strategy

---

### Document 3: docs/PLAN-CONSOLE.md — apps/forge-console

The owner's dashboard. Next.js app.

Cover:
- Pages and routes
  - /login — email OTP login
  - /apps — list my apps
  - /apps/[id] — app detail (data viewer, activity log, tokens, schema)
  - /review/[id] — approval page (schema summary, approve/reject buttons)
- Components needed (with props)
- API integration (how console talks to forge-server)
- Auth flow (OTP login → session cookie → API calls with token)
- Data viewer component (table view of entity records)
- Activity log component (timeline of AI operations)
- Token management component (create, list, revoke)
- Schema viewer component (read-only YAML display)
- Responsive design considerations (mobile-friendly for email approval links)
- Testing strategy

---

### Document 4: docs/PLAN-WEB.md — apps/forge-web

The landing page and marketing site.

Cover:
- Pages
  - / — hero, problem, solution, how it works, CTA
  - /pricing — free / pro / business tiers
  - /docs — documentation (can be MDX or external)
  - /templates — browse available templates
- Design direction (developer-focused, clean, dark mode)
- Key sections on homepage
  - Hero: one-liner + demo animation/screenshot
  - Problem: 3 pain points
  - Solution: schema example + what it generates
  - How it works: 3-step flow
  - Social proof: stats from SOCIAL-VALIDATION.md (90% excessive permissions, etc.)
  - CTA: sign up / connect your agent
- SEO strategy
- Analytics (simple, privacy-respecting)
- Testing strategy

---

### Document 5: docs/PLAN-TEMPLATE-EXPENSES.md — templates/expenses.yaml

The first and only template for MVP 1.0.

Cover:
- Complete YAML schema (production-ready, not a sketch)
- Every field with type, constraints, and description
- All business rules with conditions and error messages
- AI permissions (exactly what AI can and can't do)
- What MCP tools will be generated from this schema (list each tool with its parameters)
- Test scenarios (what should pass, what should be rejected)
- How this template validates the entire engine works end-to-end

---

## Rules for All Plans

- Be specific. Include TypeScript interfaces, function signatures, route definitions.
- Don't hand-wave. If something needs a decision, make it and explain why.
- Include the "tricky parts" — things that will take longer than expected.
- Include testing strategy for each service.
- Keep each plan under 3000 words. Dense, not verbose.

## Output Files

- /mnt/d/openclaw-workspace/projects/ezybusiness/docs/PLAN-ENGINE.md
- /mnt/d/openclaw-workspace/projects/ezybusiness/docs/PLAN-SERVER.md
- /mnt/d/openclaw-workspace/projects/ezybusiness/docs/PLAN-CONSOLE.md
- /mnt/d/openclaw-workspace/projects/ezybusiness/docs/PLAN-WEB.md
- /mnt/d/openclaw-workspace/projects/ezybusiness/docs/PLAN-TEMPLATE-EXPENSES.md

When all 5 files are saved:
openclaw system event --text "Done: EzyForge service plans ready — ENGINE, SERVER, CONSOLE, WEB, TEMPLATE" --mode now
