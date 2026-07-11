## What you'll get

### 1. PDF preview step (all calculators)
Before the PDF downloads, a full-screen preview modal opens showing exactly what will be in the report:
- Header with Calculyx branding, Report ID, timestamp
- Inputs, KPI cards, charts (screenshotted from the live page), AI recommendations in the boxed card, assumptions
- Footer with "Download PDF" and "Cancel" buttons

Implementation: reuse the existing `exportPdf` renderer, but split it into a *build* step (returns a `jsPDF` doc) and a *save* step. The preview modal embeds the built PDF via a blob URL in an `<iframe>` — this shows the real, final PDF pixel-for-pixel, not a mockup. Download button calls `doc.save()`. This replaces the current "Export → PDF" flow in `AnalysisActions`.

### 2. Currency Converter upgrades
- **Historical chart** — 30 / 90 / 365-day line chart of the from→to rate. Fetched from a public FX history endpoint via a server function so we don't ship an API key.
- **Trend indicator** — % change over the selected window, sparkline in the result card, "strengthening/weakening" tag.
- **Favorites** — star icon on the currency pickers, favorites row pinned to the top of both selectors. Stored in `localStorage` (`calculyx.fav.currencies`).
- **PDF report** picks up the historical chart as an additional visualisation.

### 3. Tax Calculator upgrades
- **Country-specific rule cards** — a collapsible "Rules applied" panel showing the exact slabs / brackets used (India new regime, USA federal single, UAE nil), pulled from a small `tax-rules.ts` catalog.
- **Tax-saving suggestions** — a rules-based helper (`taxSavingTips.ts`) that inspects income + country and surfaces country-specific ideas (India: 80C/NPS/HRA, USA: 401k/HSA/IRA, UAE: N/A note). Rendered in a boxed card on-page and flowed into the AI Insights section of the payload as `recommendations` seeds.

### 4. SIP & FD upgrades
- **Interactive growth chart** — SIP already has one; upgrade both to a toggleable Area/Bar view with invested-vs-value stacking, hover tooltips, and year-scrubber. Add the same style to FD.
- **Goal-based planning** — new "Goal mode" toggle: user enters a target amount and target year; the calculator solves for monthly SIP or FD principal needed. Result panel shows required contribution, shortfall/surplus vs current inputs, and a "How to close the gap" tip.

## Technical notes

Files touched (approx.):

```
src/lib/finflow/analysis/export-pdf.ts     split build/save
src/lib/finflow/analysis/pdf-preview.tsx   NEW  iframe modal
src/components/finflow/analysis/AnalysisActions.tsx   hook preview in
src/lib/finflow/fx-history.functions.ts    NEW  server fn, cached
src/components/finflow/calcs/currency-calc.tsx        history + favorites + trend
src/lib/finflow/tax-rules.ts               NEW  slabs catalog
src/lib/finflow/tax-tips.ts                NEW  suggestion engine
src/components/finflow/calcs/simple-calc.tsx          rules panel + tips for income-tax slug
src/components/finflow/calcs/sip-calc.tsx             goal mode + upgraded chart
src/components/finflow/calcs/fd-*                     new dedicated fd-calc.tsx with chart + goal mode; SimpleCalc "fd" slug delegates to it
```

Data / infra:
- Historical FX uses `https://api.frankfurter.dev/v1/{from}..{to}?...` (no key, CORS-open) inside a `createServerFn` with a 1-hour in-memory cache to reduce calls.
- Favorites and goal-mode inputs persist in `localStorage` only — no schema changes.
- No new secrets or backend tables.

Out of scope unless you ask:
- Multi-currency baskets, cross-rate matrices, alerts.
- Federal-plus-state US tax, India old regime, GCC corporate tax.
- Server-persisted goals (currently local).

Ship order: (1) PDF preview → (2) Currency history + favorites → (3) Tax rules + tips → (4) SIP/FD goal mode + charts.