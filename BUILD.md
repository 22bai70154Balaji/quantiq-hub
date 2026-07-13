# Calculyx AI — Build & Architecture Guide

A complete reference for customizing Calculyx AI with **Antigravity**, **Claude Code**, **Cursor**, or any other AI coding agent. This document describes the stack, folder layout, runtime boundaries, data flow, and the rules an agent must respect when editing the codebase.

---

## 1. Overview

Calculyx AI is an AI-powered financial intelligence platform:

- Financial calculators (loan, tax, investment, currency)
- AI-generated insights via Groq (Llama 3.3 70B)
- Auth + persistence via Lovable Cloud (Supabase)
- Server-rendered with TanStack Start on Cloudflare Workers
- Transactional email via React Email + Resend

Live: <https://calculyxai.online>

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **TanStack Start v1** (React 19 + Vite 7) |
| Routing | TanStack Router (file-based, `src/routes/`) |
| Runtime | Cloudflare Workers (via Nitro preset) |
| Styling | Tailwind CSS v4 (`src/styles.css`) + shadcn/ui |
| Animation | Framer Motion |
| Charts | Recharts |
| State/Data | TanStack Query |
| Backend | Lovable Cloud (Supabase: Postgres + Auth + Storage) |
| AI | Groq API (Llama 3.3 70B Versatile) |
| Email | Resend + `@react-email/components` |
| PDF | Custom PDF generation (`src/lib/finflow/pdf.ts`) |
| Auth | Supabase Auth (email + Google OAuth) |

---

## 3. Folder Structure

```
├── BUILD.md                       ← this file
├── README.md
├── package.json
├── vite.config.ts                 ← extends @lovable.dev/vite-tanstack-config
├── tsconfig.json                  ← strict TS, @/* → src/*
├── components.json                ← shadcn config
│
├── public/                        ← static assets (favicon, manifest, sitemap, robots)
│
├── supabase/
│   ├── config.toml                ← auto-managed; do not edit project-level settings
│   └── migrations/                ← SQL migrations (timestamped)
│
└── src/
    ├── server.ts                  ← SSR entrypoint (error wrapper for h3)
    ├── start.ts                   ← createStart(): global server middleware
    ├── router.tsx                 ← TanStack router setup + QueryClient context
    ├── routeTree.gen.ts           ← AUTO-GENERATED — never edit
    ├── styles.css                 ← Tailwind v4 config + theme tokens
    │
    ├── routes/                    ← file-based routes
    │   ├── __root.tsx             ← HTML shell, <head>, providers, <Outlet/>
    │   ├── index.tsx              ← / (landing)
    │   ├── calculators.tsx        ← /calculators (grid)
    │   ├── ai.tsx                 ← /ai (chat)
    │   ├── news.tsx               ← /news
    │   ├── auth.tsx               ← /auth
    │   ├── about.tsx contact.tsx privacy.tsx terms.tsx cookies.tsx disclaimer.tsx
    │   ├── r.$slug.tsx            ← /r/:slug shared report
    │   ├── _authenticated/
    │   │   ├── route.tsx          ← auth gate (redirects to /auth)
    │   │   ├── dashboard.tsx      ← /dashboard
    │   │   └── calc.$type.tsx     ← /calc/:type (dynamic calculator)
    │   └── lovable/email/…        ← email preview + webhook (system, do not modify)
    │
    ├── components/
    │   ├── ui/                    ← shadcn primitives
    │   ├── theme-provider.tsx
    │   └── finflow/               ← app-specific UI
    │       ├── navbar.tsx footer.tsx hero.tsx
    │       ├── calc-shell.tsx     ← calculator layout wrapper
    │       ├── calculators-grid.tsx
    │       ├── calcs/             ← individual calculators (emi, sip, fd, …)
    │       ├── analysis/          ← results/report UI (KPI grid, tables, PDF preview)
    │       ├── news-section.tsx testimonials.tsx status-bar.tsx …
    │
    ├── lib/
    │   ├── utils.ts               ← cn() helper
    │   ├── error-capture.ts error-page.ts lovable-error-reporting.ts
    │   ├── email-templates/       ← React Email templates + send-email.ts
    │   └── finflow/
    │       ├── groq.server.ts     ← Groq API client (SERVER ONLY)
    │       ├── *.functions.ts     ← createServerFn RPCs (client-callable)
    │       ├── analysis/          ← calculation logic + insights
    │       ├── calculators.ts registry.ts   ← calculator metadata
    │       ├── countries.ts country-store.ts tax-rules.ts tax-tips.ts banks.ts home-loan.ts
    │       └── pdf.ts
    │
    ├── hooks/use-mobile.tsx
    ├── integrations/
    │   ├── lovable/               ← Lovable Cloud helpers
    │   └── supabase/              ← AUTO-GENERATED clients + middleware
    │       ├── client.ts          ← browser client
    │       ├── client.server.ts   ← admin client (service role, .server only)
    │       ├── auth-middleware.ts ← requireSupabaseAuth for server fns
    │       ├── auth-attacher.ts   ← attaches bearer to server-fn calls
    │       └── types.ts
    └── assets/
```

