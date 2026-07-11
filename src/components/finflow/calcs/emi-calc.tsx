import { useState, useMemo } from "react";
import { calcEmi, amortizationSchedule } from "@/lib/finflow/calculators";
import { formatMoney, COUNTRIES } from "@/lib/finflow/countries";
import { useCountry } from "@/lib/finflow/country-store";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG, type CalcSlug } from "@/lib/finflow/registry";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";

export function EmiCalc({ slug, defaultRate = 8.5, defaultYears = 20, defaultPrincipal = 5_000_000 }: {
  slug: CalcSlug; defaultRate?: number; defaultYears?: number; defaultPrincipal?: number;
}) {
  const meta = CALC_BY_SLUG[slug];
  const [country] = useCountry();
  const [principal, setPrincipal] = useState(defaultPrincipal);
  const [rate, setRate] = useState(defaultRate);
  const [years, setYears] = useState(defaultYears);
  const emi = useMemo(() => calcEmi({ principal, annualRate: rate, years }), [principal, rate, years]);
  const schedule = useMemo(() => amortizationSchedule({ principal, annualRate: rate, years }), [principal, rate, years]);
  const pieData = [
    { name: "Principal", value: principal, color: "oklch(0.72 0.18 262)" },
    { name: "Interest", value: emi.interest, color: "oklch(0.7 0.22 320)" },
  ];

  // Full monthly amortization for the breakdown table
  const monthly = useMemo(() => {
    const rows: { period: string; emi: string; principal: string; interest: string; balance: string }[] = [];
    const n = Math.max(1, Math.round(years * 12));
    const r = rate / 12 / 100;
    const m = emi.emi;
    let bal = principal;
    for (let i = 1; i <= n; i++) {
      const int = bal * r;
      const pr = m - int;
      bal = Math.max(0, bal - pr);
      rows.push({
        period: `Month ${i}`,
        emi: formatMoney(m, country),
        principal: formatMoney(pr, country),
        interest: formatMoney(int, country),
        balance: formatMoney(bal, country),
      });
    }
    return rows;
  }, [principal, rate, years, emi.emi, country]);

  const yearly = useMemo(() => schedule.map((y) => ({
    period: `Year ${y.year}`,
    emi: formatMoney(emi.emi * 12, country),
    principal: formatMoney(y.principal, country),
    interest: formatMoney(y.interest, country),
    balance: formatMoney(y.balance, country),
  })), [schedule, emi.emi, country]);

  const payload: AnalysisPayload = useMemo(() => ({
    slug,
    country,
    title: `${meta.name} analysis`,
    subtitle: meta.tagline,
    inputs: [
      { label: "Loan amount", value: formatMoney(principal, country) },
      { label: "Interest rate", value: `${rate}% p.a.` },
      { label: "Tenure", value: `${years} years` },
      { label: "Country", value: COUNTRIES[country].name },
    ],
    kpis: [
      { label: "Monthly EMI", value: formatMoney(emi.emi, country), tone: "primary" },
      { label: "Total interest", value: formatMoney(emi.interest, country), tone: "warning" },
      { label: "Total payable", value: formatMoney(emi.total, country), tone: "neutral" },
      { label: "Interest as % of loan", value: `${((emi.interest / principal) * 100).toFixed(1)}%`, tone: "destructive" },
    ],
    breakdown: {
      columns: [
        { key: "period", label: "Period" },
        { key: "emi", label: "EMI", align: "right" },
        { key: "principal", label: "Principal", align: "right" },
        { key: "interest", label: "Interest", align: "right" },
        { key: "balance", label: "Balance", align: "right" },
      ],
      rows: monthly,
      yearlyRows: yearly,
    },
    assumptions: [
      "Rate stays constant for the entire tenure (real-world floating rates may change).",
      "EMI is calculated using the standard reducing-balance formula, compounded monthly.",
      "Processing fees, prepayment charges, and taxes are not included.",
      `Country context: ${COUNTRIES[country].name} (${COUNTRIES[country].currency}).`,
    ],
    raw: {
      inputs: { principal, rate, years, country },
      results: { emi: emi.emi, interest: emi.interest, total: emi.total, months: emi.months },
    },
    aiBrief: `Loan of ${formatMoney(principal, country)} at ${rate}% for ${years} years (${COUNTRIES[country].name}). Monthly EMI ${formatMoney(emi.emi, country)}, total interest ${formatMoney(emi.interest, country)} (${((emi.interest / principal) * 100).toFixed(1)}% of loan), total payable ${formatMoney(emi.total, country)}.`,
  }), [slug, country, meta.name, meta.tagline, principal, rate, years, emi, monthly, yearly]);

  return (
    <CalcShell
      title={meta.name}
      tagline={meta.tagline}
      accent={meta.accent}
      icon={meta.icon}
      saveType={slug}
      analysisPayload={payload}
      chartNodeIds={["emi-chart-pie", "emi-chart-bar"]}
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5 rounded-2xl border border-sheen glass p-6 shadow-soft">
          <InputRow label="Loan amount">
            <NumberInput value={principal} onChange={setPrincipal} step={10000} />
          </InputRow>
          <InputRow label="Interest rate (% p.a.)">
            <NumberInput value={rate} onChange={setRate} step={0.1} />
          </InputRow>
          <InputRow label="Tenure (years)">
            <NumberInput value={years} onChange={setYears} step={1} min={1} max={40} />
          </InputRow>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Monthly EMI" value={formatMoney(emi.emi, country)} tone="primary" />
            <StatCard label="Total interest" value={formatMoney(emi.interest, country)} tone="warning" />
            <StatCard label="Total payable" value={formatMoney(emi.total, country)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div id="emi-chart-pie" className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="text-sm font-medium">Principal vs Interest</div>
              <div className="mt-2 h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={4}>
                      {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={{ background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.72 0.18 262)" }} />Principal</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.7 0.22 320)" }} />Interest</span>
              </div>
            </div>
            <div id="emi-chart-bar" className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="text-sm font-medium">Yearly breakdown</div>
              <div className="mt-2 h-56">
                <ResponsiveContainer>
                  <BarChart data={schedule}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                    <XAxis dataKey="year" fontSize={11} stroke="oklch(0.65 0.02 260)" />
                    <YAxis fontSize={11} stroke="oklch(0.65 0.02 260)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={{ background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="principal" stackId="a" fill="oklch(0.72 0.18 262)" />
                    <Bar dataKey="interest" stackId="a" fill="oklch(0.7 0.22 320)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CalcShell>
  );
}
