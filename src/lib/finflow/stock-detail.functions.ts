import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCatalogEntry } from "./stocks-catalog";

export type Candle = { t: number; c: number; h?: number; l?: number; o?: number };
export type StockDetail = {
  symbol: string;
  name: string;
  region: "US" | "IN";
  currency: string;
  sector: string;
  logoDomain?: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
  divYield?: number;
  beta?: number;
  eps?: number;
  weekHigh52?: number;
  weekLow52?: number;
  roe?: number;
  roce?: number;
  debtToEquity?: number;
  profitGrowth?: number;
  revenueGrowth?: number;
  fcf?: number;
  healthScore: number;
  healthNotes: string[];
};

async function fetchFinnhubQuote(symbol: string) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`);
  if (!res.ok) return null;
  return (await res.json()) as { c?: number; d?: number; dp?: number; h?: number; l?: number; o?: number; pc?: number };
}

async function fetchFinnhubMetric(symbol: string) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  const res = await fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${key}`);
  if (!res.ok) return null;
  const j = (await res.json()) as { metric?: Record<string, number | undefined> };
  return j.metric ?? null;
}

async function fetchFinnhubProfile(symbol: string) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  const res = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key}`);
  if (!res.ok) return null;
  return (await res.json()) as { name?: string; marketCapitalization?: number; finnhubIndustry?: string; logo?: string; weburl?: string };
}

async function fetchIndian(symbol: string) {
  const key = process.env.INDIAN_STOCK_API_KEY;
  if (!key) return null;
  const q = symbol.replace(/\.(NS|BO)$/i, "");
  const cat = getCatalogEntry(symbol);
  const name = cat?.name ?? q;
  try {
    const res = await fetch(`https://stock.indianapi.in/stock?name=${encodeURIComponent(name)}`, { headers: { "x-api-key": key } });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await res.json()) as any;
  } catch {
    return null;
  }
}

function scoreHealth(m: {
  roe?: number;
  roce?: number;
  debtToEquity?: number;
  profitGrowth?: number;
  revenueGrowth?: number;
  fcf?: number;
}) {
  let score = 50;
  const notes: string[] = [];
  if (m.roe !== undefined) {
    if (m.roe >= 20) { score += 12; notes.push(`Strong ROE ${m.roe.toFixed(1)}%`); }
    else if (m.roe >= 12) { score += 6; notes.push(`Healthy ROE ${m.roe.toFixed(1)}%`); }
    else if (m.roe < 5) { score -= 8; notes.push(`Weak ROE ${m.roe.toFixed(1)}%`); }
  }
  if (m.debtToEquity !== undefined) {
    if (m.debtToEquity <= 0.5) { score += 10; notes.push(`Low leverage D/E ${m.debtToEquity.toFixed(2)}`); }
    else if (m.debtToEquity <= 1) { score += 3; }
    else if (m.debtToEquity > 2) { score -= 10; notes.push(`High leverage D/E ${m.debtToEquity.toFixed(2)}`); }
  }
  if (m.profitGrowth !== undefined) {
    if (m.profitGrowth >= 15) { score += 10; notes.push(`Profit growth ${m.profitGrowth.toFixed(1)}%`); }
    else if (m.profitGrowth < 0) { score -= 8; notes.push(`Profit declining ${m.profitGrowth.toFixed(1)}%`); }
  }
  if (m.revenueGrowth !== undefined) {
    if (m.revenueGrowth >= 12) { score += 8; notes.push(`Revenue growth ${m.revenueGrowth.toFixed(1)}%`); }
    else if (m.revenueGrowth < 0) { score -= 6; }
  }
  if (m.fcf !== undefined) {
    if (m.fcf > 0) { score += 5; notes.push("Positive free cash flow"); }
    else { score -= 6; notes.push("Negative free cash flow"); }
  }
  if (m.roce !== undefined) {
    if (m.roce >= 15) { score += 5; }
    else if (m.roce < 8) { score -= 4; }
  }
  return { score: Math.max(0, Math.min(100, Math.round(score))), notes };
}

