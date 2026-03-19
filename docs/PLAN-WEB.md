# PLAN-WEB — apps/forge-web

Implementation plan for the EzyForge marketing site and landing page. Next.js 15 (App Router) + Tailwind CSS 4.

---

## Design Direction

**Vibe:** Developer-focused, sharp, confident. Inspired by Linear, Vercel, Railway.

- **Dark mode default**, light mode toggle via `next-themes`
- **Primary background:** `#0A0A0B` (near-black), cards/surfaces `#141416`
- **Accent color:** Amber/gold `#F59E0B` — distinctive, not the usual blue/purple. Conveys "forge" energy.
- **Secondary accent:** Emerald `#10B981` for success states, allowed actions
- **Danger/blocked:** Red `#EF4444` for denied actions, rule violations
- **Typography:** Inter for body, JetBrains Mono for code/schema/terminal
- **Border radius:** `rounded-lg` (8px) for cards, `rounded-xl` (12px) for hero elements
- **Animations:** Framer Motion. Subtle — terminal typing effect, schema-to-tools morph, fade-up on scroll. No gratuitous motion.
- **Spacing:** generous whitespace, max-w-6xl content container

---

## Pages

### 1. `/` — Homepage

**File:** `app/page.tsx`

Composed of section components rendered in sequence:

#### HeroSection

- **Headline:** "Your AI runs the app. Your schema runs the rules."
- **Subheadline:** "Define a schema. Deploy it. Your AI agent gets MCP tools with permissions baked in — not prompted in."
- **CTA buttons:** "Connect Your Agent" (primary, amber) / "Try Expenses Template" (secondary, outline)
- **AnimatedTerminal** component: a fake terminal showing an agent conversation:
  ```
  > Create me an expense tracker
  Creating app from expenses template...
  Deploying schema (3 entities, 12 fields, 4 rules)...
  MCP endpoint ready: https://api.ezyforge.io/mcp/app_x7k2
  Tools generated: create_expense, update_expense, list_expenses
  Connected. Your agent can now operate.
  ```
  Lines appear with typing effect (150ms per line, cursor blink). Built with `AnimatedTerminal` — renders `<pre>` blocks with sequential reveal via Framer Motion.

#### ProblemSection

Three `ProblemCard` components in a grid (`grid-cols-1 md:grid-cols-3`):

| Icon | Stat | Title | Description |
|------|------|-------|-------------|
| ShieldAlert | 90% | Excessive Permissions | 90% of AI integrations have more data access than they need. Average org gives AI 3x more than required. |
| MessageSquareWarning | 78% | Prompt-Based Guardrails | 78% of businesses worry about AI data handling — yet most guardrails are just prompt instructions an LLM can ignore. |
| Puzzle | Hours | Complex Integration | Wiring AI to business data means custom code, manual permission checks, and fragile prompt engineering. |

Each card: icon (Lucide), large stat number (amber, `text-5xl font-mono`), title, two-line description. Fade-up on scroll.

#### SolutionSection

Side-by-side layout (`grid-cols-1 lg:grid-cols-2`).

- **Left:** `SchemaPreview` — a styled YAML code block showing an expenses schema snippet (entity, fields, permissions, rules). Syntax-highlighted with Shiki.
- **Right:** `ToolsPreview` — the MCP tools that schema generates. Three tool cards (`create_expense`, `update_expense`, `list_expenses`) each showing which fields the AI can write, which are blocked (red lock icon), and which rules fire. `update_expense` shows amount/date as locked.
- **Connector:** an animated arrow/line between them with the label "Schema generates tools. No hand-coding."

#### HowItWorksSection

Three `StepCard` components in a horizontal flow with connecting lines:

1. **Define** — "Write a YAML schema. Pick fields, permissions, rules. Or start from a template." Icon: FileCode
2. **Deploy** — "Push to EzyForge. Get an MCP endpoint in seconds. Data isolated and encrypted." Icon: Rocket
3. **Connect** — "Point your AI agent at the endpoint. It gets exactly the tools your schema allows." Icon: Plug

Each step: numbered circle (amber border), icon, title, description. Connected by a dashed line on desktop.

#### SocialProofSection

`StatGrid` component — four `StatCard` items in a row:

- **90%** — "of AI integrations have excessive data permissions"
- **3x** — "more data access than needed in average org"
- **78%** — "of businesses worry about AI data handling"
- **0** — "prompt-based guardrails in EzyForge (rules are deterministic)"

Cards: large number in amber `font-mono`, description below. Dark card background with subtle border.

#### BottomCTA

- **Headline:** "Stop prompting. Start enforcing."
- **Subheadline:** "Your AI agent gets tools, not trust. Schema defines the boundary."
- **CTA:** "Get Started Free" (amber button) / "Read the Docs" (text link)
- Full-width section with subtle gradient background.

---

### 2. `/pricing` — Pricing Page

**File:** `app/pricing/page.tsx`

`PricingGrid` component with three `PricingCard` items:

