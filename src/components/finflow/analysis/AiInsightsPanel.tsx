import { motion } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import type { AnalysisInsights } from "@/lib/finflow/analysis/insights.functions";

export function AiInsightsPanel({
  insights,
  loading,
  error,
  onRun,
  hasRun,
}: {
  insights: AnalysisInsights | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
  hasRun: boolean;
}) {
  return (
    <div className="rounded-2xl border border-sheen glass p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight">AI Insights</div>
            <div className="text-xs text-muted-foreground">Personalised recommendations — informational, not advice</div>
          </div>
        </div>
        {!loading && (
          <button
            onClick={onRun}
            className="rounded-full border border-sheen bg-card/70 px-4 py-1.5 text-sm font-medium hover:bg-muted"
          >
            {hasRun ? "Re-generate" : "Generate"}
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Analysing your numbers…
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" /> {error}
        </div>
      )}

      {insights && !loading && (
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-5 space-y-6"
        >
          {insights.summary && (
            <p className="text-[15px] leading-7 text-foreground/90">{insights.summary}</p>
          )}
          <InsightList title="Recommendations" tone="primary" items={insights.recommendations} />
          <InsightList title="Risks to watch" tone="warning" items={insights.risks} />
          <InsightList title="Next steps" tone="success" items={insights.nextSteps} />
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Confidence: <span className="font-medium capitalize text-foreground">{insights.confidence}</span>
          </div>
        </motion.div>
      )}

      {!insights && !loading && !error && (
        <div className="mt-6 text-sm text-muted-foreground">
          Click <span className="text-foreground font-medium">Generate</span> to have FinFlow AI review your inputs and produce recommendations.
        </div>
      )}
    </div>
  );
}

function InsightList({ title, items, tone }: { title: string; items: string[]; tone: "primary" | "warning" | "success" }) {
  if (!items?.length) return null;
  const dot = tone === "warning" ? "bg-warning" : tone === "success" ? "bg-success" : "bg-primary";
  return (
    <div>
      <div className="text-sm font-semibold tracking-tight">{title}</div>
      <ul className="mt-2 space-y-2 text-sm text-foreground/90">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