export const getStockDetail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ symbol: z.string().min(1).max(30) }).parse(d))
  .handler(async ({ data }): Promise<StockDetail> => {
    const symbol = data.symbol.toUpperCase();
    const cat = getCatalogEntry(symbol);
    const isIndian = symbol.endsWith(".NS") || symbol.endsWith(".BO");

    if (isIndian) {
      const j = await fetchIndian(symbol);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const price = Number(j?.currentPrice?.NSE ?? j?.currentPrice?.BSE ?? 0) || 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pct = Number(j?.percentChange ?? 0);
      const prevClose = pct !== 0 && price > 0 ? price / (1 + pct / 100) : price;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const km = j?.keyMetrics ?? {};
      const roe = Number(km?.roe ?? km?.returnOnEquity ?? NaN);
      const de = Number(km?.debtToEquity ?? NaN);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pe = Number(j?.stockDetailsReusableData?.priceToEarnings ?? km?.peRatio ?? NaN);
      const metrics = {
        roe: Number.isFinite(roe) ? roe : undefined,
        debtToEquity: Number.isFinite(de) ? de : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profitGrowth: Number(j?.growth?.profitGrowth ?? NaN) || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        revenueGrowth: Number(j?.growth?.revenueGrowth ?? NaN) || undefined,
      };
      const health = scoreHealth(metrics);
      return {
        symbol,
        name: cat?.name ?? symbol,
        region: "IN",
        currency: "INR",
        sector: cat?.sector ?? "—",
        logoDomain: cat?.logoDomain,
        price,
        change: price - prevClose,
        changePercent: pct,
        high: Number(j?.yearHigh ?? price),
        low: Number(j?.yearLow ?? price),
        open: prevClose,
        prevClose,
        pe: Number.isFinite(pe) ? pe : undefined,
        marketCap: Number(j?.marketCap ?? NaN) || undefined,
        weekHigh52: Number(j?.yearHigh ?? NaN) || undefined,
        weekLow52: Number(j?.yearLow ?? NaN) || undefined,
        roe: metrics.roe,
        debtToEquity: metrics.debtToEquity,
        profitGrowth: metrics.profitGrowth,
        revenueGrowth: metrics.revenueGrowth,
        healthScore: health.score,
        healthNotes: health.notes,
      };
    }

    const [q, m, p] = await Promise.all([fetchFinnhubQuote(symbol), fetchFinnhubMetric(symbol), fetchFinnhubProfile(symbol)]);
    const price = Number(q?.c ?? 0);
    const metrics = {
      roe: Number(m?.["roeTTM"] ?? m?.["roeAnnual"] ?? NaN) || undefined,
      roce: Number(m?.["roiAnnual"] ?? NaN) || undefined,
      debtToEquity: Number(m?.["totalDebt/totalEquityAnnual"] ?? NaN) || undefined,
      profitGrowth: Number(m?.["epsGrowth5Y"] ?? NaN) || undefined,
      revenueGrowth: Number(m?.["revenueGrowth5Y"] ?? NaN) || undefined,
      fcf: Number(m?.["freeCashFlowTTM"] ?? NaN) || undefined,
    };
    const health = scoreHealth(metrics);
    return {
      symbol,
      name: p?.name ?? cat?.name ?? symbol,
      region: "US",
      currency: "USD",
      sector: p?.finnhubIndustry ?? cat?.sector ?? "—",
      logoDomain: cat?.logoDomain,
      price,
      change: Number(q?.d ?? 0),
      changePercent: Number(q?.dp ?? 0),
      high: Number(q?.h ?? price),
      low: Number(q?.l ?? price),
      open: Number(q?.o ?? price),
      prevClose: Number(q?.pc ?? price),
      marketCap: p?.marketCapitalization ? p.marketCapitalization * 1_000_000 : undefined,
      pe: Number(m?.["peTTM"] ?? m?.["peAnnual"] ?? NaN) || undefined,
      pb: Number(m?.["pbAnnual"] ?? NaN) || undefined,
      divYield: Number(m?.["dividendYieldIndicatedAnnual"] ?? NaN) || undefined,
      beta: Number(m?.["beta"] ?? NaN) || undefined,
      eps: Number(m?.["epsTTM"] ?? NaN) || undefined,
      weekHigh52: Number(m?.["52WeekHigh"] ?? NaN) || undefined,
      weekLow52: Number(m?.["52WeekLow"] ?? NaN) || undefined,
      ...metrics,
      healthScore: health.score,
      healthNotes: health.notes,
    };
  });