---

## 4. Runtime Boundaries (CRITICAL)

TanStack Start is **isomorphic**. The wrong boundary leaks secrets or crashes SSR.

| Concern | Where it runs |
|---------|--------------|
| Route loaders | Server (SSR) **and** client (navigation) |
| `.functions.ts` files | Handler bodies stripped from client bundle |
| `.server.ts` files | Server only (blocked from client bundle) |
| Route `component` | Server (SSR) then client hydration |
| `useEffect`, event handlers | Client only |

**Rules:**

1. **Secrets** (`GROQ_API_KEY`, `RESEND_API_KEY`, `LOVABLE_API_KEY`): read `process.env.X` **inside** a `.handler()` body — never at module scope.
2. **Browser globals** (`window`, `document`, `localStorage`): only inside `useEffect`, event handlers, or `<ClientOnly>`.
3. **Client-callable server work** → `createServerFn` in `*.functions.ts`.
4. **Webhooks / public HTTP** → server route under `src/routes/api/public/*` (must verify signatures).
5. **Never import `.server.ts` from route/component files** — only from other `.server.ts` or from inside a `.handler()`.

Example canonical server function (see `src/lib/finflow/ai.functions.ts`):

```ts
export const askFinFlowAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])      // auth-only, injects context.supabase
  .inputValidator((d) => Schema.parse(d)) // Zod validation
  .handler(async ({ data, context }) => {
    const key = process.env.GROQ_API_KEY; // read inside handler
    // …
  });
```

---

## 5. Routing

File-based — filename dots become URL slashes:

| File | URL |
|------|-----|
| `index.tsx` | `/` |
| `calculators.tsx` | `/calculators` |
| `r.$slug.tsx` | `/r/:slug` |
| `_authenticated/dashboard.tsx` | `/dashboard` (gated) |
| `_authenticated/calc.$type.tsx` | `/calc/:type` (gated) |

- The **auth gate** lives in `src/routes/_authenticated/route.tsx`. Any route under `_authenticated/` requires a session; unauthenticated users are redirected to `/auth`.
- **Never edit** `src/routeTree.gen.ts` — the Vite plugin regenerates it.
- Add a route: create a file → the plugin picks it up on next build/dev.
- Every route with distinct content owns its own `head()` for SEO (title, description, og:*). Add `og:image` only at leaf routes, never on `__root.tsx`.

---

## 6. Data Model (Supabase)

Managed via migrations in `supabase/migrations/`. Core tables:

- `profiles` — user profile (linked to `auth.users`)
- `saved_calculations` — persisted calculation runs with `ai_insights` JSON
- `user_roles` + `app_role` enum + `has_role()` — role checks
- (Plus any additional feature tables added via migrations.)

