import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus, Pencil, Trash2, TrendingUp, TrendingDown, ShieldCheck,
  RefreshCw, Sparkles, AlertTriangle, CheckCircle2, Info, Target, Wallet, LineChart,
} from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import {
  listHoldings,
  upsertHolding,
  deleteHolding,
  type Holding,
  type AssetClass,
} from "@/lib/finflow/portfolio.functions";
import { refreshPortfolioPrices } from "@/lib/finflow/prices.functions";
import { analyzePortfolio, type AiReport } from "@/lib/finflow/portfolio-ai.functions";
import { useCountry } from "@/lib/finflow/country-store";
import { formatMoney } from "@/lib/finflow/countries";

const CLASS_LABELS: Record<AssetClass, string> = {
  stock: "Stocks",
  etf: "ETFs",
  mutual_fund: "Mutual Funds",
  crypto: "Crypto",
  gold: "Gold",
  fd: "Fixed Deposits",
  bond: "Bonds",
  epf: "EPF",
  ppf: "PPF",
  nps: "NPS",
};

const CLASS_COLORS: Record<AssetClass, string> = {
  stock: "#3b82f6",
  etf: "#6366f1",
  mutual_fund: "#8b5cf6",
  crypto: "#f59e0b",
  gold: "#eab308",
  fd: "#10b981",
  bond: "#14b8a6",
  epf: "#06b6d4",
  ppf: "#0ea5e9",
  nps: "#a855f7",
};

type Profile = "conservative" | "balanced" | "aggressive";

type HoldingSavePayload = {
  id?: string;
  asset_class: AssetClass;
  symbol?: string | null;
  name: string;
  quantity: number;
  avg_cost: number;
  currency: string;
  manual_price?: number | null;
};

