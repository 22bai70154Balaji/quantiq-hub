import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";
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
  const [editing, setEditing] = useState<Partial<Holding> | null>(null);

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
              <div className="text-xs text-muted-foreground">Set a manual price per holding until live prices arrive.</div>
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
              <label className="text-xs font-medium text-muted-foreground">Symbol (optional)</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g. RELIANCE.NS"
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
            <label className="text-xs font-medium text-muted-foreground">Current price (optional, {currency})</label>
            <input type="text" inputMode="decimal" value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="Leave empty to use average cost"
              className="mt-1 h-11 w-full rounded-xl border bg-background px-3 font-mono text-sm focus:border-primary focus:outline-none" />
            <div className="mt-1 text-[11px] text-muted-foreground">Live prices come in Phase 3.</div>
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
