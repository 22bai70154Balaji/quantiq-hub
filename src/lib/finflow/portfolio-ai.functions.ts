import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGroq } from "./groq.server";

export type AiReport = {
  score: number; // 0-100 portfolio health
  summary: string;
  strengths: string[];
  risks: string[];
  concentrationFlags: Array<{ label: string; severity: "info" | "warn" | "high"; note: string }>;
  rebalance: Array<{ asset_class: string; current_pct: number; target_pct: number; action: "buy" | "sell" | "hold"; delta_pct: number }>;
  recommendations: Array<{ title: string; detail: string; impact: "low" | "medium" | "high" }>;
  taxTips: string[];
  emergencyFund: { status: "unknown" | "low" | "ok" | "strong"; note: string };
  projection: { years: 10; assumedReturnPct: number; projectedValue: number };
  confidence: number; // 0-1
  generatedAt: string;
};

const PROFILE = z.enum(["conservative", "balanced", "aggressive"]).default("balanced");

// Preset target allocations (%). Sums to 100.
const TARGETS: Record<"conservative" | "balanced" | "aggressive", Record<string, number>> = {
  conservative: { stock: 15, etf: 10, mutual_fund: 15, bond: 25, fd: 15, gold: 10, ppf: 5, epf: 3, nps: 2, crypto: 0 },
  balanced:     { stock: 25, etf: 15, mutual_fund: 20, bond: 12, fd: 8, gold: 8, ppf: 4, epf: 3, nps: 3, crypto: 2 },
  aggressive:   { stock: 40, etf: 15, mutual_fund: 20, bond: 5, fd: 3, gold: 5, ppf: 2, epf: 2, nps: 3, crypto: 5 },
};

const RETURN_ASSUMPTION: Record<"conservative" | "balanced" | "aggressive", number> = {
  conservative: 8,
  balanced: 11,
  aggressive: 14,
};

function computeLocalScore(input: {
  diversificationScore: number;
  riskBand: "Low" | "Moderate" | "High";
  maxPct: number;
  hasEmergency: boolean;
  totalValue: number;
}): number {
  let score = 50;
  score += (input.diversificationScore - 50) * 0.4; // ±20
  score += input.riskBand === "Low" ? 8 : input.riskBand === "Moderate" ? 4 : -6;
  if (input.maxPct > 60) score -= 12;
  if (input.hasEmergency) score += 8;
  if (input.totalValue > 0) score += 4;
  return Math.max(0, Math.min(100, Math.round(score)));
}

const AiJsonSchema = z.object({
  summary: z.string().max(500),
  strengths: z.array(z.string().max(200)).max(6).default([]),
  risks: z.array(z.string().max(200)).max(6).default([]),
  recommendations: z
    .array(
      z.object({
        title: z.string().max(120),
        detail: z.string().max(400),
        impact: z.enum(["low", "medium", "high"]).default("medium"),
      }),
    )
    .max(6)
    .default([]),
  taxTips: z.array(z.string().max(240)).max(4).default([]),
  emergencyFundNote: z.string().max(240).default(""),
  confidence: z.number().min(0).max(1).default(0.7),
});

