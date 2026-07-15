// Detailed AI report + prediction for a stock.
// Runs a technical summary of the recent candles (support/resistance,
// short-term trend, volatility, momentum) and asks Groq to convert it
// into a structured JSON report the frontend can render / export.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGroq } from "./groq.server";

export type StockPrediction = {
  headline: string;
  outlook: "bullish" | "bearish" | "neutral";
  confidence: "low" | "medium" | "high";
  timeframe: string;
  summary: string;
  drivers: string[];        // key drivers to watch
  keyLevels: {
    support: number[];      // 1-3 numbers
    resistance: number[];   // 1-3 numbers
    predictedHigh: number;  // 30-day
    predictedLow: number;   // 30-day
    fairPrice?: number;
  };
  scenarios: {
    bull: { target: number; probability: number; note: string };
    base: { target: number; probability: number; note: string };
    bear: { target: number; probability: number; note: string };
  };
  risks: string[];
  actionPlan: string[];
  disclaimer: string;
  // Technical numbers derived from candles (for chart / audit).
  technicals: {
    lastPrice: number;
    ma20: number;
    ma50: number;
    ma200: number | null;
    high52w: number;
    low52w: number;
    volatilityPct: number;      // stdev of daily returns × sqrt(252) × 100
    momentum30d: number;        // pct change over last 30 bars
    momentum90d: number;        // pct change over last 90 bars
    rsi14: number;              // simple RSI (0-100)
  };
};

