# PLAN-CONSOLE — apps/forge-console

Owner dashboard for EzyForge. Next.js 15 App Router + Tailwind CSS + shadcn/ui. Dark mode default. The console is the governance interface — owners approve, observe, and manage. AI agents do the daily operations via MCP.

All data comes from forge-server at `NEXT_PUBLIC_API_URL`. Console has zero direct DB access.

---

## 1. Routes and Pages

### `/login`

Email OTP two-step flow. No password, no OAuth.

- **Step 1:** Email input + "Send Code" button. Calls `POST /api/auth/initiate { email }`.
- **Step 2:** 6-digit OTP input + "Verify" button. Calls `POST /api/auth/verify { email, code }`. Server responds with `Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/`.
- On success: redirect to `/apps`.
- Layout: centered card, max-w-sm, no sidebar/nav. Logo + tagline above form.
- Error states: invalid email format (client), wrong OTP (server 401), expired OTP (server 410), rate limited (server 429 — show "wait 60s").

### `/apps`

Authenticated. Lists all apps owned by the session user.

- Calls `GET /api/apps` on mount. Returns `App[]`.
- Renders grid of `AppCard` components (2-col on desktop, 1-col on mobile).
- Empty state: "No apps yet. Your AI agent can create one." with link to docs.
- Layout: sidebar nav (Apps, Settings) + main content area. Sidebar collapses to top bar on mobile.

### `/apps/[id]`

Authenticated. Tabbed detail view for a single app.

- Calls `GET /api/apps/:id` on mount. Returns `AppDetail` (app metadata + schema).
- Four tabs via shadcn `Tabs`: Data, Activity, Tokens, Schema.
- Default tab: Data.
- Tab state stored in URL search param `?tab=activity` so links are shareable.

**Data tab:**
- Calls `GET /api/apps/:id/entities` to list entity types from schema.
- Entity selector dropdown (if multiple entities). Default: first entity.
- Calls `GET /api/apps/:id/entities/:entity/records?cursor=&sort=&order=` for records.
- Renders `DataTable`. Columns derived from schema field definitions.

**Activity tab:**
- Calls `GET /api/apps/:id/activity?cursor=&tool=&result=&from=&to=`.
- Renders `ActivityLog` timeline. Filters at top.

**Tokens tab:**
- Calls `GET /api/apps/:id/tokens`. Renders `TokenList`.
- "Create Token" button opens dialog.

**Schema tab:**
- Uses schema YAML from the `AppDetail` response (already loaded).
- Renders `SchemaViewer`. No additional API call.

### `/review/[id]`

Public — no login required. Linked from approval emails.

- URL includes one-time review token: `/review/[id]?token=<review_token>`.
- Calls `GET /api/review/:id?token=<review_token>`. Returns schema summary, generated tools preview, app metadata. Server validates the review token.
- Renders `ReviewSummary` with two actions: Approve and Reject.
- Approve: `POST /api/review/:id/approve { token }` — publishes app, provisions MCP endpoint.
- Reject: `POST /api/review/:id/reject { token, reason? }` — optional reason textarea in confirm dialog.
- After action: success message with link to `/login` (if not already logged in) or `/apps/[id]` (if logged in).
- Layout: standalone page, no sidebar. Works fully on mobile — this is the primary mobile page.

---

## 2. Components

### `LoginForm`

```ts
// No props — self-contained with internal step state
interface LoginFormState {
  step: "email" | "otp";
  email: string;
  code: string;
  loading: boolean;
  error: string | null;
}
```

shadcn: `Card`, `Input`, `Button`, `Label`. Two-step form with animated transition between steps. "Back" link on OTP step to re-enter email. Auto-focus OTP input on step change.

### `AppCard`

```ts
interface AppCardProps {
  app: {
    id: string;
    name: string;
    template: string;
    status: "draft" | "published" | "rejected";
    createdAt: string;
  };
}
```

shadcn: `Card`, `CardHeader`, `CardContent`. Clickable — wraps in `<Link href="/apps/${app.id}">`. Shows `StatusBadge` top-right. Template name in muted text. Relative date ("3 days ago") via `date-fns/formatDistanceToNow`.

### `StatusBadge`

```ts
interface StatusBadgeProps {
  status: "draft" | "published" | "rejected";
}
```

shadcn: `Badge`. Variants: draft = outline/yellow, published = solid/green, rejected = solid/red.

### `DataTable`

```ts
interface Column {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "boolean" | "enum";
  sortable: boolean;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  cursor: string | null;
  onSort: (key: string, order: "asc" | "desc") => void;
  onNextPage: (cursor: string) => void;
  currentSort: { key: string; order: "asc" | "desc" } | null;
  loading: boolean;
}
```

