export type MarketQuote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  currency: string;
  weekHigh52?: number;
  weekLow52?: number;
  marketCap?: number;
};

export type MarketCandle = { t: number; c: number; h?: number; l?: number; o?: number };

type YahooChartResult = {
  meta?: Record<string, number | string | undefined>;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      open?: Array<number | null>;
    }>;
  };
};

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; CalculyxAI/1.0; +https://calculyxai.online)",
  Accept: "application/json,text/plain,*/*",
};

export function parseMarketNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;

  const lower = value.trim().toLowerCase();
  if (!lower || lower === "—" || lower === "-" || lower === "na" || lower === "n/a") return undefined;

  const multiplier = lower.includes("trillion") || /\btn\b/.test(lower) ? 1e12
    : lower.includes("billion") || /\bbn\b/.test(lower) ? 1e9
      : lower.includes("million") || /\bmn\b/.test(lower) ? 1e6
        : lower.includes("crore") || /\bcr\b/.test(lower) ? 1e7
          : lower.includes("lakh") || lower.includes("lac") || /\bl\b/.test(lower) ? 1e5
            : 1;

  const cleaned = lower
    .replace(/[,₹$€£]|rs\.?|inr|usd|eur|gbp|%/g, " ")
    .replace(/[^0-9.+\-e]/g, " ");
  const match = cleaned.match(/-?\d+(?:\.\d+)?(?:e[+\-]?\d+)?/i);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed * multiplier : undefined;
}

async function fetchYahooChart(symbol: string, range: string, interval: string): Promise<YahooChartResult | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`,
      { headers: YAHOO_HEADERS },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { chart?: { result?: YahooChartResult[] } };
    return json.chart?.result?.[0] ?? null;
  } catch {
    return null;
  }
}

function lastPositive(values?: Array<number | null>): { value: number; index: number } | null {
  if (!values) return null;
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const value = Number(values[i]);
    if (Number.isFinite(value) && value > 0) return { value, index: i };
  }
  return null;
}

export async function fetchYahooQuote(symbol: string): Promise<MarketQuote | null> {
  const chart = await fetchYahooChart(symbol, "5d", "1d");
  const meta = chart?.meta;
  const quote = chart?.indicators?.quote?.[0];
  const lastClose = lastPositive(quote?.close);
  const price = parseMarketNumber(meta?.regularMarketPrice) ?? lastClose?.value;
  if (!price || price <= 0) return null;

  const i = lastClose?.index ?? Math.max((quote?.close?.length ?? 1) - 1, 0);
  const prevClose = parseMarketNumber(meta?.previousClose) ?? parseMarketNumber(meta?.chartPreviousClose) ?? price;
  const high = parseMarketNumber(meta?.regularMarketDayHigh) ?? parseMarketNumber(quote?.high?.[i]) ?? price;
  const low = parseMarketNumber(meta?.regularMarketDayLow) ?? parseMarketNumber(quote?.low?.[i]) ?? price;
  const open = parseMarketNumber(meta?.regularMarketOpen) ?? parseMarketNumber(quote?.open?.[i]) ?? prevClose;
  const change = price - prevClose;

  return {
    symbol,
    price,
    change,
    changePercent: prevClose > 0 ? (change / prevClose) * 100 : 0,
    high,
    low,
    open,
    prevClose,
    currency: String(meta?.currency ?? (symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "INR" : "USD")),
    weekHigh52: parseMarketNumber(meta?.fiftyTwoWeekHigh),
    weekLow52: parseMarketNumber(meta?.fiftyTwoWeekLow),
    marketCap: parseMarketNumber(meta?.marketCap),
  };
}

export async function fetchYahooCandles(symbol: string, range: "1M" | "6M" | "1Y" | "5Y"): Promise<MarketCandle[]> {
  const yahooRange = range === "1M" ? "1mo" : range === "6M" ? "6mo" : range === "1Y" ? "1y" : "5y";
  const interval = range === "5Y" ? "1wk" : "1d";
  const chart = await fetchYahooChart(symbol, yahooRange, interval);
  const timestamps = chart?.timestamp ?? [];
  const quote = chart?.indicators?.quote?.[0];
  if (!timestamps.length || !quote?.close?.length) return [];

  return timestamps
    .map((t, i) => ({
      t: Number(t) * 1000,
      c: parseMarketNumber(quote.close?.[i]) ?? 0,
      h: parseMarketNumber(quote.high?.[i]),
      l: parseMarketNumber(quote.low?.[i]),
      o: parseMarketNumber(quote.open?.[i]),
    }))
    .filter((row) => row.t > 0 && Number.isFinite(row.c) && row.c > 0)
    .sort((a, b) => a.t - b.t);
}

export async function fetchIndianStockSnapshot(lookup: string): Promise<{ quote: MarketQuote; raw: Record<string, unknown> } | null> {
  const key = process.env.INDIAN_STOCK_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://stock.indianapi.in/stock?name=${encodeURIComponent(lookup)}`, {
      headers: { "x-api-key": key },
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as Record<string, unknown>;
    const currentPrice = raw.currentPrice as { NSE?: unknown; BSE?: unknown } | undefined;
    const price = parseMarketNumber(currentPrice?.NSE) ?? parseMarketNumber(currentPrice?.BSE);
    if (!price || price <= 0) return null;

    const pct = parseMarketNumber(raw.percentChange) ?? 0;
    const prevClose = pct !== 0 ? price / (1 + pct / 100) : price;
    return {
      raw,
      quote: {
        symbol: lookup,
        price,
        change: price - prevClose,
        changePercent: pct,
        high: parseMarketNumber(raw.dayHigh) ?? parseMarketNumber(raw.yearHigh) ?? price,
        low: parseMarketNumber(raw.dayLow) ?? parseMarketNumber(raw.yearLow) ?? price,
        open: parseMarketNumber(raw.open) ?? prevClose,
        prevClose: parseMarketNumber(raw.previousClose) ?? prevClose,
        currency: "INR",
        weekHigh52: parseMarketNumber(raw.yearHigh),
        weekLow52: parseMarketNumber(raw.yearLow),
        marketCap: parseMarketNumber(raw.marketCap),
      },
    };
  } catch {
    return null;
  }
}