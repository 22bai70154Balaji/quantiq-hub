import { useState, useMemo } from "react";
import { calcSip } from "@/lib/finflow/calculators";
import { formatMoney } from "@/lib/finflow/countries";
import { useCountry } from "@/lib/finflow/country-store";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG } from "@/lib/finflow/registry";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function SipCalc() {
  const meta = CALC_BY_SLUG["sip"];
  const [country] = useCountry();
  const [monthly, setMonthly] = useState(25000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);
  const res = useMemo(() => calcSip({ monthly, annualRate: rate, years }), [monthly, rate, years]);
  const data = useMemo(() => Array.from({ length: years }, (_, i) => {
    const y = i + 1;
    const r = calcSip({ monthly, annualRate: rate, years: y });
    return { year: `Y${y}`, invested: Math.round(r.invested), value: Math.round(r.futureValue) };
  }), [monthly, rate, years]);

  return (
    <CalcShell title={meta.name} tagline={meta.tagline} accent={meta.accent} icon={meta.icon}
      saveType="sip" saveInputs={{ monthly, rate, years }} saveResults={{ futureValue: res.futureValue, gains: res.gains }}>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
          <InputRow label="Monthly investment"><NumberInput value={monthly} onChange={setMonthly} step={500} /></InputRow>
          <InputRow label="Expected annual return (%)"><NumberInput value={rate} onChange={setRate} step={0.5} /></InputRow>
          <InputRow label="Investment period (years)"><NumberInput value={years} onChange={setYears} step={1} min={1} max={40} /></InputRow>
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Invested" value={formatMoney(res.invested, country)} />
            <StatCard label="Wealth gained" value={formatMoney(res.gains, country)} tone="success" />
            <StatCard label="Future value" value={formatMoney(res.futureValue, country)} tone="primary" />
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="text-sm font-medium">Wealth growth over time</div>
            <div className="mt-2 h-72">
              <ResponsiveContainer>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis dataKey="year" fontSize={11} stroke="oklch(0.65 0.02 260)" />
                  <YAxis fontSize={11} stroke="oklch(0.65 0.02 260)" tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v: number) => formatMoney(v, country)} contentStyle={{ background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="value" stroke="oklch(0.72 0.18 262)" strokeWidth={2} fill="url(#v)" />
                  <Area type="monotone" dataKey="invested" stroke="oklch(0.65 0.02 260)" strokeWidth={2} fill="transparent" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </CalcShell>
  );
}
