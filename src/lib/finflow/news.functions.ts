import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type NewsItem = {
  title: string;
  summary: string;
  category: "Markets" | "Rates" | "Crypto" | "Real Estate" | "Policy" | "Global";
  region: "India" | "USA" | "UAE" | "Global";
  impact: "positive" | "neutral" | "negative";
};

type Cached = { at: number; region: string; items: NewsItem[] };
let cache: Cached | null = null;
const TTL = 30 * 60 * 1000;

const FALLBACK: NewsItem[] = [
  { title: "Fed signals patient stance as inflation cools", summary: "US Federal Reserve holds rates steady, citing moderating inflation trends and healthy labor markets.", category: "Rates", region: "USA", impact: "positive" },
  { title: "RBI keeps repo rate unchanged at 6.5%", summary: "India's central bank maintains status quo, prioritising inflation targeting over growth stimulus.", category: "Rates", region: "India", impact: "neutral" },
  { title: "Dubai property prices climb 12% YoY", summary: "UAE real estate market continues its record-breaking rally driven by foreign investment.", category: "Real Estate", region: "UAE", impact: "positive" },
  { title: "Nifty 50 hits fresh all-time high", summary: "Indian benchmark index breaks records amid strong quarterly earnings and FII inflows.", category: "Markets", region: "India", impact: "positive" },
  { title: "S&P 500 tests resistance amid tech rally", summary: "Semiconductor and AI stocks lead US markets higher through the week.", category: "Markets", region: "USA", impact: "positive" },
  { title: "UAE corporate tax deadline extended", summary: "Ministry of Finance grants small businesses additional filing time for the new 9% regime.", category: "Policy", region: "UAE", impact: "neutral" },
];

export const getFinanceNews = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ region: z.enum(["India", "USA", "UAE", "Global"]).default("Global") }).parse(d ?? {}))
  .handler(async ({ data }): Promise<{ items: NewsItem[]; source: "ai" | "fallback"; updated: string }> => {
    if (cache && cache.region === data.region && Date.now() - cache.at < TTL) {
      return { items: cache.items, source: "ai", updated: new Date(cache.at).toISOString() };
    }
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { items: FALLBACK, source: "fallback", updated: new Date().toISOString() };

    try {
      const prompt = `Generate 6 realistic, current financial news headlines relevant to ${data.region === "Global" ? "India, USA, and UAE" : data.region}. Cover markets, interest rates, real estate, and policy. Respond ONLY with a JSON array of objects with keys: title (short, punchy), summary (1 sentence), category (one of: Markets, Rates, Crypto, Real Estate, Policy, Global), region (one of: India, USA, UAE, Global), impact (positive|neutral|negative). No prose, no markdown fence.`;

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const j = (await res.json()) as { choices: Array<{ message: { content: string } }> };
      const raw = j.choices[0]?.message?.content ?? "";
      const parsed = JSON.parse(raw);
      const items: NewsItem[] = Array.isArray(parsed) ? parsed : parsed.items ?? parsed.news ?? [];
      if (!items.length) throw new Error("empty");
      cache = { at: Date.now(), region: data.region, items };
      return { items, source: "ai", updated: new Date().toISOString() };
    } catch {
      return { items: FALLBACK, source: "fallback", updated: new Date().toISOString() };
    }
  });
