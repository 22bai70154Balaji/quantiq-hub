import { useMemo, useState, useEffect } from "react";
import { calcSip, sipRequired } from "@/lib/finflow/calculators";
import { formatMoney, COUNTRIES } from "@/lib/finflow/countries";
import { useCountry } from "@/lib/finflow/country-store";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG } from "@/lib/finflow/registry";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";
import { Target, TrendingUp, Link2 } from "lucide-react";

type Mode = "invest" | "goal";
type ChartKind = "area" | "bar";

export function SipCalc() {
  const meta = CALC_BY_SLUG["sip"];
  const [country] = useCountry();
  const [mode, setMode] = useState<Mode>("invest");
  const [chartKind, setChartKind] = useState<ChartKind>("area");
  const [linkedSymbol, setLinkedSymbol] = useState<string | null>(null);

  // Invest mode
  const [monthly, setMonthly] = useState(25000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);

  // Read query params (?symbol=AAPL&rate=15) on mount to prefill from Stocks page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const sym = p.get("symbol");
    const r = Number(p.get("rate"));
    if (sym) setLinkedSymbol(sym);
    if (Number.isFinite(r) && r > 0 && r < 100) setRate(r);
  }, []);

  // Goal mode
  const [goalAmount, setGoalAmount] = useState(10000000);
  const [goalYears, setGoalYears] = useState(15);
  const [goalRate, setGoalRate] = useState(12);

  const goal = useMemo(() => sipRequired({ target: goalAmount, annualRate: goalRate, years: goalYears }), [goalAmount, goalRate, goalYears]);
  const activeMonthly = mode === "goal" ? goal.monthly : monthly;
  const activeYears = mode === "goal" ? goalYears : years;
  const activeRate = mode === "goal" ? goalRate : rate;

  const res = useMemo(
    () => calcSip({ monthly: activeMonthly, annualRate: activeRate, years: activeYears }),
    [activeMonthly, activeRate, activeYears],
  );

  const data = useMemo(() => Array.from({ length: activeYears }, (_, i) => {
    const y = i + 1;
    const r = calcSip({ monthly: activeMonthly, annualRate: activeRate, years: y });
    return {
      year: `Y${y}`,
      invested: Math.round(r.invested),
      value: Math.round(r.futureValue),
      gains: Math.round(r.futureValue - r.invested),
    };
  }), [activeMonthly, activeRate, activeYears]);

  const breakdownRows = data.map((d) => ({
    period: d.year,
    invested: formatMoney(d.invested, country),
    gains: formatMoney(d.gains, country),
    value: formatMoney(d.value, country),
  }));

  const capitalGainsNote = country === "IN"
    ? "India: equity LTCG taxed at 12.5% above ₹1.25L/year (post 23-Jul-2024)."
    : country === "US" ? "USA: LTCG 0%/15%/20% by bracket; short-term at ordinary rates."
    : "UAE: no personal capital gains tax.";

  // Gap vs current investment when in goal mode
  const gap = mode === "goal" ? goal.monthly - monthly : 0;

  const payload: AnalysisPayload = useMemo(() => ({
    slug: "sip",
    country,
    title: mode === "goal" ? "SIP goal plan" : "SIP analysis",
    subtitle: mode === "goal"
      ? `Target ${formatMoney(goalAmount, country)} in ${goalYears} years`
      : "Systematic investment plan projection",
    inputs: mode === "goal"
      ? [
          { label: "Goal amount", value: formatMoney(goalAmount, country) },
          { label: "Horizon", value: `${goalYears} years` },
          { label: "Expected return", value: `${goalRate}% p.a.` },
          { label: "Country", value: COUNTRIES[country].name },
        ]
      : [
          { label: "Monthly SIP", value: formatMoney(monthly, country) },
          { label: "Expected return", value: `${rate}% p.a.` },
          { label: "Horizon", value: `${years} years` },
          { label: "Country", value: COUNTRIES[country].name },
        ],
    kpis: mode === "goal"
      ? [
          { label: "Required monthly SIP", value: formatMoney(goal.monthly, country), tone: "primary" },
          { label: "Goal amount", value: formatMoney(goalAmount, country), tone: "neutral" },
          { label: "Total invested", value: formatMoney(goal.monthly * goal.months, country), tone: "neutral" },
          { label: "Projected wealth gained", value: formatMoney(goalAmount - goal.monthly * goal.months, country), tone: "success" },
        ]
      : [
          { label: "Total invested", value: formatMoney(res.invested, country), tone: "neutral" },
          { label: "Wealth gained", value: formatMoney(res.gains, country), tone: "success" },
          { label: "Future value", value: formatMoney(res.futureValue, country), tone: "primary" },
          { label: "Gains multiplier", value: `${(res.futureValue / Math.max(1, res.invested)).toFixed(2)}×`, tone: "success" },
        ],
    breakdown: {
      columns: [
        { key: "period", label: "Year" },
        { key: "invested", label: "Invested", align: "right" },
        { key: "gains", label: "Gains", align: "right" },
        { key: "value", label: "Portfolio value", align: "right" },
      ],
      rows: breakdownRows,
    },
    assumptions: [
      `Assumes constant ${activeRate}% annual return, compounded monthly with SIP at start of month.`,
      "Does not model market volatility, fund expense ratios, or exit loads.",
      capitalGainsNote,
      "Currency and inflation held constant across the horizon.",
    ],
    raw: {
      inputs: mode === "goal"
        ? { mode, goalAmount, goalYears, goalRate, country }
        : { mode, monthly, rate, years, country },
      results: {
        invested: res.invested,
        gains: res.gains,
        futureValue: res.futureValue,
        requiredMonthly: mode === "goal" ? goal.monthly : null,
      },
    },
    aiBrief: mode === "goal"
      ? `Goal: ${formatMoney(goalAmount, country)} in ${goalYears}y at ${goalRate}%. Required SIP ~ ${formatMoney(goal.monthly, country)}/mo in ${COUNTRIES[country].name}.`
      : `SIP of ${formatMoney(monthly, country)}/mo at ${rate}% for ${years} years in ${COUNTRIES[country].name}. Invested ${formatMoney(res.invested, country)}, projected ${formatMoney(res.futureValue, country)}, gains ${formatMoney(res.gains, country)}.`,
  }), [mode, country, monthly, rate, years, goalAmount, goalYears, goalRate, goal, res, breakdownRows, capitalGainsNote, activeRate]);

  return (
    <CalcShell title={meta.name} tagline={meta.tagline} accent={meta.accent} icon={meta.icon}
      saveType="sip" analysisPayload={payload} chartNodeIds={["sip-chart-area"]}>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5 rounded-2xl border border-sheen glass p-6 shadow-soft">
          {linkedSymbol && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
              <Link2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Linked to</span>
              <span className="font-mono font-semibold text-primary">{linkedSymbol}</span>
              <span className="ml-auto text-muted-foreground">Return {rate}%</span>
            </div>
          )}
          {/* Mode switch */}
          <div className="inline-flex w-full rounded-full border bg-background p-1 font-mono text-[11px]">
            <button
              onClick={() => setMode("invest")}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${mode === "invest" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <TrendingUp className="mr-1 inline h-3 w-3" /> Invest
            </button>
            <button
              onClick={() => setMode("goal")}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${mode === "goal" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Target className="mr-1 inline h-3 w-3" /> Goal
            </button>
          </div>

          {mode === "invest" ? (
            <>
              <InputRow label="Monthly investment"><NumberInput value={monthly} onChange={setMonthly} step={500} /></InputRow>
              <InputRow label="Expected annual return (%)"><NumberInput value={rate} onChange={setRate} step={0.5} /></InputRow>
              <InputRow label="Investment period (years)"><NumberInput value={years} onChange={setYears} step={1} min={1} max={40} /></InputRow>
            </>
          ) : (
            <>
              <InputRow label="Goal amount"><NumberInput value={goalAmount} onChange={setGoalAmount} step={100000} /></InputRow>
              <InputRow label="Target year (from now)"><NumberInput value={goalYears} onChange={setGoalYears} step={1} min={1} max={40} /></InputRow>
              <InputRow label="Expected return (%)"><NumberInput value={goalRate} onChange={setGoalRate} step={0.5} /></InputRow>
              <div className="rounded-xl border bg-primary/5 p-3 text-xs">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">You'll need to save</div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-primary">{formatMoney(goal.monthly, country)}/mo</div>
                {monthly > 0 && (
                  <div className="mt-2 text-muted-foreground">
                    {gap > 0
                      ? <>Increase by <span className="font-mono tabular-nums text-warning">{formatMoney(gap, country)}/mo</span> vs your current SIP.</>
                      : gap < 0
                        ? <>You're already saving <span className="font-mono tabular-nums text-emerald-300">{formatMoney(-gap, country)}/mo</span> more than needed.</>
                        : "You're right on track."}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {mode === "goal" ? (
              <>
                <StatCard label="Required SIP" value={formatMoney(goal.monthly, country)} tone="primary" />
                <StatCard label="Goal amount" value={formatMoney(goalAmount, country)} />
                <StatCard label="Wealth gained" value={formatMoney(goalAmount - goal.monthly * goal.months, country)} tone="success" />
              </>
            ) : (
              <>
                <StatCard label="Invested" value={formatMoney(res.invested, country)} />
                <StatCard label="Wealth gained" value={formatMoney(res.gains, country)} tone="success" />
                <StatCard label="Future value" value={formatMoney(res.futureValue, country)} tone="primary" />
              </>
            )}
          </div>

          <div id="sip-chart-area" className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{mode === "goal" ? "Growth to goal" : "Wealth growth over time"}</div>
              <div className="inline-flex rounded-full border bg-background p-1 font-mono text-[10px]">
                <button onClick={() => setChartKind("area")} className={`rounded-full px-3 py-1 transition ${chartKind === "area" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Area</button>
                <button onClick={() => setChartKind("bar")} className={`rounded-full px-3 py-1 transition ${chartKind === "bar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Stacked</button>
              </div>
            </div>
            <div className="mt-2 h-72">
              <ResponsiveContainer>
                {chartKind === "area" ? (
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                    <XAxis dataKey="year" fontSize={11} stroke="oklch(0.65 0.02 260)" />
                    <YAxis fontSize={11} stroke="oklch(0.65 0.02 260)" tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={{ background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="value" name="Portfolio value" stroke="oklch(0.72 0.18 262)" strokeWidth={2} fill="url(#v)" />
                    <Area type="monotone" dataKey="invested" name="Invested" stroke="oklch(0.65 0.02 260)" strokeWidth={2} fill="transparent" strokeDasharray="4 4" />
                  </AreaChart>
                ) : (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                    <XAxis dataKey="year" fontSize={11} stroke="oklch(0.65 0.02 260)" />
                    <YAxis fontSize={11} stroke="oklch(0.65 0.02 260)" tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={{ background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="invested" stackId="a" name="Invested" fill="oklch(0.65 0.05 260)" />
                    <Bar dataKey="gains" stackId="a" name="Gains" fill="oklch(0.72 0.18 262)" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </CalcShell>
  );
}
