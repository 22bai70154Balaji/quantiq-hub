import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGroq } from "@/lib/finflow/groq.server";

export type AnalysisInsights = {
  summary: string;
  recommendations: string[];
  risks: string[];
  nextSteps: string[];
  confidence: "low" | "medium" | "high";
};

const InputSchema = z.object({
  calculatorType: z.string().min(1).max(64),
  country: z.string().min(2).max(4),
  brief: z.string().min(10).max(4000),
  saveToId: z.string().uuid().optional(),
});

function fallback(brief: string): AnalysisInsights {
  return {
    summary: brief.slice(0, 240),
    recommendations: [
      "Verify the inputs against your latest bank statement or offer letter.",
      "Compare at least two lenders / providers before committing.",
      "Set a monthly review reminder — rates and rules change.",
    ],
    risks: [
      "Interest rates, tax slabs, and market returns can change over time.",
      "This projection assumes constant inputs and does not model fees or taxes exhaustively.",
    ],
    nextSteps: [
      "Save this report and share it with a licensed advisor for a second opinion.",
      "Re-run the analysis with a stress-test scenario (higher rate, lower return).",
    ],
    confidence: "medium",
  };
}

function parseInsights(raw: string): AnalysisInsights {
  try {
    const parsed = JSON.parse(raw) as Partial<AnalysisInsights>;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 6).map(String) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 5).map(String) : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.slice(0, 5).map(String) : [],
      confidence: parsed.confidence === "low" || parsed.confidence === "high" ? parsed.confidence : "medium",
    };
  } catch {
    return fallback(raw);
  }
}

export const analyzeCalculation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ context, data }): Promise<AnalysisInsights> => {
    if (!process.env.GROQ_API_KEY) {
      const insights = fallback(data.brief);
      if (data.saveToId) {
        await context.supabase
          .from("saved_calculations")
          .update({ ai_insights: insights as never })
          .eq("id", data.saveToId);
      }
      return insights;
    }

    const jurisdiction = data.country === "IN" ? "India (INR)" : data.country === "US" ? "USA (USD)" : "UAE (AED)";
    const sys = `You are Calculyx AI's financial analyst. You are given a compact "brief" describing a user's calculation.
Return STRICT JSON matching:
{"summary": string (max 3 sentences),
 "recommendations": string[3-5],
 "risks": string[2-4],
 "nextSteps": string[2-4],
 "confidence": "low"|"medium"|"high"}
Rules: numerate, plain-spoken, cite jurisdiction (${jurisdiction}), no legal/tax advice, no markdown, no code fences. Recommendations must be specific and actionable. Confidence should be "high" only if the numbers are clearly derived from stable rules.`;

    try {
      const raw = await callGroq(
        [
          { role: "system", content: sys },
          { role: "user", content: data.brief },
        ],
        { json: true, temperature: 0.4 },
      );
      const parsed = parseInsights(raw);
      if (data.saveToId) {
        await context.supabase
          .from("saved_calculations")
          .update({ ai_insights: parsed as never })
          .eq("id", data.saveToId);
      }
      return parsed;
    } catch {
      return fallback(data.brief);
    }
  });