export function PortfolioPanel() {
  const [country] = useCountry();
  const qc = useQueryClient();
  const list = useServerFn(listHoldings);
  const upsert = useServerFn(upsertHolding);
  const del = useServerFn(deleteHolding);
  const refresh = useServerFn(refreshPortfolioPrices);
  const analyze = useServerFn(analyzePortfolio);
  const [editing, setEditing] = useState<Partial<Holding> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<AiReport | null>(null);
  const [profile, setProfile] = useState<Profile>("balanced");

  const { data, isLoading } = useQuery({
    queryKey: ["holdings"],
    queryFn: () => list(),
  });

  async function handleSave(payload: HoldingSavePayload) {
    try {
      await upsert({ data: payload });
      await qc.invalidateQueries({ queryKey: ["holdings"] });
      toast.success(payload.id ? "Updated" : "Added");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this holding?")) return;
    try {
      await del({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["holdings"] });
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function handleRefreshPrices() {
    setRefreshing(true);
    try {
      const r = await refresh();
      await qc.invalidateQueries({ queryKey: ["holdings"] });
      if (r.updated > 0) {
        toast.success(`Refreshed ${r.updated} price${r.updated === 1 ? "" : "s"}${r.skipped ? ` · ${r.skipped} skipped` : ""}`);
      } else if (r.skipped > 0 || r.errors.length > 0) {
        toast.message("No live prices fetched", {
          description: r.errors[0] ?? "Add a symbol (e.g. RELIANCE.NS, AAPL, BTC) to enable live prices.",
        });
      } else {
        toast.info("Add symbols to your holdings to enable live prices.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const currency = { IN: "INR", US: "USD", AE: "AED" }[country] ?? "INR";
      const r = await analyze({ data: { profile, currency } });
      setReport(r);
      toast.success("Analysis ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading portfolio…</div>;

  const holdings = data?.holdings ?? [];
  const summary = data?.summary;

  const riskClass = summary?.riskBand === "High" ? "text-destructive" : summary?.riskBand === "Low" ? "text-success" : "text-warning";
  const gainClass = (summary?.totalGain ?? 0) >= 0 ? "text-success" : "text-destructive";

  return (
    <div className="space-y-6">
      {/* KPI hero */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard label="Portfolio Value" value={formatMoney(summary?.totalValue ?? 0, country)} accent="text-gradient" />
        <KpiCard
          label="Total Gain"
          value={`${(summary?.totalGain ?? 0) >= 0 ? "+" : ""}${formatMoney(summary?.totalGain ?? 0, country)}`}
          sub={`${(summary?.totalGainPct ?? 0).toFixed(2)}%`}
          accent={gainClass}
          icon={(summary?.totalGain ?? 0) >= 0 ? TrendingUp : TrendingDown}
        />
        <KpiCard
          label="Risk"
          value={summary?.riskBand ?? "—"}
          sub="Rule-based estimate"
          accent={riskClass}
          icon={ShieldCheck}
        />
        <KpiCard
          label="Diversification"
          value={`${summary?.diversificationScore ?? 0}/100`}
          sub={`${summary?.allocation.length ?? 0} asset classes`}
          accent="text-foreground"
        />
      </motion.div>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value as Profile)}
            className="h-9 rounded-lg border bg-background px-2 text-sm"
            aria-label="Risk profile"
          >
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
          <Button size="sm" variant="outline" onClick={handleRefreshPrices} disabled={refreshing} className="rounded-full">
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh prices"}
          </Button>
          <Button size="sm" onClick={handleAnalyze} disabled={analyzing || holdings.length === 0} className="rounded-full">
            <Sparkles className={`mr-1.5 h-3.5 w-3.5 ${analyzing ? "animate-pulse" : ""}`} />
            {analyzing ? "Analyzing…" : "AI Analysis"}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Live prices: Finnhub (stocks/ETFs) · CoinGecko (crypto) · Manual for others
        </div>
      </div>

      {/* AI Report */}
      {report && <AiReportView report={report} country={country} />}

      {/* Allocation + list */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="rounded-2xl border border-sheen glass p-5 shadow-soft">
          <div className="font-display text-sm font-semibold tracking-tight">Allocation</div>
          {summary && summary.allocation.length > 0 ? (
            <>
              <div className="mt-3 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.allocation}
                      dataKey="value"
                      nameKey="asset_class"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {summary.allocation.map((a) => (
                        <Cell key={a.asset_class} fill={CLASS_COLORS[a.asset_class]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatMoney(v, country)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {summary.allocation.map((a) => (
                  <div key={a.asset_class} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: CLASS_COLORS[a.asset_class] }} />
                      <span>{CLASS_LABELS[a.asset_class]}</span>
                    </div>
                    <span className="font-mono tabular-nums text-muted-foreground">{a.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 text-sm text-muted-foreground">Add a holding to see allocation.</div>
          )}
        </div>

        <div className="rounded-2xl border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <div className="font-display text-lg font-semibold tracking-tight">Holdings</div>
              <div className="text-xs text-muted-foreground">Add a symbol for live prices, or set a manual price.</div>
            </div>
            <Button size="sm" className="rounded-full" onClick={() => setEditing({ asset_class: "stock", name: "", quantity: 0, avg_cost: 0 })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add holding
            </Button>
          </div>
          {!holdings.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No holdings yet. Add stocks, mutual funds, crypto, gold, FDs, EPF/PPF/NPS, and more.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Class</th>
                    <th className="px-4 py-3 font-medium text-right">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-right">Value</th>
                    <th className="px-4 py-3 font-medium text-right">Gain</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{h.name}</div>
                        {h.symbol && <div className="font-mono text-[11px] text-muted-foreground">{h.symbol}</div>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{CLASS_LABELS[h.asset_class]}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{h.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatMoney(h.current_price, country, { maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">{formatMoney(h.market_value, country)}</td>
                      <td className={`px-4 py-3 text-right font-mono tabular-nums ${h.gain >= 0 ? "text-success" : "text-destructive"}`}>
                        {h.gain >= 0 ? "+" : ""}{h.gain_pct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditing(h)} className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(h.id)} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <HoldingDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function AiReportView({ report, country }: { report: AiReport; country: "IN" | "US" | "AE" }) {
  const scoreColor =
    report.score >= 75 ? "text-success" : report.score >= 55 ? "text-warning" : "text-destructive";
  const emergencyColor =
    report.emergencyFund.status === "strong" ? "text-success"
    : report.emergencyFund.status === "ok" ? "text-primary"
    : report.emergencyFund.status === "low" ? "text-warning" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-sheen glass p-6 shadow-soft"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="font-display text-lg font-semibold tracking-tight">AI Portfolio Analysis</div>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{report.summary}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={`font-mono text-3xl font-bold tabular-nums ${scoreColor}`}>{report.score}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Health / 100</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-sm font-semibold tabular-nums">{Math.round(report.confidence * 100)}%</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Confidence</div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MiniCard icon={Wallet} label="Emergency fund" value={report.emergencyFund.status.toUpperCase()} accent={emergencyColor} sub={report.emergencyFund.note} />
        <MiniCard icon={LineChart} label={`Projection ${report.projection.years}y`} value={formatMoney(report.projection.projectedValue, country)} sub={`@ ${report.projection.assumedReturnPct}% p.a.`} />
        <MiniCard icon={AlertTriangle} label="Concentration flags" value={String(report.concentrationFlags.length)} sub={report.concentrationFlags[0]?.note ?? "No major flags"} />
        <MiniCard icon={Target} label="Rebalance actions" value={String(report.rebalance.filter((r) => r.action !== "hold").length)} sub="Vs target allocation" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {report.strengths.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-success" /> Strengths</div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {report.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-success">•</span><span>{s}</span></li>)}
            </ul>
          </div>
        )}
        {report.risks.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-warning" /> Risks</div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {report.risks.map((s, i) => <li key={i} className="flex gap-2"><span className="text-warning">•</span><span>{s}</span></li>)}
            </ul>
          </div>
        )}
      </div>

      {report.rebalance.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Rebalancing plan</div>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Asset class</th>
                  <th className="px-3 py-2 font-medium text-right">Current</th>
                  <th className="px-3 py-2 font-medium text-right">Target</th>
                  <th className="px-3 py-2 font-medium text-right">Delta</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {report.rebalance.slice(0, 8).map((r) => (
                  <tr key={r.asset_class} className="border-t">
                    <td className="px-3 py-2 capitalize">{CLASS_LABELS[r.asset_class as AssetClass] ?? r.asset_class}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{r.current_pct.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{r.target_pct.toFixed(1)}%</td>
                    <td className={`px-3 py-2 text-right font-mono tabular-nums ${r.delta_pct > 0 ? "text-destructive" : r.delta_pct < 0 ? "text-success" : ""}`}>
                      {r.delta_pct > 0 ? "+" : ""}{r.delta_pct.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                        r.action === "buy" ? "bg-success/15 text-success"
                        : r.action === "sell" ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground"
                      }`}>{r.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Info className="h-4 w-4 text-primary" /> Recommendations</div>
          <div className="grid gap-3 md:grid-cols-2">
            {report.recommendations.map((r, i) => (
              <div key={i} className="rounded-xl border bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{r.title}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    r.impact === "high" ? "bg-primary/15 text-primary"
                    : r.impact === "medium" ? "bg-warning/15 text-warning"
                    : "bg-muted text-muted-foreground"
                  }`}>{r.impact}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.taxTips.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold">Tax tips</div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {report.taxTips.map((t, i) => <li key={i} className="flex gap-2"><span>💡</span><span>{t}</span></li>)}
          </ul>
        </div>
      )}

      <div className="mt-6 text-[11px] text-muted-foreground">
        Generated {new Date(report.generatedAt).toLocaleString()} · Educational only, not financial advice.
      </div>
    </motion.div>
  );
}

function MiniCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-card/60 p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={`mt-1 font-mono text-lg font-semibold tabular-nums ${accent ?? ""}`}>{value}</div>
      {sub && <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function KpiCard({
  label, value, sub, accent, icon: Icon,
}: {
  label: string; value: string; sub?: string; accent?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-sheen glass p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <div className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums ${accent ?? ""}`}>{value}</div>
      {sub && <div className="mt-1 truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function HoldingDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Holding>;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    asset_class: AssetClass;
    symbol?: string | null;
    name: string;
    quantity: number;
    avg_cost: number;
    currency: string;
    manual_price?: number | null;
  }) => void;
}) {
  const [country] = useCountry();
  const [assetClass, setAssetClass] = useState<AssetClass>((initial.asset_class as AssetClass) ?? "stock");
  const [name, setName] = useState(initial.name ?? "");
  const [symbol, setSymbol] = useState(initial.symbol ?? "");
  const [quantity, setQuantity] = useState(String(initial.quantity ?? ""));
  const [avgCost, setAvgCost] = useState(String(initial.avg_cost ?? ""));
  const [manualPrice, setManualPrice] = useState(initial.manual_price != null ? String(initial.manual_price) : "");
  const currency = initial.currency ?? { IN: "INR", US: "USD", AE: "AED" }[country];

  function submit() {
    const qty = Number(quantity);
    const avg = Number(avgCost);
    const mp = manualPrice.trim() === "" ? null : Number(manualPrice);
    if (!name.trim()) return toast.error("Name is required");
    if (!Number.isFinite(qty) || qty < 0) return toast.error("Enter a valid quantity");
    if (!Number.isFinite(avg) || avg < 0) return toast.error("Enter a valid average cost");
    onSave({
      id: initial.id,
      asset_class: assetClass,
      symbol: symbol.trim() || null,
      name: name.trim(),
      quantity: qty,
      avg_cost: avg,
      currency,
      manual_price: mp,
    });
  }

  const symbolHint =
    assetClass === "crypto" ? "e.g. BTC, ETH, SOL"
    : assetClass === "stock" || assetClass === "etf"
      ? "e.g. AAPL, RELIANCE.NS, TCS.NS"
      : "optional";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-elegant">
        <div className="font-display text-lg font-semibold tracking-tight">
          {initial.id ? "Edit holding" : "Add holding"}
        </div>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Asset class</label>
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm"
              >
                {(Object.keys(CLASS_LABELS) as AssetClass[]).map((c) => (
                  <option key={c} value={c}>{CLASS_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Symbol (for live price)</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder={symbolHint}
                className="mt-1 h-11 w-full rounded-xl border bg-background px-3 font-mono text-sm focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Reliance Industries"
              className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Quantity</label>
              <input type="text" inputMode="decimal" value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/[^0-9.]/g, ""))}
                className="mt-1 h-11 w-full rounded-xl border bg-background px-3 font-mono text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Avg cost ({currency})</label>
              <input type="text" inputMode="decimal" value={avgCost}
                onChange={(e) => setAvgCost(e.target.value.replace(/[^0-9.]/g, ""))}
                className="mt-1 h-11 w-full rounded-xl border bg-background px-3 font-mono text-sm focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Manual price override (optional, {currency})</label>
            <input type="text" inputMode="decimal" value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="Leave empty to use live/cached price"
              className="mt-1 h-11 w-full rounded-xl border bg-background px-3 font-mono text-sm focus:border-primary focus:outline-none" />
            <div className="mt-1 text-[11px] text-muted-foreground">Tip: add a symbol above and click Refresh prices.</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial.id ? "Update" : "Add"}</Button>
        </div>
      </div>
    </div>
  );
}
