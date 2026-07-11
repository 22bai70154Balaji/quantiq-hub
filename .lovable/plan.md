# FinFlow AI — Calculators → Financial Analysis Modules

This is a large, multi-phase build. Rather than half-shipping 12 modules at once, I'll roll out a shared "analysis platform" first, then upgrade calculators in waves — starting with the highest-value ones (Mortgage, SIP, EMI, Property, Tax, Currency). The rest inherit the shared shell so they get every feature (charts, AI, save, export, share, PDF) automatically.

## Scope guardrails
- Keep the current premium Apple × Stripe × Linear look, dark/light theme, glass navbar, gradient wash, serif-italic accents — extend, don't replace.
- Reuse shadcn/ui + framer-motion + recharts (already installed). Add `qrcode` + `xlsx` only.
- AI: Lovable AI Gateway (default) with Groq fallback (already wired). No new keys required.
- Everything stays server-safe: PDFs and Excel render client-side; AI + save go through `createServerFn`.

---

## Phase 1 — Shared "Analysis Module" platform

New shared building blocks every calculator plugs into.

**UI kit (src/components/finflow/analysis/)**
- `AnalysisShell` — page frame: sticky KPI header, tabbed sections (Inputs · Results · Breakdown · AI Insights · Compare · Export), print stylesheet, mobile responsive.
- `KpiCard` — animated counter (framer-motion), delta chip, glass surface, semantic tokens only.
- `MultiStepForm` — 2–3 step wizard, progress bar, Zod validation per step, real-time recompute on change.
- `ChartCard` — wraps Recharts (Area/Bar/Pie/Line) with legend, tooltip, theme-aware colors.
- `BreakdownTable` — expandable monthly ↔ yearly rows, virtualized when >120 rows.
- `AssumptionsPanel` — collapsible list of the exact assumptions used + country rule chips.
- `DisclaimerBanner` — reusable "estimates only, verify with your bank" strip.
- `AiInsights` — streams recommendations, uses existing `askFinFlowAi` with a structured prompt.
- `CompareDrawer` — side-by-side comparison of up to 3 scenarios / banks / regimes.
- `ShareBar` — copy shareable link, WhatsApp / X / LinkedIn / email, native `navigator.share` on mobile.

**Data + server**
- `calculations.functions.ts`: `saveCalculation`, `listCalculations`, `getCalculation`, `deleteCalculation` (uses existing `saved_calculations` table + `requireSupabaseAuth`).
- `calc-share.functions.ts`: public read-only `getSharedCalculation({ id })` for shareable links (new column: `is_public boolean default false`).
- `calc-ai.functions.ts`: `explainCalculation({ type, inputs, results, country })` — returns `{ summary, recommendations[], risks[], nextSteps[] }` via Lovable AI Gateway with strict prompt + Groq fallback (reuses `groq.server.ts`).

**Migrations (single migration in Phase 1)**
- Add `is_public boolean not null default false`, `share_slug text unique`, `report_id text` to `saved_calculations`.
- Add owner + public-slug SELECT policies; keep write policies scoped to `auth.uid()`.

**Export engine (src/lib/finflow/export/)**
- `pdf.ts` — extend existing `pdf.ts` (jsPDF) into a premium report renderer:
  branded header (logo + gradient bar), report ID + timestamp, inputs table, KPI summary, chart images (rasterize Recharts SVG → PNG via `html-to-image`), step-by-step breakdown, AI recommendations block, QR code (new `qrcode` dep) linking to `/r/{share_slug}`, page numbers + disclaimer footer on every page.
- `csv.ts` — inputs + full amortization/projection rows.
- `xlsx.ts` — multi-sheet workbook (Summary, Inputs, Breakdown, Assumptions) using `xlsx` lib.
- `print.css` — clean print layout piggybacking `AnalysisShell`.

**Public shareable page**
- New route `src/routes/r.$slug.tsx` (SSR-safe, public server fn, meaningful OG image derived from calc type) — renders a read-only `AnalysisShell` snapshot.

**Dashboard integration**
- Extend `_authenticated/dashboard.tsx` with a "Saved analyses" grid: type badge, KPIs, updated date, resume / share / delete actions.

