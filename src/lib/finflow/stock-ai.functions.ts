import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGroq } from "./groq.server";

export type StockAiInsights = {
  summary: string;
  bullCase: string[];
  bearCase: string[];
  risks: string[];
  valuation: string;
};

const cache = new Map<string, { at: number; data: StockAiInsights }>();
const TTL = 6 * 60 * 60 * 1000;

export const getStockAiInsights = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    symbol: z.string().min(1).max(30),
    name: z.string().min(1).max(100),
    sector: z.string().max(60).optional(),
    price: z.number().optional(),
    pe: z.number().optional(),
    roe: z.number().optional(),
  }).parse(d))
  .handler(async ({ data }): Promise<StockAiInsights> => {
    const key = data.symbol.toUpperCase();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.data;

    const context = [
      `Company: ${data.name} (${data.symbol})`,
      data.sector ? `Sector: ${data.sector}` : null,
      data.price ? `Current price: ${data.price}` : null,
      data.pe ? `P/E: ${data.pe.toFixed(1)}` : null,
      data.roe ? `ROE: ${data.roe.toFixed(1)}%` : null,
    ].filter(Boolean).join("\n");

    const prompt = `You are an equity analyst. For the following stock, produce a JSON object with these keys:
- summary (2-3 sentences, plain english, no markdown)
- bullCase (array of 3-4 short bullet strings)
- bearCase (array of 3-4 short bullet strings)
- risks (array of 3-4 short bullet strings)
- valuation (1-2 sentences, mention if fairly valued/expensive/cheap given the P/E and ROE if provided)

Stay factual and general. Do not invent specific price targets. Return ONLY valid JSON, no prose outside it.

${context}`;

    let raw = "";
    try {
      raw = await callGroq(
        [{ role: "system", content: "You are a concise equity analyst. Respond only with valid JSON." },
         { role: "user", content: prompt }],
        { json: true, temperature: 0.4 },
      );
    } catch {
      const fallback: StockAiInsights = {
        summary: `${data.name} is a ${data.sector ?? "listed"} company. Live AI insights are temporarily unavailable — retry shortly.`,
        bullCase: ["Established market presence", "Consistent operating history", "Liquid, widely-followed stock"],
        bearCase: ["Sector cyclicality risk", "Macro/interest-rate sensitivity", "Competitive pressure"],
        risks: ["Regulatory changes", "Currency & commodity exposure", "Execution risk"],
        valuation: "AI valuation summary is unavailable right now.",
      };
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StockAiInsights>;
      const clean: StockAiInsights = {
        summary: String(parsed.summary ?? "").slice(0, 800),
        bullCase: Array.isArray(parsed.bullCase) ? parsed.bullCase.slice(0, 5).map((s) => String(s).slice(0, 200)) : [],
        bearCase: Array.isArray(parsed.bearCase) ? parsed.bearCase.slice(0, 5).map((s) => String(s).slice(0, 200)) : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 5).map((s) => String(s).slice(0, 200)) : [],
        valuation: String(parsed.valuation ?? "").slice(0, 400),
      };
      cache.set(key, { at: Date.now(), data: clean });
      return clean;
    } catch {
      return {
        summary: raw.slice(0, 500),
        bullCase: [],
        bearCase: [],
        risks: [],
        valuation: "",
      };
    }
  });