| | Free | Pro | Business |
|---|---|---|---|
| **Price** | $0/mo | $19/mo | $49/mo |
| **Apps** | 1 | 10 | Unlimited |
| **Templates** | 1 (expenses) | All | All + custom |
| **Ops/month** | 1,000 | 50,000 | 500,000 |
| **Support** | Community | Priority | Dedicated |
| **Team** | Solo | Solo | Team sharing |

Pro card highlighted with amber border and "Most Popular" badge. All cards have a CTA button. A note at the bottom: "MVP is free-only. Pro and Business coming soon." — styled as a muted banner.

---

### 3. `/docs` — Documentation

**File:** `app/docs/layout.tsx` + `app/docs/[[...slug]]/page.tsx`

MDX-based documentation using `next-mdx-remote` or `contentlayer2`.

**MVP pages (MDX files in `content/docs/`):**
- `getting-started.mdx` — sign up, create app, connect agent
- `schema-reference.mdx` — YAML schema format, fields, types, permissions, rules

**Components:**
- `DocsLayout` — sidebar nav + content area
- `DocsSidebar` — navigation tree from file structure
- `DocsContent` — MDX renderer with custom components (code blocks, callouts, tables)
- `CodeBlock` — syntax-highlighted with Shiki, copy button

Blog-ready: `content/blog/` directory structure exists but empty. Route `app/blog/[[...slug]]/page.tsx` stubbed for future content marketing.

---

### 4. `/templates` — Template Browser

**File:** `app/templates/page.tsx` + `app/templates/[slug]/page.tsx`

**List page:** `TemplateGrid` — card grid of available templates.

Each `TemplateCard` shows:
- Template name and icon
- One-line description
- Badges: entity count, field count, rule count
- "View Template" link

**Detail page (`/templates/[slug]`):** `TemplateDetail` component:
- Full schema preview (syntax-highlighted YAML)
- Entity breakdown table
- Permission summary (what AI can/cannot do)
- Generated tools list
- CTA: "Deploy with Your AI" (amber button)

**MVP data:** single expenses template. Template metadata stored as typed objects in `lib/templates.ts` (not a database).

---

## Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Header` | `components/layout/header.tsx` | Logo, nav links (Home, Pricing, Templates, Docs), theme toggle, "Get Started" CTA |
| `Footer` | `components/layout/footer.tsx` | Links, copyright, social icons |
| `ThemeProvider` | `components/theme-provider.tsx` | `next-themes` wrapper, dark default |
| `Button` | `components/ui/button.tsx` | Primary (amber fill), secondary (outline), ghost variants |
| `Card` | `components/ui/card.tsx` | Surface container with border and hover state |
| `Badge` | `components/ui/badge.tsx` | Small label for counts, status |
| `AnimatedTerminal` | `components/marketing/animated-terminal.tsx` | Typing-effect terminal demo |
| `SchemaPreview` | `components/marketing/schema-preview.tsx` | Highlighted YAML block |
| `CodeBlock` | `components/ui/code-block.tsx` | Shiki-highlighted code with copy |

---

## SEO Strategy

**Target keywords:** "AI business rules engine", "MCP tools platform", "AI data safety", "schema-based AI permissions", "AI agent business software"

**Implementation:**
- `generateMetadata` on every page with title, description, keywords
- Open Graph images: auto-generated via `app/og/route.tsx` using `@vercel/og`
- `robots.txt` and `sitemap.xml` via Next.js metadata API
- Structured data: `Organization` and `SoftwareApplication` JSON-LD on homepage
- Semantic HTML: proper heading hierarchy, landmarks, alt text

---

## Analytics

**Umami** (self-hosted or cloud) — privacy-respecting, no cookies, GDPR-compliant.

- Script tag in `app/layout.tsx` behind env var `NEXT_PUBLIC_UMAMI_ID`
- Track page views automatically, custom events for CTA clicks
- No Google Analytics

---

## Performance

- **Static generation** for all marketing pages (`generateStaticParams` where needed)
- **next/image** for all images with proper sizing and formats
- **Font optimization:** Inter and JetBrains Mono via `next/font/google`, `display: swap`
- **Bundle:** no heavy client JS on marketing pages. Framer Motion tree-shaken to used features only.
- **Target:** Lighthouse 95+ on all Core Web Vitals

---

## Testing Strategy

- **Visual regression:** Playwright screenshots of each page (desktop + mobile)
- **Component tests:** Vitest + Testing Library for interactive components (AnimatedTerminal, theme toggle, mobile nav)
- **SEO validation:** test that meta tags, OG tags, and structured data render correctly
- **Accessibility:** axe-core checks in Playwright tests, keyboard navigation verification
- **Lighthouse CI:** run in CI pipeline, fail on score regression below 90

---

## Dependencies

```
next@15           — framework
tailwindcss@4     — styling
framer-motion     — animations
next-themes       — dark/light mode
shiki             — syntax highlighting
lucide-react      — icons
next-mdx-remote   — MDX rendering for docs
@vercel/og        — OG image generation
```

Dev: `vitest`, `@testing-library/react`, `playwright`, `@axe-core/playwright`
