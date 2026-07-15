import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Sparkles, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, Newspaper, LineChart as LineIcon, Calculator, FileDown, FileSpreadsheet, Zap, Brain } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { toast } from "sonner";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { getStockDetail, getStockCandles, getStockNews, getAnalystRatings, getEarnings } from "@/lib/finflow/stock-detail.functions";
import { getStockAiInsights } from "@/lib/finflow/stock-ai.functions";
import { getStockPrediction } from "@/lib/finflow/stock-prediction.functions";
import { getCatalogEntry } from "@/lib/finflow/stocks-catalog";
import { sip, lumpsum, profitLoss, dividend, stockAverage, positionSize, calcBrokerage, BROKERS_IN, BROKERS_US, type BrokerId } from "@/lib/finflow/investing-calcs";
import { exportStockPdf, exportStockXlsx, runAll15, exportAll15Pdf, exportAll15Xlsx, exportPredictionPdf } from "@/lib/finflow/stock-exports";

export const Route = createFileRoute("/stocks/$symbol")({
  head: ({ params }) => {
    const cat = getCatalogEntry(params.symbol);
    const name = cat?.name ?? params.symbol;
    const title = `${name} (${params.symbol.toUpperCase()}) — Live Price, AI Analysis & Calculators`;
    const desc = `Live quote, AI bull/bear case, financial health, news and investment calculators for ${name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: StockDetailPage,
});

function StockDetailPage() {
  const { symbol } = Route.useParams();
  const upperSymbol = symbol.toUpperCase();

  const detail = useQuery({
    queryKey: ["stock-detail", upperSymbol],
    queryFn: () => getStockDetail({ data: { symbol: upperSymbol } }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const [range, setRange] = useState<"1M" | "6M" | "1Y" | "5Y">("1Y");
  const candles = useQuery({
    queryKey: ["stock-candles", upperSymbol, range],
    queryFn: () => getStockCandles({ data: { symbol: upperSymbol, range } }),
    staleTime: 5 * 60_000,
  });

  const news = useQuery({
    queryKey: ["stock-news", upperSymbol],
    queryFn: () => getStockNews({ data: { symbol: upperSymbol } }),
    staleTime: 30 * 60_000,
  });

  const analyst = useQuery({
    queryKey: ["stock-analyst", upperSymbol],
    queryFn: () => getAnalystRatings({ data: { symbol: upperSymbol } }),
    staleTime: 6 * 60 * 60_000,
  });

  const earnings = useQuery({
    queryKey: ["stock-earnings", upperSymbol],
    queryFn: () => getEarnings({ data: { symbol: upperSymbol } }),
    staleTime: 6 * 60 * 60_000,
  });

  const ai = useQuery({
    enabled: !!detail.data,
    queryKey: ["stock-ai", upperSymbol, detail.data?.pe, detail.data?.roe],
    queryFn: () => getStockAiInsights({
      data: {
        symbol: upperSymbol,
        name: detail.data!.name,
        sector: detail.data!.sector,
        price: detail.data!.price,
        pe: detail.data!.pe,
        roe: detail.data!.roe,
      },
    }),
    staleTime: 6 * 60 * 60_000,
  });

  const d = detail.data;
  const up = (d?.change ?? 0) >= 0;
  const currency = d?.currency ?? "USD";
  const fmt = (v?: number) => v == null ? "—" : currency === "INR"
    ? `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
    : `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const fmtBig = (v?: number) => {
    if (v == null) return "—";
    if (currency === "INR") {
      if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
      if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
      return `₹${v.toLocaleString("en-IN")}`;
    }
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${v.toLocaleString("en-US")}`;
  };

  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <Link to="/stocks" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to live stocks
          </Link>

          {/* HEADER */}
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <LogoBox symbol={upperSymbol} name={d?.name ?? upperSymbol} domain={d?.logoDomain} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {d?.region === "IN" ? "🇮🇳 NSE" : "🇺🇸 US"} · {d?.sector ?? "—"} · {upperSymbol}
                </div>
                <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight sm:text-4xl">
                  {d?.name ?? upperSymbol}
                </h1>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-3xl font-semibold tabular-nums">
                {detail.isLoading ? "…" : fmt(d?.price)}
              </div>
              <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {up ? "+" : ""}{fmt(d?.change)} · {(d?.changePercent ?? 0).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* ACTION TOOLBAR */}
          <StockActions
            disabled={!d}
            onExportPdf={() => d && exportStockPdf({ detail: d, candles: candles.data?.candles, news: news.data, analyst: analyst.data, earnings: earnings.data })}
            onExportXlsx={() => d && exportStockXlsx({ detail: d, candles: candles.data?.candles, news: news.data, analyst: analyst.data, earnings: earnings.data })}
            onAnalyzeAll={() => {
              if (!d) return;
              const meta = {
                symbol: upperSymbol,
                name: d.name,
                currency: d.currency,
                price: d.price,
                assumedReturn: getCatalogEntry(upperSymbol)?.assumedReturn ?? 12,
                divYield: d.divYield,
                isIndian: d.region === "IN",
              };
              const bundle = runAll15(meta);
              exportAll15Pdf(bundle);
              exportAll15Xlsx(bundle);
            }}
            calculatorLink={{ pathname: "/investing-calculators", search: { c: "sip", symbol: upperSymbol } }}
          />

          {/* QUICK STATS */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            <QuickStat label="Open" value={fmt(d?.open)} />
            <QuickStat label="Prev close" value={fmt(d?.prevClose)} />
            <QuickStat label="Day high" value={fmt(d?.high)} />
            <QuickStat label="Day low" value={fmt(d?.low)} />
            <QuickStat label="52w high" value={fmt(d?.weekHigh52)} />
            <QuickStat label="52w low" value={fmt(d?.weekLow52)} />
            <QuickStat label="P/E" value={d?.pe ? d.pe.toFixed(1) : "—"} />
            <QuickStat label="Market cap" value={fmtBig(d?.marketCap)} />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* CHART + AI */}
            <div className="lg:col-span-2 space-y-6">
              <Section icon={<LineIcon className="h-4 w-4" />} title="Price chart">
                <div className="mb-3 flex gap-1">
                  {(["1M", "6M", "1Y", "5Y"] as const).map((r) => (
                    <button key={r} onClick={() => setRange(r)}
                      className={`rounded-full px-3 py-1 text-xs font-mono ${range === r ? "bg-primary text-primary-foreground" : "border border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="h-64 w-full">
                  {candles.isLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chart…</div>
                  ) : (candles.data?.candles.length ?? 0) === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Chart data unavailable for this ticker.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={candles.data!.candles}>
                        <defs>
                          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="t" tickFormatter={(t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: range === "5Y" ? undefined : "numeric", year: range === "5Y" ? "2-digit" : undefined })}
                          stroke="rgba(255,255,255,0.4)" fontSize={10} />
                        <YAxis domain={["auto", "auto"]} stroke="rgba(255,255,255,0.4)" fontSize={10} tickFormatter={(v) => currency === "INR" ? `₹${v}` : `$${v}`} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                          labelFormatter={(t) => new Date(t as number).toLocaleDateString()} formatter={(v) => fmt(v as number)} />
                        <Area dataKey="c" stroke="hsl(var(--primary))" fill="url(#priceGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Section>

              <Section icon={<Sparkles className="h-4 w-4" />} title="AI analysis">
                {ai.isLoading ? (
                  <div className="text-sm text-muted-foreground">Generating AI insights…</div>
                ) : ai.data ? (
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-foreground/90">{ai.data.summary}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CaseBox icon={<TrendingUp className="h-4 w-4" />} title="Bull case" tint="emerald" items={ai.data.bullCase} />
                      <CaseBox icon={<TrendingDown className="h-4 w-4" />} title="Bear case" tint="red" items={ai.data.bearCase} />
                    </div>
                    <CaseBox icon={<AlertTriangle className="h-4 w-4" />} title="Key risks" tint="amber" items={ai.data.risks} />
                    {ai.data.valuation && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Valuation view</div>
                        <div className="mt-1 text-foreground/90">{ai.data.valuation}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Insights unavailable.</div>
                )}
                <div className="mt-3 text-[10px] text-muted-foreground">AI-generated. Not financial advice.</div>
              </Section>

              <Section icon={<Newspaper className="h-4 w-4" />} title="Latest news">
                {news.isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading news…</div>
                ) : (news.data?.length ?? 0) === 0 ? (
                  <div className="text-sm text-muted-foreground">No news items available.</div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {news.data!.map((n) => (
                      <li key={n.id} className="py-3">
                        <a href={n.url} target="_blank" rel="noreferrer" className="group block">
                          <div className="text-sm font-medium group-hover:text-primary">{n.headline}</div>
                          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{n.source} · {new Date(n.ts).toLocaleDateString()}</div>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            {/* SIDEBAR: Health + ratings + earnings */}
            <div className="space-y-6">
              <Section icon={<ShieldCheck className="h-4 w-4" />} title="Financial health">
                <HealthScore score={d?.healthScore ?? 0} />
                <ul className="mt-3 space-y-1 text-xs text-foreground/80">
                  {(d?.healthNotes ?? []).map((n, i) => <li key={i}>• {n}</li>)}
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <MetricRow label="ROE" value={d?.roe ? `${d.roe.toFixed(1)}%` : "—"} />
                  <MetricRow label="D/E" value={d?.debtToEquity != null ? d.debtToEquity.toFixed(2) : "—"} />
                  <MetricRow label="Rev growth" value={d?.revenueGrowth != null ? `${d.revenueGrowth.toFixed(1)}%` : "—"} />
                  <MetricRow label="Profit growth" value={d?.profitGrowth != null ? `${d.profitGrowth.toFixed(1)}%` : "—"} />
                  <MetricRow label="Div yield" value={d?.divYield ? `${d.divYield.toFixed(2)}%` : "—"} />
                  <MetricRow label="Beta" value={d?.beta ? d.beta.toFixed(2) : "—"} />
                </div>
              </Section>

              <Section title="Analyst ratings">
                {(analyst.data?.length ?? 0) === 0 ? (
                  <div className="text-sm text-muted-foreground">Not available for this ticker.</div>
                ) : (
                  <RatingsChart data={analyst.data!} />
                )}
              </Section>

              <Section title="Earnings history">
                {(earnings.data?.length ?? 0) === 0 ? (
                  <div className="text-sm text-muted-foreground">Not available.</div>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {earnings.data!.map((e, i) => (
                      <li key={i} className="flex items-center justify-between font-mono">
                        <span className="text-muted-foreground">{e.period}</span>
                        <span>Est {e.estimate ?? "—"} → Act {e.actual ?? "—"}</span>
                        <span className={e.surprise && e.surprise >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {e.surprise != null ? `${e.surprise >= 0 ? "+" : ""}${e.surprise.toFixed(2)}` : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </div>

          {/* CALCULATORS STRIP */}
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <Calculator className="h-4 w-4 text-primary" /> Investment calculators for {upperSymbol}
            </div>
            <StockCalculators price={d?.price ?? 100} symbol={upperSymbol} name={d?.name ?? upperSymbol} currency={currency} assumedReturn={getCatalogEntry(upperSymbol)?.assumedReturn ?? 12} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// -------- helpers --------

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
        {icon}<span>{title}</span>
      </div>
      {children}
    </motion.section>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm tabular-nums">{value}</div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono tabular-nums text-foreground/90">{value}</div>
    </div>
  );
}

function CaseBox({ icon, title, tint, items }: { icon: React.ReactNode; title: string; tint: "emerald" | "red" | "amber"; items: string[] }) {
  const tints = {
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
    red: "border-red-500/20 bg-red-500/5 text-red-300",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-300",
  }[tint];
  return (
    <div className={`rounded-xl border p-3 ${tints}`}>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest">{icon}{title}</div>
      <ul className="space-y-1 text-xs text-foreground/90">
        {items.length === 0 ? <li className="text-muted-foreground">—</li> : items.map((it, i) => <li key={i}>• {it}</li>)}
      </ul>
    </div>
  );
}

function HealthScore({ score }: { score: number }) {
  const color = score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" strokeWidth="10" fill="none" stroke="rgba(255,255,255,0.08)" />
          <circle cx="50" cy="50" r="42" strokeWidth="10" fill="none" stroke="currentColor" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 264} 264`} className={color} />
        </svg>
        <div className={`absolute inset-0 grid place-items-center font-mono text-lg font-bold ${color}`}>{score}</div>
      </div>
      <div>
        <div className="text-sm font-semibold">{score >= 75 ? "Strong" : score >= 50 ? "Fair" : "Weak"}</div>
        <div className="text-xs text-muted-foreground">Score is a heuristic based on growth, leverage, and returns.</div>
      </div>
    </div>
  );
}

function RatingsChart({ data }: { data: Array<{ buy: number; hold: number; sell: number; strongBuy: number; strongSell: number; period: string }> }) {
  const rows = data.map((r) => ({
    period: r.period.slice(0, 7),
    Buy: r.strongBuy + r.buy,
    Hold: r.hold,
    Sell: r.sell + r.strongSell,
  }));
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="period" stroke="rgba(255,255,255,0.4)" fontSize={10} />
          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
          <Bar dataKey="Buy" stackId="a" fill="#10b981" />
          <Bar dataKey="Hold" stackId="a" fill="#94a3b8" />
          <Bar dataKey="Sell" stackId="a" fill="#ef4444">
            {rows.map((_, i) => <Cell key={i} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LogoBox({ symbol, name, domain }: { symbol: string; name: string; domain?: string }) {
  const token = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as string | undefined;
  const [stage, setStage] = useState<"primary" | "fallback" | "initials">("primary");
  const ticker = symbol.replace(/\.(NS|BO)$/i, "");
  const catDomain = getCatalogEntry(symbol)?.logoDomain;
  const useDomain = domain || catDomain;
  const primary = useDomain
    ? `https://img.logo.dev/${useDomain}?token=${token}&size=128&format=png&fallback=404`
    : `https://img.logo.dev/ticker/${encodeURIComponent(ticker)}?token=${token}&size=128&format=png&fallback=404`;
  const fallback = useDomain
    ? `https://img.logo.dev/ticker/${encodeURIComponent(ticker)}?token=${token}&size=128&format=png&fallback=404`
    : null;
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  if (!token || stage === "initials") {
    return <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] font-mono text-lg font-semibold">{initials || ticker.slice(0, 2)}</div>;
  }
  const src = stage === "primary" ? primary : (fallback ?? primary);
  return <img key={src} src={src} alt={`${name} logo`} width={64} height={64}
    onError={() => setStage((s) => (s === "primary" && fallback ? "fallback" : "initials"))}
    className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 bg-white object-contain p-1.5" />;
}

function StockActions({ disabled, onExportPdf, onExportXlsx, onAnalyzeAll, calculatorLink }: {
  disabled: boolean;
  onExportPdf: () => void;
  onExportXlsx: () => void;
  onAnalyzeAll: () => void;
  calculatorLink: { pathname: string; search: Record<string, string> };
}) {
  const [busy, setBusy] = useState(false);
  const handle = async (fn: () => void) => {
    setBusy(true);
    try { fn(); } finally { setTimeout(() => setBusy(false), 400); }
  };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] p-2">
      <button disabled={disabled || busy} onClick={() => handle(onAnalyzeAll)}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-elegant transition hover:brightness-110 disabled:opacity-40">
        <Zap className="h-3.5 w-3.5" /> Analyze all 15 calculators
      </button>
      <button disabled={disabled || busy} onClick={() => handle(onExportPdf)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium hover:bg-white/[0.06] disabled:opacity-40">
        <FileDown className="h-3.5 w-3.5" /> Export stock (PDF)
      </button>
      <button disabled={disabled || busy} onClick={() => handle(onExportXlsx)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium hover:bg-white/[0.06] disabled:opacity-40">
        <FileSpreadsheet className="h-3.5 w-3.5" /> Export stock (Excel)
      </button>
      <Link to={calculatorLink.pathname} search={calculatorLink.search as never}
        className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20">
        <Calculator className="h-3.5 w-3.5" /> Open in 15 calculators
      </Link>
    </div>
  );
}

// -------- stock-page embedded calculators --------

function StockCalculators({ price, symbol, name, currency, assumedReturn }: { price: number; symbol: string; name: string; currency: string; assumedReturn: number }) {
  const [tab, setTab] = useState<"sip" | "lumpsum" | "pl" | "dividend" | "brokerage" | "average" | "position">("sip");
  const tabs = [
    { id: "sip" as const, label: "SIP" },
    { id: "lumpsum" as const, label: "Lumpsum" },
    { id: "pl" as const, label: "Profit/Loss" },
    { id: "dividend" as const, label: "Dividend" },
    { id: "brokerage" as const, label: "Brokerage" },
    { id: "average" as const, label: "Average" },
    { id: "position" as const, label: "Position size" },
  ];
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex flex-wrap gap-1 border-b border-white/5 pb-3">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${tab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
        <Link to="/investing-calculators" className="ml-auto inline-flex items-center gap-1 self-center text-xs text-primary hover:underline">
          All 15 calculators <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-5">
        {tab === "sip" && <SipMini rate={assumedReturn} currency={currency} />}
        {tab === "lumpsum" && <LumpsumMini rate={assumedReturn} currency={currency} name={name} />}
        {tab === "pl" && <ProfitLossMini price={price} currency={currency} />}
        {tab === "dividend" && <DividendMini price={price} currency={currency} />}
        {tab === "brokerage" && <BrokerageMini price={price} currency={currency} symbol={symbol} />}
        {tab === "average" && <AverageMini currency={currency} />}
        {tab === "position" && <PositionMini price={price} currency={currency} />}
      </div>
    </div>
  );
}

function useFmt(currency: string) {
  return (v: number) => currency === "INR" ? `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function NumberField({ value, onChange, step = 1 }: { value: number; onChange: (v: number) => void; step?: number }) {
  return <input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value) || 0)}
    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20" />;
}
function SelectField<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }> }) {
  return <select value={value} onChange={(e) => onChange(e.target.value as T)}
    className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 font-mono text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20">
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;
}
function Result({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "primary" }) {
  const c = tone === "up" ? "text-emerald-400" : tone === "down" ? "text-red-400" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}

function SipMini({ rate, currency }: { rate: number; currency: string }) {
  const fmt = useFmt(currency);
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(10);
  const [r, setR] = useState(rate);
  const res = useMemo(() => sip({ monthly, rate: r, years }), [monthly, r, years]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-3">
        <Field label="Monthly investment"><NumberField value={monthly} step={500} onChange={setMonthly} /></Field>
        <Field label="Years"><NumberField value={years} onChange={setYears} /></Field>
        <Field label="Expected return (% p.a.)"><NumberField value={r} step={0.5} onChange={setR} /></Field>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Result label="Future value" value={fmt(res.futureValue)} tone="primary" />
        <Result label="Invested" value={fmt(res.invested)} />
        <Result label="Gains" value={fmt(res.gains)} tone="up" />
      </div>
    </div>
  );
}

function LumpsumMini({ rate, currency, name }: { rate: number; currency: string; name: string }) {
  const fmt = useFmt(currency);
  const [amount, setAmount] = useState(currency === "INR" ? 100000 : 10000);
  const [years, setYears] = useState(10);
  const [r, setR] = useState(rate);
  const res = useMemo(() => lumpsum({ principal: amount, rate: r, years }), [amount, r, years]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-muted-foreground">
          Simulating a one-time investment in <span className="text-foreground font-medium">{name}</span>.
        </div>
        <Field label={`Investment amount`}><NumberField value={amount} step={1000} onChange={setAmount} /></Field>
        <Field label="Years"><NumberField value={years} onChange={setYears} /></Field>
        <Field label="Expected return (% p.a.)"><NumberField value={r} step={0.5} onChange={setR} /></Field>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Result label="Future value" value={fmt(res.futureValue)} tone="primary" />
        <Result label="Invested" value={fmt(res.invested)} />
        <Result label="Gains" value={fmt(res.gains)} tone="up" />
      </div>
    </div>
  );
}

function ProfitLossMini({ price, currency }: { price: number; currency: string }) {
  const fmt = useFmt(currency);
  const [buy, setBuy] = useState(price);
  const [sell, setSell] = useState(price * 1.1);
  const [qty, setQty] = useState(10);
  const [taxRate, setTaxRate] = useState(currency === "INR" ? 12.5 : 15);
  const res = useMemo(() => profitLoss({ buy, sell, qty, taxRate }), [buy, sell, qty, taxRate]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Buy price"><NumberField value={buy} step={0.5} onChange={setBuy} /></Field>
        <Field label="Sell price"><NumberField value={sell} step={0.5} onChange={setSell} /></Field>
        <Field label="Quantity"><NumberField value={qty} onChange={setQty} /></Field>
        <Field label="Cap-gains tax %"><NumberField value={taxRate} step={0.5} onChange={setTaxRate} /></Field>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Result label="Gross P/L" value={fmt(res.gross)} tone={res.gross >= 0 ? "up" : "down"} />
        <Result label="Tax" value={fmt(res.tax)} />
        <Result label="Net P/L" value={fmt(res.net)} tone={res.net >= 0 ? "up" : "down"} />
        <Result label="ROI" value={`${res.roi.toFixed(2)}%`} tone={res.roi >= 0 ? "up" : "down"} />
      </div>
    </div>
  );
}

function DividendMini({ price, currency }: { price: number; currency: string }) {
  const fmt = useFmt(currency);
  const [shares, setShares] = useState(100);
  const [dps, setDps] = useState(currency === "INR" ? 15 : 1);
  const res = useMemo(() => dividend({ shares, dps, priceForYield: price }), [shares, dps, price]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-3">
        <Field label="Shares owned"><NumberField value={shares} onChange={setShares} /></Field>
        <Field label="Dividend per share (annual)"><NumberField value={dps} step={0.1} onChange={setDps} /></Field>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Result label="Annual income" value={fmt(res.annual)} tone="primary" />
        <Result label="Monthly income" value={fmt(res.monthly)} />
        <Result label="Yield at current price" value={`${res.yieldPct.toFixed(2)}%`} tone="up" />
      </div>
    </div>
  );
}

function BrokerageMini({ price, currency, symbol }: { price: number; currency: string; symbol: string }) {
  const fmt = useFmt(currency);
  const isIndian = symbol.endsWith(".NS") || symbol.endsWith(".BO");
  const brokers = isIndian ? BROKERS_IN : BROKERS_US;
  const [broker, setBroker] = useState<BrokerId>(brokers[0].id);
  const [buy, setBuy] = useState(price);
  const [sell, setSell] = useState(price * 1.05);
  const [qty, setQty] = useState(10);
  const [tradeType, setTradeType] = useState<"intraday" | "delivery">("delivery");
  const res = useMemo(() => calcBrokerage({ broker, buyPrice: buy, sellPrice: sell, qty, tradeType, market: isIndian ? "IN" : "US" }), [broker, buy, sell, qty, tradeType, isIndian]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Broker">
          <SelectField value={broker} onChange={setBroker} options={brokers.map((b) => ({ value: b.id, label: b.name }))} />
        </Field>
        <Field label="Trade type">
          <SelectField value={tradeType} onChange={setTradeType} options={[{ value: "delivery", label: "Delivery" }, { value: "intraday", label: "Intraday" }]} />
        </Field>
        <Field label="Buy price"><NumberField value={buy} step={0.5} onChange={setBuy} /></Field>
        <Field label="Sell price"><NumberField value={sell} step={0.5} onChange={setSell} /></Field>
        <Field label="Quantity"><NumberField value={qty} onChange={setQty} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Result label="Brokerage" value={fmt(res.brokerage)} />
        <Result label="Taxes/fees" value={fmt(res.totalCharges - res.brokerage)} />
        <Result label="Total charges" value={fmt(res.totalCharges)} />
        <Result label="Breakeven %" value={`${res.breakevenPct.toFixed(2)}%`} />
        <div className="col-span-2">
          <Result label="Net P/L" value={fmt(res.netPL)} tone={res.netPL >= 0 ? "up" : "down"} />
        </div>
      </div>
    </div>
  );
}

function AverageMini({ currency }: { currency: string }) {
  const fmt = useFmt(currency);
  const [lots, setLots] = useState([{ qty: 10, price: 400 }, { qty: 20, price: 350 }]);
  const res = useMemo(() => stockAverage(lots), [lots]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        {lots.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <NumberField value={l.qty} onChange={(v) => setLots((prev) => prev.map((x, j) => j === i ? { ...x, qty: v } : x))} />
            <NumberField value={l.price} step={0.5} onChange={(v) => setLots((prev) => prev.map((x, j) => j === i ? { ...x, price: v } : x))} />
            <button onClick={() => setLots((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-muted-foreground hover:text-red-400">✕</button>
          </div>
        ))}
        <button onClick={() => setLots((prev) => [...prev, { qty: 0, price: 0 }])}
          className="rounded-lg border border-dashed border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">+ Add lot</button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Result label="Average cost" value={fmt(res.avg)} tone="primary" />
        <Result label="Total quantity" value={String(res.totalQty)} />
        <Result label="Total invested" value={fmt(res.totalCost)} />
      </div>
    </div>
  );
}

function PositionMini({ price, currency }: { price: number; currency: string }) {
  const fmt = useFmt(currency);
  const [portfolio, setPortfolio] = useState(currency === "INR" ? 1_000_000 : 100_000);
  const [risk, setRisk] = useState(2);
  const [stop, setStop] = useState(5);
  const [entry, setEntry] = useState(price);
  const res = useMemo(() => positionSize({ portfolio, riskPct: risk, stopLossPct: stop, entryPrice: entry }), [portfolio, risk, stop, entry]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-3">
        <Field label="Portfolio size"><NumberField value={portfolio} step={10000} onChange={setPortfolio} /></Field>
        <Field label="Risk per trade (%)"><NumberField value={risk} step={0.25} onChange={setRisk} /></Field>
        <Field label="Stop-loss (%)"><NumberField value={stop} step={0.25} onChange={setStop} /></Field>
        <Field label="Entry price"><NumberField value={entry} step={0.5} onChange={setEntry} /></Field>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Result label="Max quantity" value={String(res.qty)} tone="primary" />
        <Result label="Risk amount" value={fmt(res.riskAmount)} />
        <Result label="Capital deployed" value={fmt(res.capitalDeployed)} />
      </div>
    </div>
  );
}
