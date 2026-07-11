import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Historical FX from Frankfurter (ECB reference rates, no key, CORS-open).
// Cached in memory per (from|to|days) key for 60 minutes.
export type FxHistoryPoint = { date: string; rate: number };
export type FxHistory = {
  from: string;
  to: string;
  days: number;
  points: FxHistoryPoint[];
  changePct: number; // (last - first) / first * 100
  min: number;
  max: number;
  updated: string;
};

type CacheEntry = { at: number; data: FxHistory };
const cache = new Map<string, CacheEntry>();
const TTL = 60 * 60 * 1000; // 1 hour

function key(from: string, to: string, days: number) {
  return `${from}|${to}|${days}`;
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export const getFxHistory = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({
      from: z.string().min(3).max(3),
      to: z.string().min(3).max(3),
      days: z.number().int().min(7).max(1825).default(90),
    }).parse(raw ?? {}),
  )
  .handler(async ({ data }): Promise<FxHistory> => {
    const from = data.from.toUpperCase();
    const to = data.to.toUpperCase();
    const days = data.days;
    const k = key(from, to, days);
    const now = Date.now();
    const hit = cache.get(k);
    if (hit && now - hit.at < TTL) return hit.data;

    const start = daysAgoIso(days);
    const empty: FxHistory = { from, to, days, points: [], changePct: 0, min: 0, max: 0, updated: new Date().toISOString() };

    if (from === to) {
      // Trivial: flat 1.0 series
      const points: FxHistoryPoint[] = [];
      for (let i = 0; i <= Math.min(days, 90); i++) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - (days - i));
        points.push({ date: d.toISOString().slice(0, 10), rate: 1 });
      }
      const out: FxHistory = { from, to, days, points, changePct: 0, min: 1, max: 1, updated: new Date().toISOString() };
      cache.set(k, { at: now, data: out });
      return out;
    }

    try {
      const url = `https://api.frankfurter.dev/v1/${start}..?base=${from}&symbols=${to}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`fx status ${res.status}`);
      const j = (await res.json()) as { rates?: Record<string, Record<string, number>> };
      const raw = j.rates ?? {};
      const points: FxHistoryPoint[] = Object.entries(raw)
        .map(([date, r]) => ({ date, rate: r[to] ?? 0 }))
        .filter((p) => Number.isFinite(p.rate) && p.rate > 0)
        .sort((a, b) => (a.date < b.date ? -1 : 1));

      if (!points.length) return empty;
      const values = points.map((p) => p.rate);
      const first = values[0];
      const last = values[values.length - 1];
      const out: FxHistory = {
        from, to, days, points,
        changePct: first > 0 ? ((last - first) / first) * 100 : 0,
        min: Math.min(...values),
        max: Math.max(...values),
        updated: new Date().toISOString(),
      };
      cache.set(k, { at: now, data: out });
      return out;
    } catch {
      return empty;
    }
  });
