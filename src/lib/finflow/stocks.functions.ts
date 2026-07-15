import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

// Curated popular tickers per region.
const POPULAR: Array<{ symbol: string; name: string; region: "US" | "IN"; currency: string; assumedReturn: number }> = [
  { symbol: "AAPL", name: "Apple Inc.", region: "US", currency: "USD", assumedReturn: 15 },
  { symbol: "MSFT", name: "Microsoft Corp.", region: "US", currency: "USD", assumedReturn: 14 },
  { symbol: "GOOGL", name: "Alphabet Inc.", region: "US", currency: "USD", assumedReturn: 13 },
  { symbol: "AMZN", name: "Amazon.com Inc.", region: "US", currency: "USD", assumedReturn: 13 },
  { symbol: "NVDA", name: "NVIDIA Corp.", region: "US", currency: "USD", assumedReturn: 22 },
  { symbol: "META", name: "Meta Platforms", region: "US", currency: "USD", assumedReturn: 15 },
  { symbol: "TSLA", name: "Tesla Inc.", region: "US", currency: "USD", assumedReturn: 18 },
  { symbol: "JPM", name: "JPMorgan Chase", region: "US", currency: "USD", assumedReturn: 10 },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", region: "IN", currency: "INR", assumedReturn: 14 },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", region: "IN", currency: "INR", assumedReturn: 13 },
  { symbol: "INFY.NS", name: "Infosys", region: "IN", currency: "INR", assumedReturn: 12 },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", region: "IN", currency: "INR", assumedReturn: 13 },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", region: "IN", currency: "INR", assumedReturn: 14 },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", region: "IN", currency: "INR", assumedReturn: 13 },
  { symbol: "SBIN.NS", name: "State Bank of India", region: "IN", currency: "INR", assumedReturn: 12 },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", region: "IN", currency: "INR", assumedReturn: 16 },
];

export const META_BY_SYMBOL: Record<string, typeof POPULAR[number]> = Object.fromEntries(
  POPULAR.map((p) => [p.symbol, p]),
);

async function fetchQuote(symbol: string): Promise<Omit<StockQuote, "name" | "region"> | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`);
  if (!res.ok) return null;
  const j = (await res.json()) as { c?: number; d?: number; dp?: number; h?: number; l?: number; o?: number; pc?: number };
  const price = Number(j?.c ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  const currency = symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "INR" : "USD";
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

export const listLiveStocks = createServerFn({ method: "GET" }).handler(async (): Promise<StockQuote[]> => {
  const results = await Promise.all(
    POPULAR.map(async (p) => {
      const q = await fetchQuote(p.symbol);
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
        const q = await fetchQuote(meta?.symbol ?? s);
        if (!q) return null;
        return { ...q, name: meta?.name ?? s, region: meta?.region ?? (q.currency === "INR" ? "IN" : "US") } satisfies StockQuote;
      }),
    );
    return results.filter((r): r is StockQuote => r !== null);
  });
