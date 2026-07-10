import { useState, useMemo } from "react";
import { calcEmi, amortizationSchedule } from "@/lib/finflow/calculators";
import { formatMoney } from "@/lib/finflow/countries";
import { useCountry } from "@/lib/finflow/country-store";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG, type CalcSlug } from "@/lib/finflow/registry";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

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

  return (
    <CalcShell title={meta.name} tagline={meta.tagline} accent={meta.accent} icon={meta.icon}
      saveType={slug} saveInputs={{ principal, rate, years }} saveResults={{ emi: emi.emi, interest: emi.interest, total: emi.total }}>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
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
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
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
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
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