**Rules when adding a table:**

1. `CREATE TABLE public.<name>(...)`
2. `GRANT` (usually `SELECT, INSERT, UPDATE, DELETE ON … TO authenticated;` + `GRANT ALL … TO service_role;`)
3. `ALTER TABLE … ENABLE ROW LEVEL SECURITY`
4. `CREATE POLICY …` scoped to `auth.uid()`

Never store roles on `profiles` — always use the separate `user_roles` table.

---

## 7. AI Layer

- **Provider:** Groq (OpenAI-compatible chat completions API)
- **Model:** `llama-3.3-70b-versatile` (`GROQ_MODEL` in `groq.server.ts`)
- **Client:** `callGroq(messages, { json?, temperature?, model? })` in `src/lib/finflow/groq.server.ts`
- **Entry points:**
  - `ai.functions.ts` — general chat (`askFinFlowAi`)
  - `analysis/insights.functions.ts` — structured JSON insights per calculation
  - `home-loan-ai.functions.ts` — home-loan-specific advisor
  - `news.functions.ts` — AI-generated finance news (10 min in-memory cache)

Fallbacks exist for missing `GROQ_API_KEY` — features degrade instead of crashing.

> To swap providers (e.g. Lovable AI Gateway / OpenAI), replace `callGroq` internals; callers do not change.

---

## 8. Email

- Templates in `src/lib/email-templates/*.tsx` using `@react-email/components`.
- Registry: `src/lib/email-templates/registry.ts`.
- Sending: `src/lib/email-templates/send-email.ts` (Resend).
- Auth-flow emails (magic link, recovery, signup, invite, email-change, reauth) preview at `/lovable/email/auth/preview` and are triggered by Supabase via the webhook at `/lovable/email/auth/webhook`.
- Transactional emails preview at `/lovable/email/transactional/preview`; send them from server functions such as `contact-email.functions.ts` and `welcome-email.functions.ts`.

---

## 9. Styling & Theming

- Tailwind CSS v4 configured entirely in `src/styles.css` via `@theme` and CSS variables. No `tailwind.config.js`.
- Design tokens: semantic (`--background`, `--foreground`, `--primary`, `--success`, `--warning`, `--destructive`, plus glass/sheen utilities).
- **Never hardcode colors** (`bg-black`, `text-white`, `bg-[#…]`) in components — use tokens so light/dark mode works.
- Fonts: Inter (body), Space Grotesk (display), Fraunces / Instrument Serif (accents), JetBrains Mono (numbers). All loaded via `@fontsource-variable/*` packages.
- Theme switching: `src/components/theme-provider.tsx` (light/dark/system).

---

## 10. Environment Variables

| Var | Where | Notes |
|-----|-------|-------|
| `VITE_SUPABASE_URL` | client + server | auto-managed by Lovable Cloud |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client + server | auto-managed |
| `VITE_SUPABASE_PROJECT_ID` | client | auto-managed |
| `GROQ_API_KEY` | server only | required for AI features |
| `RESEND_API_KEY` | server only | required for transactional email |
| `LOVABLE_API_KEY` | server only | if using Lovable AI Gateway |

- `VITE_*` values are inlined in the client bundle — never store secrets there.
- Secrets are read inside `.handler()` bodies, not at module scope.
- Add secrets via Lovable's secrets tool or `.env` locally.

---

## 11. Local Development

```bash
# install
bun install                  # or: npm install

# dev
bun dev                      # vite dev on :8080

# type + lint + format
bun run lint
bun run format

# build
bun run build                # production build (Cloudflare Workers target)
bun run build:dev            # dev-mode build
bun run preview              # preview the build
```

Node 20+ required. The dev server auto-restarts on file changes.

---

## 12. Deployment

