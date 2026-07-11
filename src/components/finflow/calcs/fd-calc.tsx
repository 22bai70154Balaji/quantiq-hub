import { useMemo, useState } from "react";
import { calcFd, fdPrincipalRequired } from "@/lib/finflow/calculators";
import { formatMoney, COUNTRIES } from "@/lib/finflow/countries";
import { useCountry } from "@/lib/finflow/country-store";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG } from "@/lib/finflow/registry";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";
import { Target, TrendingUp } from "lucide-react";

type Mode = "invest" | "goal";
type ChartKind = "area" | "bar";

export function FdCalc() {
  const meta = CALC_BY_SLUG["fd"];
  const [country] = useCountry();
  const [mode, setMode] = useState<Mode>("invest");
  const [chartKind, setChartKind] = useState<ChartKind>("area");

  // Invest mode
  const [principal, setPrincipal] = useState(500000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(5);

  // Goal mode
  const [goalAmount, setGoalAmount] = useState(1000000);
  const [goalYears, setGoalYears] = useState(5);
  const [goalRate, setGoalRate] = useState(7);

  const goal = useMemo(() => fdPrincipalRequired({ target: goalAmount, annualRate: goalRate, years: goalYears, compounding: 4 }), [goalAmount, goalRate, goalYears]);
  const activePrincipal = mode === "goal" ? goal.principal : principal;
  const activeRate = mode === "goal" ? goalRate : rate;
  const activeYears = mode === "goal" ? goalYears : years;

  const res = useMemo(
    () => calcFd({ principal: activePrincipal, annualRate: activeRate, years: activeYears, compounding: 4 }),
    [activePrincipal, activeRate, activeYears],
  );

  const data = useMemo(() => Array.from({ length: activeYears }, (_, i) => {
    const y = i + 1;
    const r = calcFd({ principal: activePrincipal, annualRate: activeRate, years: y, compounding: 4 });
    return {
      year: `Y${y}`,
      principal: Math.round(activePrincipal),
      interest: Math.round(r.interest),
      maturity: Math.round(r.maturity),
    };
  }), [activePrincipal, activeRate, activeYears]);

  const breakdownRows = data.map((d) => ({
    period: d.year,
    principal: formatMoney(d.principal, country),
    interest: formatMoney(d.interest, country),
    maturity: formatMoney(d.maturity, country),
  }));

  const taxNote = country === "IN"
    ? "India: FD interest is fully taxable at slab rate; TDS at 10% above ₹40k/yr (₹50k for seniors)."
    : country === "US" ? "USA: FD/CD interest is taxed as ordinary income at federal + state rates."
    : "UAE: no personal tax on FD interest.";

  const gap = mode === "goal" ? goal.principal - principal : 0;

  const payload: AnalysisPayload = useMemo(() => ({
    slug: "fd",
    country,
    title: mode === "goal" ? "FD goal plan" : "FD analysis",
    subtitle: mode === "goal"
      ? `Target ${formatMoney(goalAmount, country)} in ${goalYears} years`
      : "Fixed deposit maturity projection",
    inputs: mode === "goal"
      ? [
          { label: "Goal amount", value: formatMoney(goalAmount, country) },
          { label: "Tenure", value: `${goalYears} years` },
          { label: "Interest rate", value: `${goalRate}% p.a.` },
          { label: "Country", value: COUNTRIES[country].name },
        ]
      : [
          { label: "Principal", value: formatMoney(principal, country) },
          { label: "Interest rate", value: `${rate}% p.a.` },
          { label: "Tenure", value: `${years} years` },
          { label: "Country", value: COUNTRIES[country].name },
        ],
    kpis: mode === "goal"
      ? [
          { label: "Required principal", value: formatMoney(goal.principal, country), tone: "primary" },
          { label: "Goal amount", value: formatMoney(goalAmount, country), tone: "neutral" },
          { label: "Interest earned", value: formatMoney(goalAmount - goal.principal, country), tone: "success" },
        ]
      : [
          { label: "Principal", value: formatMoney(principal, country), tone: "neutral" },
          { label: "Interest earned", value: formatMoney(res.interest, country), tone: "success" },
          { label: "Maturity value", value: formatMoney(res.maturity, country), tone: "primary" },
        ],
    breakdown: {
      columns: [
        { key: "period", label: "Year" },
        { key: "principal", label: "Principal", align: "right" },
        { key: "interest", label: "Interest to-date", align: "right" },
        { key: "maturity", label: "Maturity value", align: "right" },
      ],
      rows: breakdownRows,
    },
    assumptions: [
      `Quarterly compounding at ${activeRate}% p.a. over ${activeYears} years.`,
      "Early withdrawal penalties, if any, are not modelled.",
      taxNote,
    ],
    raw: {
      inputs: mode === "goal"
        ? { mode, goalAmount, goalYears, goalRate, country }
        : { mode, principal, rate, years, country },
      results: {
        interest: res.interest,
        maturity: res.maturity,
        requiredPrincipal: mode === "goal" ? goal.principal : null,
      },
    },
    aiBrief: mode === "goal"
      ? `Goal: ${formatMoney(goalAmount, country)} in ${goalYears}y at ${goalRate}% (quarterly). Required lump-sum ~ ${formatMoney(goal.principal, country)}.`
      : `FD of ${formatMoney(principal, country)} at ${rate}% for ${years}y (quarterly). Interest ${formatMoney(res.interest, country)}, maturity ${formatMoney(res.maturity, country)}.`,
  }), [mode, country, principal, rate, years, goalAmount, goalYears, goalRate, goal, res, breakdownRows, taxNote, activeRate, activeYears]);

  return (
    <CalcShell title={meta.name} tagline={meta.tagline} accent={meta.accent} icon={meta.icon}
      saveType="fd" analysisPayload={payload} chartNodeIds={["fd-chart-area"]}>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5 rounded-2xl border border-sheen glass p-6 shadow-soft">
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
              <InputRow label="Principal"><NumberInput value={principal} onChange={setPrincipal} step={1000} /></InputRow>
              <InputRow label="Interest rate (% p.a.)"><NumberInput value={rate} onChange={setRate} step={0.1} /></InputRow>
              <InputRow label="Tenure (years)"><NumberInput value={years} onChange={setYears} step={1} min={1} max={30} /></InputRow>
            </>
          ) : (
            <>
              <InputRow label="Goal amount"><NumberInput value={goalAmount} onChange={setGoalAmount} step={10000} /></InputRow>
              <InputRow label="Target year (from now)"><NumberInput value={goalYears} onChange={setGoalYears} step={1} min={1} max={30} /></InputRow>
              <InputRow label="Interest rate (% p.a.)"><NumberInput value={goalRate} onChange={setGoalRate} step={0.1} /></InputRow>
              <div className="rounded-xl border bg-primary/5 p-3 text-xs">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">You need to deposit</div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-primary">{formatMoney(goal.principal, country)}</div>
                {principal > 0 && (
                  <div className="mt-2 text-muted-foreground">
                    {gap > 0
                      ? <>Deposit <span className="font-mono tabular-nums text-warning">{formatMoney(gap, country)}</span> more than your current principal.</>
                      : gap < 0
                        ? <>Your current principal already exceeds the requirement by <span className="font-mono tabular-nums text-emerald-300">{formatMoney(-gap, country)}</span>.</>
                        : "Your current principal matches the requirement."}
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
                <StatCard label="Required principal" value={formatMoney(goal.principal, country)} tone="primary" />
                <StatCard label="Goal amount" value={formatMoney(goalAmount, country)} />
                <StatCard label="Interest earned" value={formatMoney(goalAmount - goal.principal, country)} tone="success" />
              </>
            ) : (
              <>
                <StatCard label="Principal" value={formatMoney(principal, country)} />
                <StatCard label="Interest earned" value={formatMoney(res.interest, country)} tone="success" />
                <StatCard label="Maturity" value={formatMoney(res.maturity, country)} tone="primary" />
              </>
            )}
          </div>

          <div id="fd-chart-area" className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Maturity growth</div>
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
                      <linearGradient id="fdv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                    <XAxis dataKey="year" fontSize={11} stroke="oklch(0.65 0.02 260)" />
                    <YAxis fontSize={11} stroke="oklch(0.65 0.02 260)" tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={{ background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="maturity" name="Maturity" stroke="oklch(0.72 0.18 262)" strokeWidth={2} fill="url(#fdv)" />
                    <Area type="monotone" dataKey="principal" name="Principal" stroke="oklch(0.65 0.02 260)" strokeWidth={2} fill="transparent" strokeDasharray="4 4" />
                  </AreaChart>
                ) : (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                    <XAxis dataKey="year" fontSize={11} stroke="oklch(0.65 0.02 260)" />
                    <YAxis fontSize={11} stroke="oklch(0.65 0.02 260)" tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={{ background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="principal" stackId="a" name="Principal" fill="oklch(0.65 0.05 260)" />
                    <Bar dataKey="interest" stackId="a" name="Interest" fill="oklch(0.72 0.18 262)" />
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
