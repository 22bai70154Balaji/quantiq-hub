import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Star, TrendingDown, TrendingUp } from "lucide-react";
import { getExchangeRates } from "@/lib/finflow/exchange.functions";
import { getFxHistory } from "@/lib/finflow/fx-history.functions";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG } from "@/lib/finflow/registry";
import { useCountry } from "@/lib/finflow/country-store";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "JPY", "AUD", "CAD", "CHF", "SGD", "CNY", "HKD"];
const FAV_KEY = "calculyx.fav.currencies";
const WINDOWS: { days: number; label: string }[] = [
  { days: 30, label: "1M" },
  { days: 90, label: "3M" },
  { days: 365, label: "1Y" },
];

function useFavorites(): [string[], (c: string) => void] {
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(FAV_KEY);
      if (raw) setFavs(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
  }, []);
  const toggle = (c: string) => {
    setFavs((cur) => {
      const next = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
      try { window.localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };
  return [favs, toggle];
}

function CurrencySelect({ value, onChange, favorites, onToggleFav, label }: {
  value: string;
  onChange: (v: string) => void;
  favorites: string[];
  onToggleFav: (c: string) => void;
  label: string;
}) {
  const ordered = useMemo(() => {
    const set = new Set(CURRENCIES);
    const favInList = favorites.filter((f) => set.has(f));
    const rest = CURRENCIES.filter((c) => !favInList.includes(c));
    return { favs: favInList, rest };
  }, [favorites]);
  const isFav = favorites.includes(value);
  return (
    <InputRow label={label}>
      <div className="flex items-center gap-2">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border bg-background px-3">
          {ordered.favs.length > 0 && (
            <optgroup label="★ Favorites">
              {ordered.favs.map((c) => <option key={`f-${c}`} value={c}>{c}</option>)}
            </optgroup>
          )}
          <optgroup label="All currencies">
            {ordered.rest.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </select>
        <button
          type="button"
          onClick={() => onToggleFav(value)}
          aria-label={isFav ? `Unfavorite ${value}` : `Favorite ${value}`}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition ${isFav ? "border-amber-400/50 bg-amber-400/10 text-amber-400" : "hover:bg-muted text-muted-foreground"}`}
        >
          <Star className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>
    </InputRow>
  );
}

export function CurrencyCalc() {
  const meta = CALC_BY_SLUG["currency"];
  const [country] = useCountry();
  const [amount, setAmount] = useState(1000);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("INR");
  const [days, setDays] = useState<number>(90);
  const [favorites, toggleFav] = useFavorites();

  const { data, isLoading } = useQuery({
    queryKey: ["rates", from],
    queryFn: () => getExchangeRates({ data: { base: from } }),
    staleTime: 5 * 60 * 1000,
  });
  const rate = data?.rates[to] ?? 0;
  const result = amount * rate;

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["fx-history", from, to, days],
    queryFn: () => getFxHistory({ data: { from, to, days } }),
    staleTime: 30 * 60 * 1000,
    enabled: from !== to,
  });

  const trendUp = (history?.changePct ?? 0) >= 0;
  const strengthLabel = trendUp ? `${from} strengthening` : `${from} weakening`;
  const chartData = useMemo(
    () => (history?.points ?? []).map((p) => ({ date: p.date.slice(5), rate: p.rate })),
    [history],
  );

  const payload: AnalysisPayload = useMemo(() => {
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const trendLine = history?.points?.length
      ? `Over the last ${history.days}d, 1 ${from} moved ${history.changePct >= 0 ? "+" : ""}${history.changePct.toFixed(2)}% vs ${to} (min ${history.min.toFixed(4)}, max ${history.max.toFixed(4)}).`
      : `No historical data available for ${from}→${to}.`;
    return {
      slug: "currency",
      country,
      title: "Currency conversion",
      subtitle: `${from} → ${to} at live mid-market rate`,
      inputs: [
        { label: "Amount", value: `${fmt(amount)} ${from}` },
        { label: "From currency", value: from },
        { label: "To currency", value: to },
        { label: "History window", value: `${days} days` },
        { label: "Rate source", value: data?.updated ? new Date(data.updated).toLocaleString() : "Live" },
      ],
      kpis: [
        { label: "Converted amount", value: `${fmt(result)} ${to}`, tone: "primary" },
        { label: "Exchange rate", value: `1 ${from} = ${rate.toFixed(4)} ${to}`, tone: "neutral" },
        { label: `${history?.days ?? days}d change`, value: `${history ? (history.changePct >= 0 ? "+" : "") + history.changePct.toFixed(2) + "%" : "—"}`, tone: trendUp ? "success" : "warning" },
      ],
      assumptions: [
        "Live rate is a mid-market quote; card/bank transactions include a spread (typically 0.5%–3%).",
        "Historical series uses ECB reference rates via Frankfurter; weekends/holidays are omitted.",
        trendLine,
      ],
      raw: {
        inputs: { amount, from, to, days },
        results: { rate, result, changePct: history?.changePct ?? null, min: history?.min ?? null, max: history?.max ?? null },
      },
      aiBrief: `Convert ${fmt(amount)} ${from} to ${to} at ${rate.toFixed(4)}. Result ${fmt(result)} ${to}. ${trendLine}`,
    };
  }, [country, amount, from, to, days, rate, result, data?.updated, history, trendUp]);

  return (
    <CalcShell title={meta.name} tagline={meta.tagline} accent={meta.accent} icon={meta.icon}
      saveType="currency" analysisPayload={payload} chartNodeIds={["currency-history-chart"]}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
          <InputRow label="Amount">
            <NumberInput value={amount} onChange={setAmount} />
          </InputRow>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <CurrencySelect value={from} onChange={setFrom} favorites={favorites} onToggleFav={toggleFav} label="From" />
            <button onClick={() => { const t = from; setFrom(to); setTo(t); }} className="mb-1 grid h-11 w-11 place-items-center rounded-xl border hover:bg-muted">
              <ArrowLeftRight className="h-4 w-4" />
            </button>
            <CurrencySelect value={to} onChange={setTo} favorites={favorites} onToggleFav={toggleFav} label="To" />
          </div>
          <div className="text-xs text-muted-foreground">
            {isLoading ? "Fetching rate…" : `Rate updated ${data?.updated ? new Date(data.updated).toLocaleString() : ""}`}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Converted amount</div>
                <div className="mt-2 font-mono text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
                  {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-muted-foreground text-xl font-normal">{to}</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">1 {from} = {rate.toFixed(4)} {to}</div>
              </div>
              {history && history.points.length > 0 && (
                <div className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold tabular-nums ${trendUp ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-rose-400/40 bg-rose-400/10 text-rose-300"}`}>
                  {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {history.changePct >= 0 ? "+" : ""}{history.changePct.toFixed(2)}%
                  <span className="text-muted-foreground">· {history.days}d</span>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Inverse rate" value={rate ? (1 / rate).toFixed(4) : "—"} sub={`1 ${to} = ? ${from}`} />
            <StatCard label={`${history?.days ?? days}d range`} value={history && history.min && history.max ? `${history.min.toFixed(3)} – ${history.max.toFixed(3)}` : "—"} sub={strengthLabel} />
          </div>
        </div>
      </div>

      {/* Historical chart */}
      <div id="currency-history-chart" className="mt-6 rounded-2xl border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Historical rate</div>
            <div className="text-xs text-muted-foreground">1 {from} → {to} · ECB reference rates</div>
          </div>
          <div className="inline-flex rounded-full border bg-background p-1 font-mono text-[11px]">
            {WINDOWS.map((w) => (
              <button
                key={w.days}
                onClick={() => setDays(w.days)}
                className={`rounded-full px-3 py-1 transition ${days === w.days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-64">
          {historyLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading history…</div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No historical data available.</div>
          ) : (
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fxg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="date" fontSize={10} stroke="oklch(0.65 0.02 260)" minTickGap={24} />
                <YAxis fontSize={10} stroke="oklch(0.65 0.02 260)" domain={["auto", "auto"]} tickFormatter={(v: number) => v.toFixed(2)} width={44} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [v.toFixed(4), `${from}→${to}`]}
                />
                {history && (
                  <ReferenceLine y={history.points[0]?.rate} stroke="oklch(0.65 0.02 260)" strokeDasharray="3 3" />
                )}
                <Area type="monotone" dataKey="rate" stroke="oklch(0.72 0.18 262)" strokeWidth={2} fill="url(#fxg)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </CalcShell>
  );
}