shadcn: `Table`, `TableHeader`, `TableRow`, `TableCell`, `Button` (pagination). Column headers clickable for sort — shows arrow indicator. Cursor-based pagination: "Load More" button at bottom (not page numbers — cursor pagination doesn't support random access). Date columns formatted to local timezone. Number columns right-aligned. Boolean columns render checkmark/dash.

### `ActivityLog`

```ts
interface ActivityEntry {
  id: string;
  timestamp: string;
  tool: string;
  result: "success" | "error" | "denied";
  tokenName: string;
  input?: Record<string, unknown>; // sanitized by server
  error?: { code: string; message: string };
}

interface ActivityLogProps {
  entries: ActivityEntry[];
  cursor: string | null;
  onLoadMore: (cursor: string) => void;
  filters: {
    tool: string | null;
    result: string | null;
    from: string | null;
    to: string | null;
  };
  onFilterChange: (filters: ActivityLogProps["filters"]) => void;
  availableTools: string[]; // for filter dropdown
  loading: boolean;
}
```

Vertical timeline layout. Each entry: colored icon left (green check / red X / yellow shield), tool name bold, token name muted, relative timestamp right. Clickable to expand — shows input params and error details in a `Collapsible`. Filter bar at top: tool dropdown (shadcn `Select`), result dropdown, date range (two `Input type="date"`).

### `TokenList`

```ts
interface Token {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  status: "active" | "revoked";
}

interface TokenListProps {
  tokens: Token[];
  onCreateToken: (name: string) => Promise<{ token: string }>; // returns raw token
  onRevokeToken: (id: string) => Promise<void>;
}
```

shadcn: `Table`, `Button`, `Dialog`, `Input`, `AlertDialog`. List view with columns: name, created, last used ("Never" if null), status badge, actions. Create flow: Button opens `Dialog` with name input. On submit, response includes the raw token string. Display in monospace with copy button and warning: "This token will not be shown again." Revoke flow: `AlertDialog` confirmation — "Revoke token {name}? AI agents using this token will lose access immediately."

### `SchemaViewer`

```ts
interface SchemaViewerProps {
  yaml: string;
}
```

Renders YAML in a `<pre>` block with monospace font (font-mono). Syntax highlighting via `shiki` (import only YAML grammar to minimize bundle). Line numbers in gutter. Copy button top-right. No editing — strictly read-only.

### `ReviewSummary`

```ts
interface ReviewSummaryProps {
  app: {
    name: string;
    template: string;
    createdBy: string; // agent/token that created it
  };
  schema: {
    entities: {
      name: string;
      fieldCount: number;
      fields: { name: string; type: string; aiWritable: boolean }[];
    }[];
    rules: { entity: string; trigger: string; description: string }[];
  };
  tools: {
    name: string;
    description: string;
    entity: string;
    operation: "create" | "read" | "update" | "list";
  }[];
  onApprove: () => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
  loading: boolean;
}
```

Structured breakdown. Sections: App Info (card), Entities (table per entity showing fields and AI write access as green/red indicators), Rules (list), MCP Tools (list with operation badges). Sticky footer with Approve (green) and Reject (red outline) buttons. Reject opens `AlertDialog` with optional reason `Textarea`.

---

## 3. API Integration

### API Client

Single `api.ts` module. Thin fetch wrapper.

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // sends session cookie
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? "unknown", body.message ?? "Request failed");
  }
  return res.json();
}
```

Typed endpoint functions:

```ts
const api = {
  auth: {
    initiate: (email: string) => apiFetch("/api/auth/initiate", { method: "POST", body: JSON.stringify({ email }) }),
    verify: (email: string, code: string) => apiFetch("/api/auth/verify", { method: "POST", body: JSON.stringify({ email, code }) }),
  },
  apps: {
    list: () => apiFetch<App[]>("/api/apps"),
    get: (id: string) => apiFetch<AppDetail>(`/api/apps/${id}`),
    records: (id: string, entity: string, params: RecordParams) => apiFetch<PaginatedRecords>(`/api/apps/${id}/entities/${entity}/records?${qs(params)}`),
    activity: (id: string, params: ActivityParams) => apiFetch<PaginatedActivity>(`/api/apps/${id}/activity?${qs(params)}`),
    tokens: (id: string) => apiFetch<Token[]>(`/api/apps/${id}/tokens`),
    createToken: (id: string, name: string) => apiFetch<{ token: string }>(`/api/apps/${id}/tokens`, { method: "POST", body: JSON.stringify({ name }) }),
    revokeToken: (id: string, tokenId: string) => apiFetch<void>(`/api/apps/${id}/tokens/${tokenId}`, { method: "DELETE" }),
  },
  review: {
    get: (id: string, token: string) => apiFetch<ReviewData>(`/api/review/${id}?token=${token}`),
    approve: (id: string, token: string) => apiFetch<void>(`/api/review/${id}/approve`, { method: "POST", body: JSON.stringify({ token }) }),
    reject: (id: string, token: string, reason?: string) => apiFetch<void>(`/api/review/${id}/reject`, { method: "POST", body: JSON.stringify({ token, reason }) }),
  },
};
```

### Error Handling

Custom `ApiError` class with `status`, `code`, `message`. Components catch errors and display via toast (shadcn `Sonner`). 401 handled globally in `apiFetch`. 429 shows "Too many requests, try again shortly."

---

## 4. Auth Flow

**Login:** `POST /api/auth/initiate { email }` triggers OTP email. `POST /api/auth/verify { email, code }` returns `Set-Cookie` with httpOnly session token. Client redirects to `/apps`.

**Session:** Cookie is httpOnly — JS cannot read it. `credentials: "include"` on every fetch sends it automatically. forge-server validates on each request. No client-side token storage.

**Middleware:** Next.js middleware checks for session cookie on `/apps` and `/apps/*` routes. If missing, redirect to `/login`. Cannot validate the cookie server-side (no DB access), so this is a UX optimization — forge-server is the real gatekeeper.

**Review page:** No session required. The one-time `token` query param authenticates the request. forge-server validates and expires it after use (approve or reject). If token is invalid/expired, show "This review link has expired" with a link to login.

---

## 5. Responsive Design

Mobile is critical — owners approve apps from email links on their phones.

- `/login`: single-column centered card, works naturally on mobile.
- `/apps`: single-column card stack on mobile (grid on desktop).
- `/apps/[id]`: tabs stack vertically. `DataTable` gets horizontal scroll on mobile. Activity log is already vertical.
- `/review/[id]`: single-column layout. Sticky approve/reject footer stays visible while scrolling schema details. Buttons are full-width on mobile.

Breakpoints: `sm` (640px) for single→multi column transitions. No custom breakpoints needed beyond Tailwind defaults.

---

## 6. Testing Strategy

**Unit tests (Vitest):**
- `LoginForm`: step transitions, error display, loading states.
- `DataTable`: column rendering, sort callback, pagination callback.
- `StatusBadge`: correct variant per status.
- `api.ts`: mock fetch — verify 401 redirect, error parsing, correct URL construction.

**Integration tests (Playwright):**
- Login flow: email → OTP → redirect to /apps.
- App list → click → detail tabs render.
- Review page: load with token → approve → success message.
- Review page: expired token → error state.
- Mobile viewport: review page approve flow on 375px width.

**What to mock:** All forge-server API calls via MSW (Mock Service Worker) in both Vitest and Playwright.

---

## 7. Tricky Parts

**Token display on create.** The raw token is shown exactly once. If the user closes the dialog, it is gone forever. The dialog must block closing until the user explicitly dismisses it. Use `Dialog` with `onInteractOutside={(e) => e.preventDefault()}` and no X button — only a "I've copied the token" button.

**Cursor-based pagination in DataTable.** No "page 2 of 5" — we only have a cursor for "next". This means no page number display and no "jump to page." The "Load More" pattern is simpler and avoids confusing UX. Store all loaded rows in state (append on load more).

**Schema-driven columns.** `DataTable` columns come from the schema, not hardcoded. The `/api/apps/:id` response includes field definitions. Transform these into `Column[]` at the page level before passing to `DataTable`. Handle unknown field types gracefully (render as string).

**Review page auth edge case.** User clicks approve, but the token was already used (race condition — two tabs, or agent re-submitted). Server returns 410 Gone. Show "This app was already reviewed" instead of a generic error.

**OTP rate limiting.** Disable "Send Code" button for 60s after sending. Use `useEffect` countdown timer. Server also enforces rate limit (429), but client-side timer prevents unnecessary requests and gives clear feedback.

**Shiki bundle size.** Import only the YAML grammar and one dark theme. Use `shiki/bundle/web` for smaller bundle. Lazy-load the `SchemaViewer` component via `next/dynamic` with a loading skeleton since shiki is heavy.

**Cookie scope with cross-origin API.** Console runs on `console.ezyforge.io`, API on `api.ezyforge.io`. The session cookie must have `Domain=.ezyforge.io` and `SameSite=Lax` for cross-subdomain delivery. forge-server sets this on the `/api/auth/verify` response. During local dev, both run on `localhost` with different ports — use `SameSite=Lax` and no `Domain` attribute.