export const analyzePortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        profile: PROFILE,
        currency: z.string().min(2).max(4).default("INR"),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<AiReport> => {
    // Pull holdings + summary via same computation used by portfolio panel
    const { data: rows, error } = await context.supabase
      .from("holdings")
      .select("asset_class, symbol, name, quantity, avg_cost, currency, manual_price");
    if (error) throw new Error(error.message);

    const symbols = (rows ?? []).filter((r) => r.symbol).map((r) => r.symbol as string);
    const priceMap = new Map<string, number>();
    if (symbols.length) {
      const { data: prices } = await context.supabase
        .from("holding_prices")
        .select("symbol, asset_class, price")
        .in("symbol", symbols);
      for (const p of prices ?? []) priceMap.set(`${p.symbol}:${p.asset_class}`, Number(p.price));
    }

    // Compute allocation + totals
    const alloc = new Map<string, number>();
    let totalValue = 0;
    let totalCost = 0;
    for (const r of rows ?? []) {
      const qty = Number(r.quantity);
      const avg = Number(r.avg_cost);
      const cached = r.symbol ? priceMap.get(`${r.symbol}:${r.asset_class}`) : undefined;
      const price = r.manual_price != null ? Number(r.manual_price) : (cached ?? avg);
      const value = qty * price;
      totalValue += value;
      totalCost += qty * avg;
      alloc.set(r.asset_class, (alloc.get(r.asset_class) ?? 0) + value);
    }
    const allocPct: Record<string, number> = {};
    for (const [k, v] of alloc.entries()) allocPct[k] = totalValue > 0 ? (v / totalValue) * 100 : 0;

    // Net worth signal for emergency fund heuristic
    const { data: nw } = await context.supabase
      .from("net_worth_entries")
      .select("category, kind, amount")
      .eq("kind", "asset");
    const cash = (nw ?? []).filter((e) => e.category === "cash").reduce((s, e) => s + Number(e.amount), 0);
    // Assume monthly expense ~ 3% of total portfolio (rough); flag <3 months
    const monthlyExpenseGuess = Math.max(totalValue * 0.03, 25000);
    const emergencyMonths = monthlyExpenseGuess > 0 ? cash / monthlyExpenseGuess : 0;
    const emergencyStatus: AiReport["emergencyFund"]["status"] =
      emergencyMonths >= 6 ? "strong" : emergencyMonths >= 3 ? "ok" : emergencyMonths > 0 ? "low" : "unknown";

    // Diversification + risk (mirror portfolio.functions.ts)
    const sorted = Object.entries(allocPct).sort((a, b) => b[1] - a[1]);
    const maxPct = sorted[0]?.[1] ?? 0;
    const hhi = sorted.reduce((s, [, p]) => s + Math.pow(p / 100, 2), 0);
    const diversificationScore = Math.max(0, Math.min(100, Math.round((1 - hhi) * 100)));
    const volatile = (allocPct.stock ?? 0) + (allocPct.crypto ?? 0);
    const riskBand: "Low" | "Moderate" | "High" =
      volatile > 70 || maxPct > 70 ? "High" : volatile < 30 && maxPct < 40 ? "Low" : "Moderate";

    // Rebalance vs target
    const target = TARGETS[data.profile];
    const rebalance: AiReport["rebalance"] = Object.keys(target).map((k) => {
      const current = allocPct[k] ?? 0;
      const t = target[k] ?? 0;
      const delta = current - t;
      const action: "buy" | "sell" | "hold" = delta > 2 ? "sell" : delta < -2 ? "buy" : "hold";
      return { asset_class: k, current_pct: current, target_pct: t, delta_pct: delta, action };
    }).filter((r) => r.current_pct > 0 || r.target_pct > 0);

    // Concentration flags (rule-based)
    const concentrationFlags: AiReport["concentrationFlags"] = [];
    for (const [k, p] of sorted) {
      if (p > 60) concentrationFlags.push({ label: k, severity: "high", note: `${p.toFixed(0)}% concentration is very high` });
      else if (p > 40) concentrationFlags.push({ label: k, severity: "warn", note: `${p.toFixed(0)}% concentration is elevated` });
    }
    if ((allocPct.crypto ?? 0) > 10) {
      concentrationFlags.push({ label: "crypto", severity: "warn", note: "Crypto above 10% raises volatility" });
    }

    // Local score (used if AI fails)
    const localScore = computeLocalScore({
      diversificationScore,
      riskBand,
      maxPct,
      hasEmergency: emergencyStatus === "ok" || emergencyStatus === "strong",
      totalValue,
    });

    // Projection: current corpus grown at profile return for 10y
    const r = RETURN_ASSUMPTION[data.profile] / 100;
    const projectedValue = totalValue * Math.pow(1 + r, 10);

    // Call Groq for narrative + tailored recommendations
    const brief = {
      currency: data.currency,
      profile: data.profile,
      totalValue: Math.round(totalValue),
      totalCost: Math.round(totalCost),
      totalGainPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      diversificationScore,
      riskBand,
      allocation: Object.fromEntries(sorted.map(([k, v]) => [k, Number(v.toFixed(1))])),
      target: Object.fromEntries(Object.entries(target).map(([k, v]) => [k, v])),
      cash: Math.round(cash),
      emergencyMonths: Number(emergencyMonths.toFixed(1)),
      holdingsCount: (rows ?? []).length,
    };

    const system = `You are a senior portfolio analyst for retail investors in India.
Return ONLY a JSON object matching this schema (no prose outside JSON):
{
  "summary": "1-2 sentence plain English",
  "strengths": ["short bullet", ...],
  "risks": ["short bullet", ...],
  "recommendations": [{"title": "…", "detail": "actionable step", "impact": "low|medium|high"}],
  "taxTips": ["India-focused tax tip", ...],
  "emergencyFundNote": "single line advice on emergency fund adequacy",
  "confidence": 0.0-1.0
}
Rules:
- Be specific to the numbers you see; never invent data.
- Never give guarantees. Use words like "consider", "may", "could".
- No disclaimers about being an AI.
- Keep each bullet under ~180 chars.`;

    let ai: z.infer<typeof AiJsonSchema> = {
      summary:
        totalValue === 0
          ? "No holdings yet. Add positions to unlock a tailored analysis."
          : "Portfolio analysis is unavailable right now.",
      strengths: [],
      risks: [],
      recommendations: [],
      taxTips: [],
      emergencyFundNote: "",
      confidence: 0.5,
    };

    if (totalValue > 0) {
      try {
        const raw = await callGroq(
          [
            { role: "system", content: system },
            { role: "user", content: `Portfolio brief:\n${JSON.stringify(brief, null, 2)}` },
          ],
          { json: true, temperature: 0.4 },
        );
        const parsed = AiJsonSchema.safeParse(JSON.parse(raw));
        if (parsed.success) ai = parsed.data;
      } catch {
        // fall back to local
      }
    }

    return {
      score: localScore,
      summary: ai.summary,
      strengths: ai.strengths,
      risks: ai.risks,
      concentrationFlags,
      rebalance: rebalance.sort((a, b) => Math.abs(b.delta_pct) - Math.abs(a.delta_pct)),
      recommendations: ai.recommendations,
      taxTips: ai.taxTips,
      emergencyFund: {
        status: emergencyStatus,
        note:
          ai.emergencyFundNote ||
          (emergencyStatus === "unknown"
            ? "Add cash entries to Net Worth for a real assessment."
            : `~${emergencyMonths.toFixed(1)} months of runway in cash.`),
      },
      projection: { years: 10, assumedReturnPct: RETURN_ASSUMPTION[data.profile], projectedValue },
      confidence: ai.confidence,
      generatedAt: new Date().toISOString(),
    };
  });
