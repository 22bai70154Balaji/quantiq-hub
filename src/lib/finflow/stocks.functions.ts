import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CATALOG, US_TOP_50, IN_TOP_50, getCatalogEntry } from "./stocks-catalog";
import { fetchIndianStockSnapshot, fetchYahooQuote as fetchYahooMarketQuote } from "./stock-market.server";

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  currency: string;
  region: "US" | "IN";
};

// Backwards-compatible export used elsewhere in the app.
const POPULAR = CATALOG.slice(0, 16);
export const META_BY_SYMBOL: Record<string, { symbol: string; name: string; region: "US" | "IN"; currency: string; assumedReturn: number }> = Object.fromEntries(
  CATALOG.map((p) => [p.symbol, { symbol: p.symbol, name: p.name, region: p.region, currency: p.currency, assumedReturn: p.assumedReturn }]),
);

async function fetchIndianQuote(name: string): Promise<Omit<StockQuote, "name" | "region"> | null> {
  const snapshot = await fetchIndianStockSnapshot(name);
  return snapshot ? { ...snapshot.quote, symbol: "" } : null;
}

async function fetchQuote(symbol: string, companyName?: string): Promise<Omit<StockQuote, "name" | "region"> | null> {
  const isIndian = symbol.endsWith(".NS") || symbol.endsWith(".BO");
  if (isIndian && companyName) {
    const ind = await fetchIndianQuote(companyName);
    if (ind) return { ...ind, symbol };
  }
  const key = process.env.FINNHUB_API_KEY;
  if (key) {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`);
      if (res.ok) {
        const j = (await res.json()) as { c?: number; d?: number; dp?: number; h?: number; l?: number; o?: number; pc?: number };
        const price = Number(j?.c ?? 0);
        if (Number.isFinite(price) && price > 0) {
          const currency = isIndian ? "INR" : "USD";
          return {
            symbol,
            price,
            change: Number(j.d ?? 0),
            changePercent: Number(j.dp ?? 0),
            high: Number(j.h ?? 0),
            low: Number(j.l ?? 0),
            open: Number(j.o ?? 0),
            prevClose: Number(j.pc ?? 0),
            currency,
          };
        }
      }
    } catch { /* fall through to Yahoo */ }
  }
  // Yahoo Finance fallback — free, no key, supports .NS/.BO listings and global tickers.
  return await fetchYahooMarketQuote(symbol);
}


export const listLiveStocks = createServerFn({ method: "GET" }).handler(async (): Promise<StockQuote[]> => {
  const results = await Promise.all(
    POPULAR.map(async (p) => {
      const q = await fetchQuote(p.symbol, p.name);
      if (!q) return null;
      return { ...q, name: p.name, region: p.region } satisfies StockQuote;
    }),
  );
  return results.filter((r): r is StockQuote => r !== null);
});

export const fetchQuotesForSymbols = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ symbols: z.array(z.string().min(1).max(20)).min(1).max(10) }).parse(d))
  .handler(async ({ data }): Promise<StockQuote[]> => {
    const results = await Promise.all(
      data.symbols.map(async (sym) => {
        const s = sym.trim().toUpperCase();
        const meta = META_BY_SYMBOL[s] ?? META_BY_SYMBOL[`${s}.NS`];
        const q = await fetchQuote(meta?.symbol ?? s, meta?.name);
        if (!q) return null;
        return { ...q, name: meta?.name ?? s, region: meta?.region ?? (q.currency === "INR" ? "IN" : "US") } satisfies StockQuote;
      }),
    );
    return results.filter((r): r is StockQuote => r !== null);
  });

export const listTopStocks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ market: z.enum(["US", "IN", "GLOBAL"]) }).parse(d))
  .handler(async ({ data }): Promise<StockQuote[]> => {
    const src = data.market === "US" ? US_TOP_50
      : data.market === "IN" ? IN_TOP_50
      : [...US_TOP_50.slice(0, 25), ...IN_TOP_50.slice(0, 25)];
    // Batch in chunks of 10 to keep per-request latency reasonable.
    const results: (StockQuote | null)[] = [];
    const chunk = 10;
    for (let i = 0; i < src.length; i += chunk) {
      const batch = src.slice(i, i + chunk);
      // eslint-disable-next-line no-await-in-loop
      const settled = await Promise.all(batch.map(async (p) => {
        const q = await fetchQuote(p.symbol, p.name);
        if (!q) return null;
        return { ...q, name: p.name, region: p.region } satisfies StockQuote;
      }));
      results.push(...settled);
    }
    return results.filter((r): r is StockQuote => r !== null);
  });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keepCatalog = getCatalogEntry;