- Hosted on Lovable's Cloudflare Workers infrastructure.
- **Preview URL:** `https://project--{project-id}-dev.lovable.app`
- **Production URL:** `https://project--{project-id}.lovable.app`
- **Custom domain:** `https://calculyxai.online`
- SSR entrypoint is `src/server.ts` (wrapped for h3-swallowed errors).
- Cloudflare Workers do not support: `child_process`, `sharp`, `puppeteer`, native addons, arbitrary FS. Use fetch-based clients only.

---

## 13. Rules for AI Agents (Antigravity / Claude / Cursor)

When editing this codebase, an agent MUST:

1. **Never edit auto-generated files:**
   - `src/routeTree.gen.ts`
   - `src/integrations/supabase/{client.ts,client.server.ts,auth-middleware.ts,auth-attacher.ts,types.ts}`
   - `supabase/config.toml` project-level settings
   - `.env` (auto-managed keys)
2. **Never bypass the runtime boundary rules** (§4).
3. **Never hardcode colors** — use semantic tokens (§9).
4. **Never store roles on profiles** — use `user_roles` (§6).
5. **Always add `GRANT` + RLS policies** when creating public-schema tables.
6. **Always read secrets inside `.handler()`**, never at module scope.
7. **Prefer `createServerFn`** for app-internal server logic. Use server routes only for webhooks / public APIs.
8. **Every shareable route** owns its own `head()` metadata; `og:image` only at leaf routes.
9. **Never author `src/routeTree.gen.ts`** — create a file under `src/routes/` and let the plugin regenerate.
10. **Prefer small parallel edits** over large rewrites.

Suggested prompt preamble for external agents:

> "You are editing a TanStack Start v1 app deployed to Cloudflare Workers. Read BUILD.md before making changes. Respect the runtime boundaries: secrets and DB queries go inside `createServerFn().handler()`; browser globals only inside `useEffect`. Never edit `src/routeTree.gen.ts` or files under `src/integrations/supabase/`. Use Tailwind v4 semantic tokens from `src/styles.css`, never hardcoded colors. Add migrations under `supabase/migrations/` with GRANT + RLS for any new public table."

---

## 14. Adding Features — Recipes

### Add a new calculator
1. Add metadata entry in `src/lib/finflow/calculators.ts` and `registry.ts`.
2. Create component under `src/components/finflow/calcs/<name>-calc.tsx`.
3. If it needs AI insights, add a `*.functions.ts` server fn calling `callGroq`.
4. It auto-appears in `/calculators` grid and at `/calc/<type>`.

### Add a new page
1. Create `src/routes/<slug>.tsx` with `createFileRoute("/<slug>")({ head: () => ({...}), component: … })`.
2. Add nav entry in `src/components/finflow/navbar.tsx`.
3. Add to `public/sitemap.xml`.

### Add a table
1. Create `supabase/migrations/<timestamp>_<name>.sql` with CREATE + GRANT + RLS + POLICY.
2. Types regenerate into `src/integrations/supabase/types.ts` automatically.
3. Query it from a `createServerFn` using `context.supabase` (from `requireSupabaseAuth`).

### Add a server function
```ts
// src/lib/finflow/foo.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const doFoo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ x: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    // context.supabase, context.userId available
    return { ok: true };
  });
```
Call from a component with `useServerFn(doFoo)` or inside a loader directly.

---

## 15. Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `process.env.X is undefined` | Read at module scope instead of inside `.handler()` |
| Blank page / route mismatch | `createFileRoute("…")` string doesn't match filename |
| `Unauthorized` on server-fn call | Missing `attachSupabaseAuth` middleware in `src/start.ts` |
| `[unenv] X is not implemented` | Node-only API used in Worker runtime — swap library |
| Hydration mismatch | Reading `window`/`localStorage` in render or useState initializer |
| PostgREST permission error | Missing `GRANT` on new public table |

Server logs: use the `server-function-logs` tool (production first, preview as fallback).

---

**Architecture diagram** (`/mnt/documents/architecture.mmd`) available on request — ask the agent to render it as a Mermaid artifact.
