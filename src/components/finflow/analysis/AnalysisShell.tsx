import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { KpiGrid } from "./KpiGrid";
import { BreakdownTableView } from "./BreakdownTableView";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { AiInsightsPanel } from "./AiInsightsPanel";
import { ComparisonTable } from "./ComparisonTable";
import { AnalysisActions, type SavedState } from "./AnalysisActions";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";
import type { AnalysisInsights } from "@/lib/finflow/analysis/insights.functions";
import { analyzeCalculation } from "@/lib/finflow/analysis/insights.functions";
import { saveCalculation } from "@/lib/finflow/analysis/calculations.functions";
import { COUNTRIES } from "@/lib/finflow/countries";

/**
 * Full-analysis shell. Wraps any calculator with:
 * - Hero (title + KPIs)
 * - Actions (Save / AI / Export / Share)
 * - The calculator's own inputs + charts
 * - Breakdown / Comparison / AI Insights / Assumptions / Disclaimer
 */
export function AnalysisShell({
  payload,
  inputs,
  charts,
  chartNodeIds = [],
  accent,
  icon: Icon,
}: {
  payload: AnalysisPayload;
  inputs: ReactNode;
  charts: ReactNode;
  chartNodeIds?: string[];
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const [saved, setSaved] = useState<SavedState | null>(null);
  const [insights, setInsights] = useState<AnalysisInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const analyze = useServerFn(analyzeCalculation);
  const save = useServerFn(saveCalculation);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  const country = COUNTRIES[payload.country];

  async function ensureSaved(): Promise<SavedState | null> {
    if (saved) return saved;
    if (signedIn === false) {
      toast.error("Sign in to save this report");
      navigate({ to: "/auth" });
      return null;
    }
    setSaving(true);
    try {
      const row = await save({
        data: {
          calculatorType: payload.slug,
          name: payload.title,
          country: payload.country,
          inputs: payload.raw.inputs,
          results: payload.raw.results,
          summary: {
            kpis: payload.kpis.map((k) => ({ label: k.label, value: k.value })),
            country: payload.country,
          },
        },
      });
      const s: SavedState = { id: row.id, reportId: row.report_id ?? "", shareSlug: row.share_slug ?? null, isPublic: !!row.is_public };
      setSaved(s);
      toast.success("Saved to your dashboard");
      return s;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function runAi() {
    if (aiLoading) return;
    if (signedIn === false) {
      toast.error("Sign in to use AI Insights");
      navigate({ to: "/auth" });
      return;
    }
    setAiError(null);
    setAiLoading(true);
    try {
      const s = await ensureSaved();
      const res = await analyze({
        data: {
          calculatorType: payload.slug,
          country: payload.country,
          brief: payload.aiBrief,
          saveToId: s?.id,
        },
      });
      setInsights(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI failed";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="bg-page-gradient min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24 pt-28">
        <Link to="/calculators" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden">
          <ArrowLeft className="h-3.5 w-3.5" /> All calculators
        </Link>

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-elegant`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                <span>Analysis</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{country.flag} {country.name}</span>
                {saved?.reportId && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-mono text-muted-foreground">{saved.reportId}</span>
                  </>
                )}
              </div>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {payload.title.replace(/analysis$/i, "").trim()}{" "}
                <span className="font-serif italic text-gold">analysis</span>
              </h1>
              {payload.subtitle && <p className="mt-1 max-w-xl text-muted-foreground">{payload.subtitle}</p>}
            </div>
          </div>
          <AnalysisActions
            payload={payload}
            chartNodeIds={chartNodeIds}
            insights={insights}
            saved={saved}
            onSaved={setSaved}
            signedIn={signedIn}
            saving={saving}
            aiLoading={aiLoading}
            onRunAi={runAi}
            onEnsureSaved={ensureSaved}
          />
        </motion.div>

        {/* KPI hero */}
        <section className="mt-8">
          <KpiGrid kpis={payload.kpis} />
        </section>

        {/* Inputs + Charts */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-5 rounded-2xl border border-sheen glass p-6 shadow-soft">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Inputs</div>
            {inputs}
          </div>
          <div className="space-y-4">{charts}</div>
        </section>

        {/* Comparison */}
        {payload.comparison && (
          <section className="mt-8">
            <ComparisonTable block={payload.comparison} />
          </section>
        )}

        {/* Breakdown */}
        {payload.breakdown && (
          <section className="mt-8">
            <BreakdownTableView table={payload.breakdown} />
          </section>
        )}

        {/* AI Insights */}
        <section className="mt-8">
          <AiInsightsPanel
            insights={insights}
            loading={aiLoading}
            error={aiError}
            hasRun={!!insights}
            onRun={runAi}
          />
        </section>

        {/* Assumptions */}
        {payload.assumptions?.length ? (
          <section className="mt-6">
            <AssumptionsPanel items={payload.assumptions} />
          </section>
        ) : null}

        {/* Disclaimer */}
        <section className="mt-6">
          <DisclaimerBanner />
        </section>
      </div>
    </div>
  );
}
