import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeftRight, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCountry } from "@/lib/finflow/country-store";
import { COUNTRIES } from "@/lib/finflow/countries";
import { getExchangeRates } from "@/lib/finflow/exchange.functions";

const POPULAR = ["USD", "EUR", "GBP", "INR", "AED", "JPY", "AUD", "SGD"];

export function HeroConverter() {
  const [country] = useCountry();
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState(COUNTRIES[country].currency);
  const [amount, setAmount] = useState(1000);

  useEffect(() => { setTo(COUNTRIES[country].currency); }, [country]);

  const { data, isLoading } = useQuery({
    queryKey: ["rates", from],
    queryFn: () => getExchangeRates({ data: { base: from } }),
    staleTime: 5 * 60 * 1000,
  });

  const rate = data?.rates[to] ?? 0;
  const converted = amount * rate;

  return (
    <div
      className="relative mx-auto mt-12 w-full max-w-2xl"
    >
      <div className="absolute -inset-1 rounded-3xl bg-gradient-primary opacity-20 blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-elegant backdrop-blur-xl sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live rate
          </div>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
          <ConverterField label="You send" value={amount} currency={from} onAmount={setAmount} onCurrency={setFrom} />
          <button
            onClick={() => { const t = from; setFrom(to); setTo(t); }}
            className="mx-auto grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-background transition hover:rotate-180 hover:bg-muted"
            aria-label="Swap"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <ConverterField
            label="Recipient gets"
            value={Number(converted.toFixed(2))}
            currency={to}
            onCurrency={setTo}
            readOnly
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>
            {isLoading ? "Fetching latest rates…" : (
              <>1 {from} = <span className="font-mono font-semibold text-foreground">{rate.toFixed(4)}</span> {to}</>
            )}
          </div>
          <Link to="/calc/currency" className="inline-flex items-center gap-1 text-primary hover:underline">
            Full converter <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ConverterField({
  label, value, currency, onAmount, onCurrency, readOnly,
}: {
  label: string; value: number; currency: string;
  onAmount?: (n: number) => void; onCurrency: (c: string) => void; readOnly?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border bg-background/60 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onAmount?.(Number(e.target.value))}
          readOnly={readOnly}
          className="w-full min-w-0 flex-1 bg-transparent font-display text-xl font-semibold tracking-tight focus:outline-none sm:text-2xl"
        />
        <select
          value={currency}
          onChange={(e) => onCurrency(e.target.value)}
          className="shrink-0 rounded-full border bg-transparent px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {POPULAR.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-hero" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-mesh opacity-30" />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card/50 px-3 py-1 text-xs backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="font-medium">AI-powered financial insights</span>
          <span className="h-3 w-px bg-border" />
          <span className="text-muted-foreground">India · USA · UAE</span>
        </div>

        <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
          Money math,
          <br />
          <span className="text-gradient">made effortless.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          12 professional calculators, live exchange rates, and an AI assistant that explains every number.
          Built for professionals in India, USA, and UAE.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/calculators" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition hover:opacity-95">
            Explore calculators <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/ai" className="inline-flex items-center gap-2 rounded-full border bg-card/50 px-6 py-3 text-sm font-medium backdrop-blur-md transition hover:bg-muted">
            <TrendingUp className="h-4 w-4" /> Ask FinFlow AI
          </Link>
        </div>

        <HeroConverter />
      </div>
    </section>
  );
}
