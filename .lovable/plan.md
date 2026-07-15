# Plan: Stock Detail Hub, Top-50 Live Lists & Calculator Suite

This is a large scope. I'll ship it in structured phases so each is reviewable and useful on its own. Confirm the phasing (or tell me which phases to drop / do first) and I'll start building.

## Scope Summary

1. **Top 50 live stocks** for **India (NSE)**, **US**, and a combined **Global** view on `/stocks`, with tabs and live prices.
2. **Stock detail page** at `/stocks/$symbol` with tabbed sections: Overview, Chart, Financial Health, AI Summary, News, Earnings, Insider Activity, Analyst Ratings.
3. **Calculators suite** (15 calculators) — expand `/calculators` into a hub, plus embed the top ~7 inside the stock detail page contextually.
4. **AI Insights** panel per stock (Bull/Bear/Risks/Valuation/etc.) using Lovable AI (Gemini 3 Flash), cached per symbol.

## Phase 1 — Top 50 Live Lists (foundation)
- `getTopStocks({ market: 'IN' | 'US' | 'GLOBAL' })` server fn:
  - IN: Indian Stock API `/NSE_most_active` + curated Nifty 50 list.
  - US: Finnhub `stock/symbol` filtered to S&P 50 curated list (already have Finnhub).
  - GLOBAL: merge top 25 IN + top 25 US.
- `/stocks` gets 3 tabs (India / US / Global), each rendering a live-updating table (logo, symbol, name, price, % change, sparkline placeholder).
- Reuse existing `StockLogo` component and `getStockPrice` batching.

## Phase 2 — Stock Detail Page `/stocks/$symbol`
Sections (tabbed on mobile, stacked cards on desktop):
- **Header**: logo, name, symbol, live price, day change, market cap.
- **Chart**: 1D/5D/1M/6M/1Y/5Y using Indian Stock API `/historical_data` (IN) and Finnhub candles (US). Recharts.
- **AI Summary + Bull/Bear/Risks**: single Gemini call → cached in `holding_prices` sibling table or in-memory LRU for 6h.
- **Financial Health Score** (0–100): computed from D/E, ROE, ROCE, profit growth, FCF sign — server-side.
- **News**: existing `/news` sources filtered by symbol/company name.
- **Earnings / Analyst Ratings / Insider Activity**: Indian Stock API endpoints for IN; Finnhub `/stock/recommendation`, `/stock/insider-transactions`, `/stock/earnings` for US.
- **5-Year Financial Trends**: Revenue, Profit, FCF, ROE, ROCE, D/E from Indian Stock API `/stock` / Finnhub `/stock/metric`.
- **Competitors**: same-sector top 5 (AI-derived + verified via price API).

## Phase 3 — Calculator Suite (15)
New shared components under `src/components/calculators/`:
1. SIP  2. Lumpsum  3. CAGR  4. Dividend  5. Brokerage (Zerodha/Groww/Angel One/Kotak Neo/Robinhood/IBKR)  6. Stock Average  7. Position Size  8. Profit/Loss  9. CAGR vs FD/Gold/SIP  10. FIRE  11. Goal Planner  12. Portfolio Allocator (age + risk)  13. Rebalancing  14. SWP  15. DCA.

- `/calculators` becomes a hub with cards linking to each — no separate routes; use a single route with query param `?c=sip` OR a modal system. I'll use in-page tabs with URL search params for shareability.
- Stock detail page embeds a compact `<CalculatorsStrip />` showing SIP, Lumpsum, Profit/Loss, Dividend, Brokerage, Average, Position Size — prefilled with the stock's current price.

## Phase 4 — Premium Dashboard Polish
- Sticky header on stock page with logo/price/change.
- Quick Stats card (P/E, P/B, Div Yield, 52w H/L, Beta, Volume).
- Section anchors + smooth-scroll TOC on desktop.
- Loading skeletons + graceful fallbacks when an API section is unavailable.

## Technical Notes
- New route: `src/routes/stocks.$symbol.tsx` (typed params).
- New server fns in `src/lib/finflow/`:
  - `top-stocks.functions.ts` — top 50 lists
  - `stock-detail.functions.ts` — merged detail payload
  - `stock-ai.functions.ts` — Gemini AI insights (bull/bear/risks/summary)
  - `stock-fundamentals.functions.ts` — financial health score + 5y trends
- Brokerage/tax formulas hardcoded in `src/lib/finflow/brokerage.ts` (per-broker slabs, STT, GST, SEBI, stamp duty for IN; SEC/FINRA fees for US).
- All external calls: server-side only, with 60s (quotes) / 24h (fundamentals, news) caching via existing `holding_prices` pattern or a new `market_data_cache` table.
- Data API grants + RLS on any new tables.

## Deliverable Order I Recommend
1. Phase 1 (top 50 lists) + Phase 2 header/chart/quick-stats — 1 pass.
2. Phase 3 (all 15 calculators + hub) — 1 pass.
3. Phase 2 remaining tabs (AI, news, earnings, ratings, financials) — 1 pass.
4. Phase 4 polish — 1 pass.

## Questions Before I Start
1. **Chart library**: keep Recharts (already in project) or switch to lightweight-charts for candlesticks?
2. **US data source for fundamentals/earnings/insider**: Finnhub free tier covers most — OK to use, or do you want Alpha Vantage / another key?
3. **Calculator UX**: single `/calculators` route with tabs, or one route per calculator (`/calculators/sip`, etc.) for SEO?
4. **Curated Top-50 lists**: OK to hardcode Nifty 50 tickers and a US "top 50 by market cap" list, refreshed manually? (True live rankings need a paid screener.)

Reply with answers or "go ahead with defaults" and I'll start Phase 1.