---

## Phase 2 — Flagship calculators upgraded first

Each is rebuilt on `AnalysisShell` with its own domain logic, charts, breakdown, comparison, and AI prompt.

1. **Mortgage / Home Loan** (`calcs/home-loan-engine.tsx`)
   - Multi-step: property + loan + borrower.
   - Charts: principal-vs-interest area, balance-over-time, monthly payment pie.
   - Breakdown: full amortization (monthly, foldable to yearly).
   - Compare: up to 3 banks (uses `banks.ts`), fixed vs floating, tenure sensitivity.
   - Country rules: IN (stamp duty, PMAY hint), US (PMI, property tax escrow), AE (down-payment min).

2. **SIP / Investment**
   - Steps: goal + horizon + risk.
   - Charts: wealth curve, invested vs gains stacked area, year-wise bar.
   - Compare: SIP vs Lump-sum vs SWP; FD vs Equity vs Hybrid.
   - Country: IN (LTCG 10%), US (LTCG brackets), AE (0%).

3. **EMI (personal / auto / any-loan)**
   - Steps: loan + rate + tenure + prepayment.
   - Prepayment simulator with savings delta KPI.
   - Charts: outstanding balance line, interest paid bar.

4. **Property Cost / Buy-vs-Rent**
   - Steps: property + ownership horizon + rent alternative.
   - Charts: net-worth-over-time line for Buy vs Rent.
   - Compare: 5 / 10 / 20-year horizons.

5. **Tax (IN old vs new; US federal + state hint; AE 9% corp)**
   - Steps: income + deductions + regime.
   - Compare drawer: old vs new regime side-by-side with savings KPI.
   - Country rules chips per jurisdiction.

6. **Currency Converter**
   - Upgraded to a mini-dashboard: history line chart (30 / 90 / 365 d) via existing exchange fn, favorite pairs from `favorite_currencies`, cost-of-transfer note.

---

## Phase 3 — Remaining 6 calculators

Retirement, FD, RD, Credit-card payoff, Freelance take-home, Business loan (or the current set — I'll match `registry.ts`). Each ships on `AnalysisShell` with the same feature set. Lighter domain logic, same export/share/AI pipeline.

---

## Phase 4 — Polish + SEO

- Per-calculator route metadata: unique title/description/OG (dynamic from inputs on share pages).
- JSON-LD `FinancialProduct` / `HowTo` on calculator pages.
- A11y sweep: labels, focus-visible rings, ARIA on tabs/wizard, keyboard nav on breakdown table, `prefers-reduced-motion` guard on KPI counters.
- Mobile: bottom action bar (Save · Share · Export) on <sm screens.
- Playwright screenshot QA per calculator (desktop + mobile, light + dark).
- Update `/disclaimer` link surfacing inside every module footer.

---

## Technical details (for the record)

- Charts render to PNG for PDF via `html-to-image` (offscreen `ChartCard` in a hidden container during export — avoids server-side chart deps).
- `xlsx` and `qrcode` are pure JS, safe in Worker/edge and in the browser.
- No hardcoded colors anywhere — all through `--primary`, `--gold`, `--gradient-*` tokens already in `styles.css`.
- Server functions stay in `src/lib/finflow/*.functions.ts`; helpers in `*.server.ts`.
- `saved_calculations.inputs` / `results` are `jsonb` already — no shape migration needed; each calculator writes its own strongly-typed payload.
- Share slugs are 10-char nanoid, unique; only public rows exposed via anon SELECT policy filtered on `is_public = true`.

---

## Suggested rollout order (one message per bullet, so previews stay stable)

1. Phase 1 platform + migration + export engine + `/r/$slug` + dashboard grid.
2. Mortgage + SIP upgraded (Phase 2 wave A).
3. EMI + Property + Tax + Currency (Phase 2 wave B).
4. Remaining 6 calculators (Phase 3).
5. SEO + a11y + QA polish (Phase 4).

Approve this plan and I'll start with Phase 1 — the shared platform, DB migration, PDF/CSV/Excel engine, shareable public route, and dashboard integration — in the next message.
