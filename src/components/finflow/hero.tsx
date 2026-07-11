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
    <div className="relative mx-auto mt-14 w-full max-w-4xl">
      {/* violet glow halo */}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-primary/10 blur-2xl" aria-hidden />
      <div className="relative rounded-[2rem] p-[1px] bg-gradient-to-b from-white/10 to-transparent">
        <div className="relative overflow-hidden rounded-[calc(2rem-1px)] glass-strong p-6 sm:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain opacity-[0.04] mix-blend-overlay" />

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
            {/* left: input + metrics */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    You send
                  </label>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                    </span>
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <select value={from} onChange={(e) => setFrom(e.target.value)}
                    className="shrink-0 bg-transparent font-display text-3xl tracking-tight text-foreground/90 focus:outline-none">
                    {POPULAR.map((c) => <option key={c} value={c} className="bg-background">{c}</option>)}
                  </select>
                  <input
                    type="number"
                    value={Number.isFinite(amount) ? amount : 0}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full min-w-0 flex-1 bg-transparent font-mono text-4xl font-medium tabular-nums tracking-tight focus:outline-none sm:text-5xl"
                  />
                </div>
                <div className="h-px w-full bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Live rate</div>
                  <div className="mt-1 font-mono text-lg tabular-nums text-primary">
                    {isLoading ? "—" : rate.toFixed(4)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Inverse</div>
                  <div className="mt-1 font-mono text-lg tabular-nums" style={{ color: "oklch(0.82 0.13 82)" }}>
                    {rate ? (1 / rate).toFixed(4) : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* right: result panel */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.05] p-6">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" aria-hidden />
              <div className="relative flex h-full flex-col justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                      AI-optimized yield
                    </label>
                    <button
                      onClick={() => { const t = from; setFrom(to); setTo(t); }}
                      className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-muted-foreground transition hover:rotate-180 hover:bg-white/5"
                      aria-label="Swap"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-medium tabular-nums tracking-tight text-foreground sm:text-5xl">
                      {converted.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    </span>
                    <select value={to} onChange={(e) => setTo(e.target.value)}
                      className="shrink-0 bg-transparent font-display text-xl italic text-muted-foreground focus:outline-none"
                      style={{ fontFamily: "var(--font-serif)" }}>
                      {POPULAR.map((c) => <option key={c} value={c} className="bg-background not-italic">{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[11px] tracking-wide">
                    <span className="text-muted-foreground uppercase tracking-[0.2em]">1 {from}</span>
                    <span className="text-foreground tabular-nums">= {rate.toFixed(4)} {to}</span>
                  </div>
                  <Link
                    to="/calc/currency"
                    className="cta-glow group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.24em]"
                  >
                    Open full converter
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-hero" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-mesh opacity-40" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain opacity-40 mix-blend-overlay" />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card/50 px-3.5 py-1.5 text-xs backdrop-blur-md shadow-soft">
          <Sparkles className="h-3 w-3" style={{ color: "oklch(0.82 0.13 82)" }} />
          <span className="font-grotesk font-medium tracking-[0.18em] uppercase text-[10.5px]">AI-powered financial insights</span>
          <span className="h-3 w-px bg-border" />
          <span className="text-muted-foreground font-grotesk tracking-[0.14em] uppercase text-[10.5px]">India · USA · UAE</span>
        </div>

        <h1
          className="mt-10 font-display text-6xl leading-[0.95] tracking-[-0.035em] sm:text-7xl md:text-[6.5rem]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 0' }}
        >
          <span className="block font-normal">Money math,</span>
          <span
            className="block italic font-normal"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            <span className="text-gradient">made</span>{" "}
            <span className="text-gold">effortless.</span>
          </span>
        </h1>

        <div className="mx-auto mt-7 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-border" />
          <span className="font-grotesk text-[10.5px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
            Premium · Precise · Trusted
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-border" />
        </div>

        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          12 professional calculators, live exchange rates, and an AI assistant that explains every number.
          Built for professionals in India, USA, and UAE.
        </p>


        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/calculators"
            className="cta-glow group inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.24em]"
          >
            Start Calculating <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/ai"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-foreground/80 backdrop-blur-md transition hover:bg-white/[0.06] hover:text-foreground"
          >
            <TrendingUp className="h-3.5 w-3.5" /> Explore Features
          </Link>
        </div>

        <HeroConverter />
      </div>
    </section>
  );
}
