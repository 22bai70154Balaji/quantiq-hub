import { createFileRoute } from "@tanstack/react-router";
import { getSharedCalculation } from "@/lib/finflow/analysis/calculations.functions";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { KpiGrid } from "@/components/finflow/analysis/KpiGrid";
import { DisclaimerBanner } from "@/components/finflow/analysis/DisclaimerBanner";
import { AssumptionsPanel } from "@/components/finflow/analysis/AssumptionsPanel";
import { BreakdownTableView } from "@/components/finflow/analysis/BreakdownTableView";
import { ComparisonTable } from "@/components/finflow/analysis/ComparisonTable";
import { CALC_BY_SLUG, type CalcSlug } from "@/lib/finflow/registry";
import { COUNTRIES, type Country } from "@/lib/finflow/countries";
import type { AnalysisPayload, Kpi } from "@/lib/finflow/analysis/types";

export const Route = createFileRoute("/r/$slug")({
  loader: ({ params }) => getSharedCalculation({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const title = loaderData?.name ? `${loaderData.name} — FinFlow AI report` : "Shared financial analysis — FinFlow AI";
    const desc = `A shareable FinFlow AI ${String(loaderData?.calculator_type ?? "financial")} analysis. Estimates only — verify with your bank.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Report unavailable</h1>
          <p className="mt-3 text-muted-foreground">{error?.message ?? "This report is private or no longer exists."}</p>
        </div>
      </main>
      <Footer />
    </div>
  ),
  notFoundComponent: () => (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Report not found</h1>
        </div>
      </main>
      <Footer />
    </div>
  ),
  component: SharedReportPage,
});

type Summary = {
  kpis?: { label: string; value: string; tone?: Kpi["tone"] }[];
  country?: Country;
  subtitle?: string;
};

type AiInsights = {
  summary?: string;
  recommendations?: string[];
  risks?: string[];
  nextSteps?: string[];
  confidence?: "low" | "medium" | "high";
};

function SharedReportPage() {
  const row = Route.useLoaderData();
  const meta = CALC_BY_SLUG[row.calculator_type as CalcSlug];
  const summary: Summary = (row.summary ?? {}) as Summary;
  const country: Country = (row.country as Country) ?? summary.country ?? "IN";
  const c = COUNTRIES[country];
  const kpis: Kpi[] = summary.kpis ?? [];
  const insights: AiInsights | null = (row.ai_insights as AiInsights | null) ?? null;

  // Reconstruct a minimal payload from stored raw inputs/results so we can reuse the breakdown table if present.
  const payload = (row.results as { breakdown?: AnalysisPayload["breakdown"]; comparison?: AnalysisPayload["comparison"]; assumptions?: string[] } | null) ?? {};

  const Icon = meta?.icon;

  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24">
        <article className="mx-auto max-w-5xl px-6 py-10">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-primary flex flex-wrap items-center gap-2">
            <span>Shared FinFlow AI report</span>
            {row.report_id && (<><span className="text-muted-foreground">·</span><span className="font-mono text-muted-foreground">{row.report_id}</span></>)}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{c.flag} {c.name}</span>
          </div>
          <div className="mt-3 flex items-start gap-4">
            {Icon && (
              <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${meta.accent} text-white shadow-elegant`}>
                <Icon className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                {row.name}
              </h1>
              {summary.subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{summary.subtitle}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                Generated {new Date(row.created_at as string).toLocaleString()}
              </p>
            </div>
          </div>

          {kpis.length > 0 && (
            <section className="mt-8">
              <KpiGrid kpis={kpis} />
            </section>
          )}

          {payload.comparison && (
            <section className="mt-8">
              <ComparisonTable block={payload.comparison} />
            </section>
          )}

          {payload.breakdown && (
            <section className="mt-8">
              <BreakdownTableView table={payload.breakdown} />
            </section>
          )}

          {insights && (
            <section className="mt-8 rounded-2xl border border-sheen glass p-6 shadow-soft">
              <div className="font-display text-lg font-semibold tracking-tight">AI Insights</div>
              {insights.summary && <p className="mt-3 text-[15px] leading-7 text-foreground/90">{insights.summary}</p>}
              {insights.recommendations?.length ? (
                <>
                  <div className="mt-6 text-sm font-semibold">Recommendations</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {insights.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{r}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {insights.risks?.length ? (
                <>
                  <div className="mt-6 text-sm font-semibold">Risks to watch</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {insights.risks.map((r, i) => (
                      <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />{r}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
          )}

          {payload.assumptions?.length ? (
            <section className="mt-6">
              <AssumptionsPanel items={payload.assumptions} />
            </section>
          ) : null}

          <section className="mt-6">
            <DisclaimerBanner />
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
