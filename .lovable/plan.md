# Calculyx — Financial OS Roadmap

Goal: evolve Calculyx from calculators + AI chat into a personal Financial OS: net worth, portfolio, live prices, AI analysis, and document intelligence. Each phase ships end-to-end (schema → server fns → UI → dashboard link) before the next starts.

---

## Phase 0 — Groq guardrail (SHIPPED)

Tightened the `askFinFlowAi` system prompt in `src/lib/finflow/ai.functions.ts`:
- Hard scope: personal finance / investing / tax / calculators only.
- Soft steer: greetings answered warmly; other off-topic answered with a one-line refusal + 2 finance suggestions.
- Prompt-injection resistant (ignore "ignore previous instructions" attempts).

No schema changes.

---

## Phase 1 — Net Worth Dashboard

**Goal:** every signed-in user has `/dashboard` showing Net Worth = Assets − Liabilities, with breakdown cards and month-over-month delta.

**Schema (one migration):**
```
public.net_worth_entries
  id uuid pk, user_id uuid fk auth.users, category enum
    ('cash','investments','real_estate','other_asset',
     'loan','credit_card','other_liability'),
  kind enum('asset','liability'),
  label text, amount numeric(14,2), currency text default 'INR',
  as_of date default current_date,
  created_at, updated_at
```
+ GRANTs to authenticated + RLS `auth.uid() = user_id`.
+ `touch_updated_at` trigger.

**Server fns (`src/lib/finflow/dashboard.functions.ts`):**
- `listNetWorthEntries()` → grouped by category
- `upsertNetWorthEntry({ id?, category, kind, label, amount, currency })`
- `deleteNetWorthEntry({ id })`
- `getNetWorthSnapshot()` → `{ total, assets, liabilities, byCategory, deltaPct }` (deltaPct compares latest month vs previous month via `as_of`)

**Routes / UI:**
- `src/routes/_authenticated/dashboard.tsx` gets a **Net Worth** hero card (large ₹ figure + ▲/▼ %) and 6 breakdown cards (Cash, Investments, Real Estate, Other Assets, Loans, Credit Cards).
- New `src/components/finflow/dashboard/NetWorthPanel.tsx` + `EntryDialog.tsx` (add/edit modal per category).
- Currency respects `profiles.currency`.

**Nav:** existing `/dashboard` route already gated by `_authenticated`.

**Definition of done:** user can add "Home ₹32,00,000", "Home Loan ₹9,50,000", see Net Worth `₹22,50,000` update live, delta computed once ≥2 months of data.

---

## Phase 2 — Portfolio Tracker

**Goal:** add holdings across asset classes; see portfolio value, today's gain, annual return, allocation ring.

**Schema:**
```
public.holdings
  id, user_id, asset_class enum
    ('stock','etf','mutual_fund','crypto','gold',
     'fd','bond','epf','ppf','nps'),
  symbol text,           -- e.g. RELIANCE.NS, BTC, MF scheme code
  name text,
  quantity numeric(18,6),
  avg_cost numeric(18,4),
  currency text default 'INR',
  purchase_date date,
  notes text,
  created_at, updated_at

public.holding_prices        -- cache to avoid API hammering
  symbol text, asset_class enum, price numeric(18,4),
  currency text, fetched_at timestamptz,
  primary key (symbol, asset_class)
```

**Server fns (`portfolio.functions.ts`):**
- `listHoldings()` → holdings joined with latest cached price → value, gain, gain%.
- `upsertHolding()`, `deleteHolding()`
- `getPortfolioSummary()` → `{ value, todayGain, annualReturnPct, riskBand, diversificationScore, allocation[] }`
  - riskBand: rules-based from allocation (>60% single class = High).
  - diversificationScore: HHI-based 0–100.

**UI:**
- `src/routes/_authenticated/portfolio.tsx` (new route)
- KPI grid (reuse `KpiGrid`), allocation donut (Recharts), holdings table with inline add.
- Link from `/dashboard`: "Portfolio ₹X — view →" card, and Portfolio value auto-feeds Net Worth's `investments` category (computed, read-only).

**Definition of done:** add 3 mock holdings → see value, allocation %, risk badge.

---

## Phase 3 — Live Market Data

**Goal:** replace manual price entry with live prices where possible.

**Providers chosen:**
- **Finnhub** for stocks/ETFs (US + `.NS`/`.BO` for India). User adds `FINNHUB_API_KEY` secret. Free tier 60 req/min.
- **CoinGecko** for crypto (no key needed).
- **Frankfurter / existing exchange fn** for FX (already wired).
- **Manual NAV** for Indian mutual funds (fallback: AMFI NAVAll.txt daily parse in Phase 3.1).
- **Gold**: goldapi.io optional, or manual MCX price.

