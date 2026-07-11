import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";
import type { AnalysisInsights } from "@/lib/finflow/analysis/insights.functions";
import { analyzeCalculation } from "@/lib/finflow/analysis/insights.functions";
import { saveCalculation } from "@/lib/finflow/analysis/calculations.functions";
import { AnalysisActions, type SavedState } from "./analysis/AnalysisActions";
import { KpiGrid } from "./analysis/KpiGrid";
import { BreakdownTableView } from "./analysis/BreakdownTableView";
import { ComparisonTable } from "./analysis/ComparisonTable";
import { AiInsightsPanel } from "./analysis/AiInsightsPanel";
import { AssumptionsPanel } from "./analysis/AssumptionsPanel";
import { DisclaimerBanner } from "./analysis/DisclaimerBanner";

export function CalcShell({
  title, tagline, children, accent, icon: Icon,
  saveType, saveInputs, saveResults, saveName,
  analysisPayload, chartNodeIds,
}: {
  title: string; tagline: string; children: ReactNode; accent: string;
  icon: React.ComponentType<{ className?: string }>;
  saveType?: string;
  saveInputs?: Record<string, unknown>;
  saveResults?: Record<string, unknown>;
  saveName?: string;
  /** When provided, replaces the simple Save button with the full analysis actions bar
   *  AND renders KPI hero + breakdown + comparison + AI + assumptions + disclaimer below children. */
  analysisPayload?: AnalysisPayload;
  chartNodeIds?: string[];
}) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<SavedState | null>(null);
  const [insights, setInsights] = useState<AnalysisInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const analyze = useServerFn(analyzeCalculation);
  const saveFn = useServerFn(saveCalculation);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  async function legacySave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in to save calculations"); return; }
    const { error } = await supabase.from("saved_calculations").insert({
      user_id: user.id,
      calculator_type: saveType!,
      name: saveName ?? title,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputs: (saveInputs ?? {}) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results: (saveResults ?? {}) as any,
    });
    if (error) toast.error(error.message); else toast.success("Saved to dashboard");
  }

  async function ensureSaved(): Promise<SavedState | null> {
    if (!analysisPayload) return null;
    if (saved) return saved;
    if (signedIn === false) {
      toast.error("Sign in to save this report");
      navigate({ to: "/auth" });
      return null;
    }
    setSaving(true);
    try {
      const row = await saveFn({
        data: {
          calculatorType: analysisPayload.slug,
          name: analysisPayload.title,
          country: analysisPayload.country,
          inputs: analysisPayload.raw.inputs,
          results: analysisPayload.raw.results,
          summary: {
            kpis: analysisPayload.kpis.map((k) => ({ label: k.label, value: k.value, tone: k.tone })),
            country: analysisPayload.country,
            subtitle: analysisPayload.subtitle,
          },
        },
      });
      const s: SavedState = {
        id: row.id,
        reportId: row.report_id ?? "",
        shareSlug: row.share_slug ?? null,
        isPublic: !!row.is_public,
      };
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
    if (!analysisPayload || aiLoading) return;
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
          calculatorType: analysisPayload.slug,
          country: analysisPayload.country,
          brief: analysisPayload.aiBrief,
          saveToId: s?.id,
        },
      });
      setInsights(res);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className={analysisPayload ? "bg-page-gradient min-h-screen" : ""}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24 pt-28">
        <Link to="/calculators" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden">
          <ArrowLeft className="h-3.5 w-3.5" /> All calculators
        </Link>
        <motion.div
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-elegant`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              {saved?.reportId && (
                <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">Report {saved.reportId}</div>
              )}
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              <p className="mt-1 max-w-xl text-muted-foreground">{tagline}</p>
            </div>
          </div>
          {analysisPayload ? (
            <AnalysisActions
              payload={analysisPayload}
              chartNodeIds={chartNodeIds ?? []}
              insights={insights}
              saved={saved}
              onSaved={setSaved}
              signedIn={signedIn}
              saving={saving}
              aiLoading={aiLoading}
              onRunAi={runAi}
              onEnsureSaved={ensureSaved}
            />
          ) : saveType ? (
            <Button variant="outline" size="sm" onClick={legacySave} className="rounded-full">
              <Bookmark className="mr-1 h-3.5 w-3.5" /> Save
            </Button>
          ) : null}
        </motion.div>

        {analysisPayload && (
          <section className="mt-8">
            <KpiGrid kpis={analysisPayload.kpis} />
          </section>
        )}

        <div className="mt-6">{children}</div>

        {analysisPayload && (
          <>
            {analysisPayload.comparison && (
              <section className="mt-8">
                <ComparisonTable block={analysisPayload.comparison} />
              </section>
            )}
            {analysisPayload.breakdown && (
              <section className="mt-8">
                <BreakdownTableView table={analysisPayload.breakdown} />
              </section>
            )}
            <section className="mt-8">
              <AiInsightsPanel
                insights={insights}
                loading={aiLoading}
                error={aiError}
                hasRun={!!insights}
                onRun={runAi}
              />
            </section>
            {analysisPayload.assumptions?.length ? (
              <section className="mt-6">
                <AssumptionsPanel items={analysisPayload.assumptions} />
              </section>
            ) : null}
            <section className="mt-6">
              <DisclaimerBanner />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "primary" | "success" | "warning" | "destructive" }) {
  const tones: Record<string, string> = {
    primary: "text-gradient",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-soft">
      <div className="truncate text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-xl font-semibold leading-tight tracking-tight tabular-nums break-words sm:text-2xl ${tone ? tones[tone] : ""}`}>
        {value}
      </div>
      {sub && <div className="mt-1 truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function InputRow({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function NumberInput({
  value, onChange, prefix, suffix, step = 1, min, max,
}: {
  value: number; onChange: (n: number) => void; prefix?: string; suffix?: string; step?: number; min?: number; max?: number;
}) {
  const [text, setText] = useState<string>(Number.isFinite(value) ? String(value) : "");
  const focused = useRef(false);

  // Sync from parent when not actively editing.
  useEffect(() => {
    if (!focused.current) {
      setText(Number.isFinite(value) ? String(value) : "");
    }
  }, [value]);

  return (
    <div className="flex items-center rounded-xl border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      {prefix && <span className="pl-3 text-sm text-muted-foreground">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        value={text}
        step={step}
        onFocus={(e) => {
          focused.current = true;
          e.currentTarget.select();
        }}
        onBlur={() => {
          focused.current = false;
          if (text.trim() === "" || text === "-" || text === ".") {
            setText("0");
            onChange(0);
          }
        }}
        onChange={(e) => {
          const raw = e.target.value;
          // Allow empty, minus, and partial decimals during typing.
          if (raw === "" || raw === "-" || raw === "." || /^-?\d*\.?\d*$/.test(raw)) {
            setText(raw);
            const n = raw === "" || raw === "-" || raw === "." ? NaN : Number(raw);
            if (Number.isFinite(n)) {
              let clamped = n;
              if (typeof min === "number" && clamped < min) clamped = min;
              if (typeof max === "number" && clamped > max) clamped = max;
              onChange(clamped);
            }
          }
        }}
        className="w-full bg-transparent px-3 py-2.5 text-base font-medium focus:outline-none"
      />
      {suffix && <span className="pr-3 text-sm text-muted-foreground">{suffix}</span>}
    </div>
  );
}