// ------------- Technical helpers -------------

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}
function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) ** 2;
  return Math.sqrt(s / (xs.length - 1));
}
function ma(closes: number[], n: number): number {
  if (closes.length < n) return closes.length ? closes[closes.length - 1] : 0;
  return mean(closes.slice(-n));
}
function rsi(closes: number[], n = 14): number {
  if (closes.length < n + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function computeTechnicals(closes: number[]): StockPrediction["technicals"] {
  const last = closes[closes.length - 1] ?? 0;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const dailyVol = stdev(returns);
  const annualVolPct = dailyVol * Math.sqrt(252) * 100;
  const c30 = closes.length >= 30 ? closes[closes.length - 30] : closes[0];
  const c90 = closes.length >= 90 ? closes[closes.length - 90] : closes[0];
  return {
    lastPrice: last,
    ma20: ma(closes, 20),
    ma50: ma(closes, 50),
    ma200: closes.length >= 200 ? ma(closes, 200) : null,
    high52w: Math.max(...closes),
    low52w: Math.min(...closes),
    volatilityPct: annualVolPct,
    momentum30d: c30 ? ((last - c30) / c30) * 100 : 0,
    momentum90d: c90 ? ((last - c90) / c90) * 100 : 0,
    rsi14: rsi(closes, 14),
  };
}

// Very conservative statistical bounds — used as fallback and as a sanity
// check on the model's forecast.
function statisticalRange(closes: number[]): { high: number; low: number } {
  const t = computeTechnicals(closes);
  // 30-trading-day 1-sigma band from annualised vol.
  const monthlyVol = (t.volatilityPct / 100) * Math.sqrt(30 / 252);
  const high = t.lastPrice * (1 + monthlyVol);
  const low = Math.max(t.lastPrice * (1 - monthlyVol), t.low52w * 0.9);
  return { high, low };
}

// ------------- Server function -------------

const cache = new Map<string, { at: number; data: StockPrediction }>();
const TTL = 60 * 60 * 1000; // 1h

export const getStockPrediction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    symbol: z.string().min(1).max(30),
    name: z.string().min(1).max(120),
    sector: z.string().max(80).optional(),
    currency: z.string().min(1).max(6),
    price: z.number().positive(),
    pe: z.number().optional(),
    roe: z.number().optional(),
    divYield: z.number().optional(),
    weekHigh52: z.number().optional(),
    weekLow52: z.number().optional(),
    closes: z.array(z.number().positive()).min(5).max(600),
  }).parse(d))
  .handler(async ({ data }): Promise<StockPrediction> => {
    const cacheKey = `${data.symbol}:${data.price.toFixed(2)}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < TTL) return hit.data;

    const tech = computeTechnicals(data.closes);
    const stat = statisticalRange(data.closes);

    const context = [
      `Company: ${data.name} (${data.symbol})`,
      data.sector ? `Sector: ${data.sector}` : null,
      `Currency: ${data.currency}`,
      `Current price: ${data.price.toFixed(2)}`,
      data.pe ? `P/E: ${data.pe.toFixed(1)}` : null,
      data.roe ? `ROE: ${data.roe.toFixed(1)}%` : null,
      data.divYield ? `Dividend yield: ${data.divYield.toFixed(2)}%` : null,
      `52-week high/low: ${tech.high52w.toFixed(2)} / ${tech.low52w.toFixed(2)}`,
      `MA20 / MA50 / MA200: ${tech.ma20.toFixed(2)} / ${tech.ma50.toFixed(2)} / ${tech.ma200?.toFixed(2) ?? "n/a"}`,
      `RSI-14: ${tech.rsi14.toFixed(1)}`,
      `30-day momentum: ${tech.momentum30d.toFixed(2)}%`,
      `90-day momentum: ${tech.momentum90d.toFixed(2)}%`,
      `Annualised volatility: ${tech.volatilityPct.toFixed(1)}%`,
      `1-sigma 30-day statistical range: ${stat.low.toFixed(2)} – ${stat.high.toFixed(2)}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are a senior equity strategist writing a short, professional stock report.
Use the numbers below and return ONLY valid JSON (no markdown, no prose outside the JSON) with this exact shape:

{
  "headline": "one-line summary, max 80 chars",
  "outlook": "bullish" | "bearish" | "neutral",
  "confidence": "low" | "medium" | "high",
  "timeframe": "e.g. 'next 4 weeks' or 'next 3 months'",
  "summary": "2-4 sentences describing where the stock is right now and where it is likely headed",
  "drivers": ["4-6 short bullets of catalysts / factors to watch"],
  "keyLevels": {
    "support": [numbers, 1-3 items, near or below current price],
    "resistance": [numbers, 1-3 items, near or above current price],
    "predictedHigh": number (30-day high target),
    "predictedLow": number (30-day low target),
    "fairPrice": number (your best fair-value estimate)
  },
  "scenarios": {
    "bull": { "target": number, "probability": number (0-100), "note": "short reason" },
    "base": { "target": number, "probability": number (0-100), "note": "short reason" },
    "bear": { "target": number, "probability": number (0-100), "note": "short reason" }
  },
  "risks": ["4-6 short risk bullets"],
  "actionPlan": ["3-5 short bullets on how a long-term investor could act (entries, stop-loss, position sizing)"],
  "disclaimer": "one sentence noting this is estimate-only, not investment advice"
}

Rules:
- Probabilities across bull/base/bear MUST sum to ~100.
- Support < current price < Resistance.
- predictedLow < predictedHigh, both within roughly ±30% of current price.
- Keep numbers in the same currency and scale as current price.
- Be honest: if the technicals are mixed, say neutral / medium confidence.

Data:
${context}`;

    let raw = "";
    try {
      raw = await callGroq(
        [
          { role: "system", content: "You are a professional equity strategist. Respond only with valid JSON." },
          { role: "user", content: prompt },
        ],
        { json: true, temperature: 0.35 },
      );
    } catch {
      const fallback = buildFallback(data, tech, stat);
      return fallback;
    }

    let parsed: Partial<StockPrediction> | null = null;
    try { parsed = JSON.parse(raw) as Partial<StockPrediction>; } catch { parsed = null; }

    if (!parsed || !parsed.keyLevels || !parsed.scenarios) {
      const fallback = buildFallback(data, tech, stat);
      cache.set(cacheKey, { at: Date.now(), data: fallback });
      return fallback;
    }

    const clamp = (v: unknown, min: number, max: number, def: number): number => {
      const n = Number(v);
      if (!Number.isFinite(n)) return def;
      return Math.max(min, Math.min(max, n));
    };
    const strList = (xs: unknown, cap = 6): string[] =>
      Array.isArray(xs) ? xs.slice(0, cap).map((s) => String(s).slice(0, 240)) : [];

    const kl = parsed.keyLevels as Partial<StockPrediction["keyLevels"]>;
    const scen = parsed.scenarios as Partial<StockPrediction["scenarios"]>;
    const p = data.price;

    const clean: StockPrediction = {
      headline: String(parsed.headline ?? `${data.name} outlook`).slice(0, 120),
      outlook: (["bullish", "bearish", "neutral"] as const).includes(parsed.outlook as "bullish")
        ? (parsed.outlook as StockPrediction["outlook"])
        : "neutral",
      confidence: (["low", "medium", "high"] as const).includes(parsed.confidence as "low")
        ? (parsed.confidence as StockPrediction["confidence"])
        : "medium",
      timeframe: String(parsed.timeframe ?? "next 4 weeks").slice(0, 60),
      summary: String(parsed.summary ?? "").slice(0, 800),
      drivers: strList(parsed.drivers),
      keyLevels: {
        support: Array.isArray(kl?.support) ? kl!.support!.slice(0, 3).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0) : [],
        resistance: Array.isArray(kl?.resistance) ? kl!.resistance!.slice(0, 3).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0) : [],
        predictedHigh: clamp(kl?.predictedHigh, p * 0.6, p * 1.5, stat.high),
        predictedLow: clamp(kl?.predictedLow, p * 0.5, p * 1.4, stat.low),
        fairPrice: kl?.fairPrice != null ? clamp(kl.fairPrice, p * 0.4, p * 2, p) : undefined,
      },
      scenarios: {
        bull: {
          target: clamp(scen?.bull?.target, p * 0.9, p * 2, p * 1.15),
          probability: clamp(scen?.bull?.probability, 0, 100, 30),
          note: String(scen?.bull?.note ?? "").slice(0, 240),
        },
        base: {
          target: clamp(scen?.base?.target, p * 0.7, p * 1.5, p * 1.05),
          probability: clamp(scen?.base?.probability, 0, 100, 45),
          note: String(scen?.base?.note ?? "").slice(0, 240),
        },
        bear: {
          target: clamp(scen?.bear?.target, p * 0.4, p * 1.1, p * 0.85),
          probability: clamp(scen?.bear?.probability, 0, 100, 25),
          note: String(scen?.bear?.note ?? "").slice(0, 240),
        },
      },
      risks: strList(parsed.risks),
      actionPlan: strList(parsed.actionPlan),
      disclaimer: String(parsed.disclaimer ?? "Estimates only — not investment advice.").slice(0, 240),
      technicals: tech,
    };

    // Normalise scenario probabilities to sum ~100.
    const sum = clean.scenarios.bull.probability + clean.scenarios.base.probability + clean.scenarios.bear.probability;
    if (sum > 0 && Math.abs(sum - 100) > 5) {
      clean.scenarios.bull.probability = Math.round((clean.scenarios.bull.probability / sum) * 100);
      clean.scenarios.base.probability = Math.round((clean.scenarios.base.probability / sum) * 100);
      clean.scenarios.bear.probability = 100 - clean.scenarios.bull.probability - clean.scenarios.base.probability;
    }

    cache.set(cacheKey, { at: Date.now(), data: clean });
    return clean;
  });

function buildFallback(
  data: { name: string; price: number },
  tech: StockPrediction["technicals"],
  stat: { high: number; low: number },
): StockPrediction {
  const p = data.price;
  const trendUp = tech.momentum30d > 0 && tech.ma20 > tech.ma50;
  return {
    headline: `${data.name} — statistical outlook`,
    outlook: trendUp ? "bullish" : tech.momentum30d < -5 ? "bearish" : "neutral",
    confidence: "low",
    timeframe: "next 4 weeks",
    summary: "AI report is temporarily unavailable — this is a statistical fallback derived from recent price action, moving averages, momentum and volatility.",
    drivers: [
      `MA20 vs MA50: ${tech.ma20.toFixed(2)} vs ${tech.ma50.toFixed(2)}`,
      `RSI-14 at ${tech.rsi14.toFixed(1)} (${tech.rsi14 > 70 ? "overbought" : tech.rsi14 < 30 ? "oversold" : "neutral"})`,
      `30-day momentum ${tech.momentum30d.toFixed(2)}%`,
      `Annualised volatility ${tech.volatilityPct.toFixed(1)}%`,
    ],
    keyLevels: {
      support: [Math.round(p * 0.95 * 100) / 100, Math.round(p * 0.9 * 100) / 100],
      resistance: [Math.round(p * 1.05 * 100) / 100, Math.round(p * 1.1 * 100) / 100],
      predictedHigh: stat.high,
      predictedLow: stat.low,
      fairPrice: p,
    },
    scenarios: {
      bull: { target: p * 1.12, probability: 30, note: "Trend continuation with rising momentum." },
      base: { target: p * 1.03, probability: 45, note: "Range-bound around current levels." },
      bear: { target: p * 0.9, probability: 25, note: "Broader risk-off or company-specific setback." },
    },
    risks: [
      "Broader market drawdowns can override individual fundamentals",
      "Sector-specific regulatory or cost pressures",
      "Earnings misses or guidance cuts",
      "Currency / commodity swings",
    ],
    actionPlan: [
      "Scale in over multiple tranches rather than a single lump-sum",
      "Set a stop-loss ~10-12% below entry to cap downside",
      "Keep position size ≤ 5% of the total portfolio",
      "Review on next earnings and any major sector news",
    ],
    disclaimer: "Statistical estimate only — not investment advice.",
    technicals: tech,
  };
}
