import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Uses open.er-api.com (no key, free, reliable) with a 10-minute cache.
type Rates = { base: string; rates: Record<string, number>; updated: string };
let cache: { key: string; at: number; data: Rates } | null = null;
const TTL = 10 * 60 * 1000;

export const getExchangeRates = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ base: z.string().default("USD") }).parse(d ?? {}))
  .handler(async ({ data }): Promise<Rates> => {
    const base = data.base.toUpperCase();
    if (cache && cache.key === base && Date.now() - cache.at < TTL) return cache.data;
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      const j = (await res.json()) as { rates: Record<string, number>; time_last_update_utc: string };
      const out: Rates = { base, rates: j.rates, updated: j.time_last_update_utc };
      cache = { key: base, at: Date.now(), data: out };
      return out;
    } catch {
      // Static fallback so UI still works offline / rate-limited
      const fallback: Record<string, Record<string, number>> = {
        USD: { INR: 83.2, AED: 3.67, USD: 1, EUR: 0.93, GBP: 0.79, JPY: 156, CAD: 1.36, AUD: 1.5, CHF: 0.9, SGD: 1.35 },
        INR: { USD: 0.012, AED: 0.044, INR: 1, EUR: 0.011, GBP: 0.0095 },
        AED: { USD: 0.272, INR: 22.67, AED: 1, EUR: 0.253 },
      };
      return { base, rates: fallback[base] ?? fallback.USD, updated: new Date().toISOString() };
    }
  });