**Server route (public API, cached):** `src/routes/api/public/prices.ts`
- POST `{ symbols: [{ symbol, asset_class }] }` → returns prices, uses `holding_prices` cache with 15-min TTL, calls Finnhub/CoinGecko as needed.
- Signed via `x-calculyx-key` header shared with the client-side refresh button (rate-limited per user).

**Refresh flow:**
- Portfolio page has "Refresh prices" button → calls `refreshPortfolioPrices()` server fn which fans out to providers, updates `holding_prices`.
- Background: on-demand only (no cron in Phase 3); Phase 3.1 can add pg_cron.

**Secrets to add:** `FINNHUB_API_KEY` (I'll request via `add_secret` when we start Phase 3).

**Definition of done:** click Refresh → RELIANCE.NS + BTC + AAPL prices update from live sources, portfolio value recalculates.

---

## Phase 4 — AI Portfolio Analysis

**Goal:** turn the portfolio summary into narrative advice, not just numbers.

**Server fn (`portfolio-ai.functions.ts`):**
- `analyzePortfolio()` builds a compact brief from `getPortfolioSummary()` (allocation %, top concentrations, cash months vs monthly expense from Net Worth cash / user-entered monthly spend) → calls Groq with a strict JSON schema:
```
{ diagnosis: string,
  concentrationFlags: string[],
  diversificationScore: number,
  emergencyFundMonths: number,
  recommendations: [{ action, rationale, impact }],
  confidence: 'low'|'medium'|'high' }
```
- Reuses the tightened system prompt + `analyzeCalculation` pattern from `insights.functions.ts`.
- Stored on `holdings_ai_reports` table (id, user_id, generated_at, payload jsonb) so re-open is instant.

**UI:** `PortfolioAiPanel` on `/portfolio` — same visual language as `AiInsightsPanel`, with a "Diversification 61/100" gauge and recommendation cards.

**Definition of done:** with a tech-heavy mock portfolio, AI says "72% technology, gold under-weighted, emergency fund 2.3 months".

---

## Phase 5 — Document Intelligence

**Goal:** upload financial documents → AI extracts structured data → prefills dashboard.

**Storage:** private Supabase bucket `user-documents` (per-user folder, RLS by prefix).

**Schema:**
```
public.documents
  id, user_id, kind enum
    ('bank_statement','salary_slip','tax_return',
     'loan_agreement','mf_statement','demat_statement'),
  storage_path text, original_name text,
  status enum('uploaded','processing','extracted','failed'),
  extracted jsonb,      -- {income[], expenses[], holdings[], liabilities[], taxes[]}
  applied boolean default false,
  created_at, updated_at
```

**Pipeline:**
1. Client uploads PDF/image to bucket (signed upload URL via server fn).
2. `processDocument({ id })` server fn:
   - downloads with service role
   - PDF text via `pdf-parse` (worker-compatible fork) or Groq multimodal on rasterized pages (Groq supports images on select models — verify at build time)
   - passes text to Groq with a per-kind extraction schema
   - stores `extracted` JSON, marks `extracted`
3. `applyDocument({ id, selections })` — user confirms → we insert into `net_worth_entries` / `holdings`, mark `applied=true`.

**UI:** `/documents` route — upload dropzone, per-doc card with status pill, "Review & apply" modal listing extracted rows with checkboxes.

**Guardrails:**
- 10 MB max, PDF/JPG/PNG only.
- Groq scope prompt: "You are a document extractor. Only extract fields listed. Return strict JSON. Redact account numbers to last 4."
- Never surface raw doc content to the chat AI.

**Definition of done:** upload a salary slip → see extracted `income.gross`, `deductions.pf`, `deductions.tax` → one click adds to Net Worth cash / EPF holding.

---

## Cross-cutting

- **Currency**: everything stored with `currency` column; UI displays in `profiles.currency` using existing formatter. Multi-currency conversion via existing `exchange.functions.ts`.
- **RLS**: every new table gets `GRANT ... TO authenticated`, `GRANT ALL ... TO service_role`, RLS enabled, `auth.uid() = user_id` policy. Documents bucket uses per-user prefix policy.
- **Types**: regenerated automatically after each migration — no manual edits to `src/integrations/supabase/types.ts`.
- **Testing**: after each phase, run `bun run build` + smoke-test the new route while signed in.

---

## Execution order & checkpoints

I'll build in this sequence, pausing after each phase for you to try it:

1. ✅ Phase 0 guardrail (done this turn)
2. Phase 1 Net Worth Dashboard — ~1 session
3. Phase 2 Portfolio Tracker — ~1 session
4. Phase 3 Live prices (Finnhub + CoinGecko) — ~1 session, will request `FINNHUB_API_KEY`
5. Phase 4 AI Portfolio Analysis — ~½ session
6. Phase 5 Document Intelligence — ~1–2 sessions

Say **"start Phase 1"** when you're ready.
