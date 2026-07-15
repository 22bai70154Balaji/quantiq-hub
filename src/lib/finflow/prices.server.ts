// Server-only market data fetchers.
// - Finnhub for stocks/ETFs (US symbols directly; India via `.NS`/`.BO`)
// - CoinGecko for crypto (no key required)
// - Frankfurter for FX conversion (no key)
// - Manual/cached for MFs, gold, FDs, EPF/PPF/NPS/bonds
//
// All functions throw on hard failure; caller decides fallback.

export type PriceQuote = {
  symbol: string;
  price: number;
  currency: string; // ISO currency of the price
  source: "finnhub" | "coingecko" | "indianapi" | "manual" | "cache";
};

const CG_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  MATIC: "matic-network",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  LTC: "litecoin",
  TRX: "tron",
  LINK: "chainlink",
  SHIB: "shiba-inu",
  UNI: "uniswap",
  ATOM: "cosmos",
  NEAR: "near",
  ARB: "arbitrum",
  OP: "optimism",
  APT: "aptos",
};

export async function fetchIndianApiQuote(symbolOrName: string): Promise<PriceQuote | null> {
  const key = process.env.INDIAN_STOCK_API_KEY;
  if (!key) return null;
  // Strip .NS / .BO suffix for the indianapi.in name/ticker lookup
  const q = symbolOrName.replace(/\.(NS|BO)$/i, "");
  try {
    const res = await fetch(`https://stock.indianapi.in/stock?name=${encodeURIComponent(q)}`, {
      headers: { "x-api-key": key },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { currentPrice?: { NSE?: string | number; BSE?: string | number } };
    const price = Number(j?.currentPrice?.NSE ?? j?.currentPrice?.BSE ?? 0);
    if (!Number.isFinite(price) || price <= 0) return null;
    return { symbol: symbolOrName, price, currency: "INR", source: "indianapi" };
  } catch {
    return null;
  }
}

export async function fetchFinnhubQuote(symbol: string): Promise<PriceQuote | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = (await res.json()) as { c?: number };
  const price = Number(j?.c ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  // Finnhub returns local exchange currency; for `.NS`/`.BO` India, otherwise USD.
  const currency = symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "INR" : "USD";
  return { symbol, price, currency, source: "finnhub" };
}


export async function fetchCoinGeckoQuote(
  symbol: string,
  vsCurrency: string = "usd",
): Promise<PriceQuote | null> {
  const upper = symbol.toUpperCase();
  const id = CG_MAP[upper] ?? upper.toLowerCase();
  const vs = vsCurrency.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${vs}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = (await res.json()) as Record<string, Record<string, number>>;
  const price = Number(j?.[id]?.[vs] ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  return { symbol: upper, price, currency: vsCurrency.toUpperCase(), source: "coingecko" };
}

let fxCache: { at: number; rates: Record<string, number>; base: string } | null = null;

export async function fetchFxRates(base: string = "USD"): Promise<Record<string, number>> {
  const now = Date.now();
  if (fxCache && fxCache.base === base && now - fxCache.at < 60 * 60 * 1000) {
    return fxCache.rates;
  }
  const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
  if (!res.ok) return {};
  const j = (await res.json()) as { rates?: Record<string, number> };
  const rates = { ...(j.rates ?? {}), [base]: 1 };
  fxCache = { at: now, rates, base };
  return rates;
}

export async function convert(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  // Convert via USD as pivot
  const rates = await fetchFxRates("USD");
  const usd = from === "USD" ? amount : amount / (rates[from] ?? 1);
  return to === "USD" ? usd : usd * (rates[to] ?? 1);
}