export const getStockCandles = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    symbol: z.string().min(1).max(30),
    range: z.enum(["1M", "6M", "1Y", "5Y"]).default("1Y"),
  }).parse(d))
  .handler(async ({ data }): Promise<{ candles: Candle[]; source: string }> => {
    const symbol = data.symbol.toUpperCase();
    const isIndian = symbol.endsWith(".NS") || symbol.endsWith(".BO");
    const days = data.range === "1M" ? 30 : data.range === "6M" ? 180 : data.range === "1Y" ? 365 : 1825;

    if (isIndian) {
      const key = process.env.INDIAN_STOCK_API_KEY;
      if (!key) return { candles: [], source: "none" };
      const q = symbol.replace(/\.(NS|BO)$/i, "");
      const period = data.range === "1M" ? "1m" : data.range === "6M" ? "6m" : data.range === "1Y" ? "1yr" : "5yr";
      try {
        const res = await fetch(`https://stock.indianapi.in/historical_data?stock_name=${encodeURIComponent(q)}&period=${period}&filter=price`, {
          headers: { "x-api-key": key },
        });
        if (!res.ok) return { candles: [], source: "indianapi" };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const j = (await res.json()) as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr: any[] = j?.datasets?.[0]?.values ?? j?.values ?? [];
        const candles: Candle[] = arr
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((row: any) => {
            const t = new Date(row[0] ?? row.date ?? 0).getTime();
            const c = Number(row[1] ?? row.close ?? row.price ?? 0);
            return { t, c };
          })
          .filter((r) => r.t > 0 && Number.isFinite(r.c) && r.c > 0)
          .sort((a, b) => a.t - b.t);
        return { candles, source: "indianapi" };
      } catch {
        return { candles: [], source: "indianapi" };
      }
    }

    const key = process.env.FINNHUB_API_KEY;
    if (!key) return { candles: [], source: "none" };
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 86400;
    const resolution = data.range === "1M" ? "D" : data.range === "5Y" ? "W" : "D";
    const res = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${key}`);
    if (!res.ok) return { candles: [], source: "finnhub" };
    const j = (await res.json()) as { t?: number[]; c?: number[]; h?: number[]; l?: number[]; o?: number[]; s?: string };
    if (j.s !== "ok" || !j.t || !j.c) return { candles: [], source: "finnhub" };
    const candles: Candle[] = j.t.map((t, i) => ({ t: t * 1000, c: j.c![i], h: j.h?.[i], l: j.l?.[i], o: j.o?.[i] }));
    return { candles, source: "finnhub" };
  });

export type NewsItem = { id: string; headline: string; url: string; source: string; ts: number; summary?: string };

export const getStockNews = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ symbol: z.string().min(1).max(30) }).parse(d))
  .handler(async ({ data }): Promise<NewsItem[]> => {
    const symbol = data.symbol.toUpperCase();
    const isIndian = symbol.endsWith(".NS") || symbol.endsWith(".BO");
    if (!isIndian) {
      const key = process.env.FINNHUB_API_KEY;
      if (!key) return [];
      const to = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 14 * 86400 * 1000).toISOString().slice(0, 10);
      const res = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${key}`);
      if (!res.ok) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const arr = (await res.json()) as any[];
      return (arr ?? []).slice(0, 12).map((n) => ({
        id: String(n.id),
        headline: String(n.headline ?? ""),
        url: String(n.url ?? "#"),
        source: String(n.source ?? "News"),
        ts: Number(n.datetime ?? 0) * 1000,
        summary: n.summary ? String(n.summary) : undefined,
      }));
    }
    const key = process.env.INDIAN_STOCK_API_KEY;
    if (!key) return [];
    const q = symbol.replace(/\.(NS|BO)$/i, "");
    const cat = getCatalogEntry(symbol);
    try {
      const res = await fetch(`https://stock.indianapi.in/stock?name=${encodeURIComponent(cat?.name ?? q)}`, { headers: { "x-api-key": key } });
      if (!res.ok) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const j = (await res.json()) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const news: any[] = j?.recentNews ?? j?.news ?? [];
      return news.slice(0, 12).map((n, i) => ({
        id: String(n.id ?? i),
        headline: String(n.headline ?? n.title ?? ""),
        url: String(n.url ?? n.link ?? "#"),
        source: String(n.source ?? "News"),
        ts: new Date(n.date ?? n.publishedAt ?? Date.now()).getTime(),
        summary: n.summary ? String(n.summary) : undefined,
      }));
    } catch {
      return [];
    }
  });

export type AnalystRating = { buy: number; hold: number; sell: number; strongBuy: number; strongSell: number; period: string };

export const getAnalystRatings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ symbol: z.string().min(1).max(30) }).parse(d))
  .handler(async ({ data }): Promise<AnalystRating[]> => {
    const symbol = data.symbol.toUpperCase();
    const isIndian = symbol.endsWith(".NS") || symbol.endsWith(".BO");
    if (isIndian) return [];
    const key = process.env.FINNHUB_API_KEY;
    if (!key) return [];
    const res = await fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${key}`);
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr = (await res.json()) as any[];
    return (arr ?? []).slice(0, 4).map((r) => ({
      buy: Number(r.buy ?? 0),
      hold: Number(r.hold ?? 0),
      sell: Number(r.sell ?? 0),
      strongBuy: Number(r.strongBuy ?? 0),
      strongSell: Number(r.strongSell ?? 0),
      period: String(r.period ?? ""),
    }));
  });

export type EarningsRow = { period: string; actual: number | null; estimate: number | null; surprise: number | null };

export const getEarnings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ symbol: z.string().min(1).max(30) }).parse(d))
  .handler(async ({ data }): Promise<EarningsRow[]> => {
    const symbol = data.symbol.toUpperCase();
    const isIndian = symbol.endsWith(".NS") || symbol.endsWith(".BO");
    if (isIndian) return [];
    const key = process.env.FINNHUB_API_KEY;
    if (!key) return [];
    const res = await fetch(`https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${key}`);
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr = (await res.json()) as any[];
    return (arr ?? []).slice(0, 8).map((r) => ({
      period: String(r.period ?? ""),
      actual: r.actual != null ? Number(r.actual) : null,
      estimate: r.estimate != null ? Number(r.estimate) : null,
      surprise: r.surprise != null ? Number(r.surprise) : null,
    }));
  });
