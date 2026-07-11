import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import { getExchangeRates } from "@/lib/finflow/exchange.functions";
import { CalcShell, InputRow, NumberInput, StatCard } from "../calc-shell";
import { CALC_BY_SLUG } from "@/lib/finflow/registry";
import { useCountry } from "@/lib/finflow/country-store";
import type { AnalysisPayload } from "@/lib/finflow/analysis/types";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "JPY", "AUD", "CAD", "CHF", "SGD", "CNY", "HKD"];

export function CurrencyCalc() {
  const meta = CALC_BY_SLUG["currency"];
  const [country] = useCountry();
  const [amount, setAmount] = useState(1000);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("INR");
  const { data, isLoading } = useQuery({
    queryKey: ["rates", from],
    queryFn: () => getExchangeRates({ data: { base: from } }),
    staleTime: 5 * 60 * 1000,
  });
  const rate = data?.rates[to] ?? 0;
  const result = amount * rate;

  const payload: AnalysisPayload = useMemo(() => {
    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return {
      slug: "currency",
      country,
      title: "Currency conversion",
      subtitle: `${from} → ${to} at live mid-market rate`,
      inputs: [
        { label: "Amount", value: `${fmt(amount)} ${from}` },
        { label: "From currency", value: from },
        { label: "To currency", value: to },
        { label: "Rate source", value: data?.updated ? new Date(data.updated).toLocaleString() : "Live" },
      ],
      kpis: [
        { label: "Converted amount", value: `${fmt(result)} ${to}`, tone: "primary" },
        { label: "Exchange rate", value: `1 ${from} = ${rate.toFixed(4)} ${to}`, tone: "neutral" },
        { label: "Inverse rate", value: rate ? `1 ${to} = ${(1 / rate).toFixed(4)} ${from}` : "—", tone: "neutral" },
      ],
      assumptions: [
        "Rate is a live mid-market quote; bank/card transactions include a spread (typically 0.5%–3%).",
        "No fees, taxes, or currency-conversion charges are applied here.",
        "Rate at execution time may differ from the quote shown.",
      ],
      raw: {
        inputs: { amount, from, to },
        results: { rate, result },
      },
      aiBrief: `Convert ${fmt(amount)} ${from} to ${to} at rate ${rate.toFixed(4)}. Result: ${fmt(result)} ${to}. Rate updated ${data?.updated ?? "recently"}.`,
    };
  }, [country, amount, from, to, rate, result, data?.updated]);

  return (
    <CalcShell title={meta.name} tagline={meta.tagline} accent={meta.accent} icon={meta.icon}
      saveType="currency" analysisPayload={payload}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
          <InputRow label="Amount">
            <NumberInput value={amount} onChange={setAmount} />
          </InputRow>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <InputRow label="From">
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 w-full rounded-xl border bg-background px-3">
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </InputRow>
            <button onClick={() => { const t = from; setFrom(to); setTo(t); }} className="mb-1 grid h-11 w-11 place-items-center rounded-xl border hover:bg-muted">
              <ArrowLeftRight className="h-4 w-4" />
            </button>
            <InputRow label="To">
              <select value={to} onChange={(e) => setTo(e.target.value)} className="h-11 w-full rounded-xl border bg-background px-3">
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </InputRow>
          </div>
          <div className="text-xs text-muted-foreground">
            {isLoading ? "Fetching rate…" : `Rate updated ${data?.updated ? new Date(data.updated).toLocaleString() : ""}`}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Converted amount</div>
            <div className="mt-2 font-mono text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
              {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-muted-foreground text-xl font-normal">{to}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">1 {from} = {rate.toFixed(4)} {to}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Inverse rate" value={rate ? (1 / rate).toFixed(4) : "—"} sub={`1 ${to} = ? ${from}`} />
            <StatCard label="Base" value={from} sub="Source currency" />
          </div>
        </div>
      </div>
    </CalcShell>
  );
}
