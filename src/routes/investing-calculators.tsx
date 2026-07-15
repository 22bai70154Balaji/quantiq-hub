import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, ArrowLeft, Sparkles, FileDown, FileSpreadsheet } from "lucide-react";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { sip, lumpsum, cagr, dividend, stockAverage, positionSize, profitLoss, swp, dca, fire, goalPlanner, portfolioAllocation, rebalance, compareAssets, calcBrokerage, BROKERS_IN, BROKERS_US, type BrokerId } from "@/lib/finflow/investing-calcs";
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid } from "recharts";
import { getStockDetail } from "@/lib/finflow/stock-detail.functions";
import { getCatalogEntry } from "@/lib/finflow/stocks-catalog";
import { runAll15, exportAll15Pdf, exportAll15Xlsx } from "@/lib/finflow/stock-exports";

const CALCS = [
  { id: "sip", name: "SIP" },
  { id: "lumpsum", name: "Lumpsum" },
  { id: "cagr", name: "CAGR" },
  { id: "dividend", name: "Dividend" },
  { id: "brokerage", name: "Brokerage" },
  { id: "average", name: "Stock Average" },
  { id: "position", name: "Position Size" },
  { id: "pl", name: "Profit / Loss" },
  { id: "compare", name: "CAGR vs FD/Gold/SIP" },
  { id: "fire", name: "FIRE" },
  { id: "goal", name: "Goal Planner" },
  { id: "allocator", name: "Portfolio Allocator" },
  { id: "rebalance", name: "Rebalancing" },
  { id: "swp", name: "SWP" },
  { id: "dca", name: "Dollar-Cost Averaging" },
] as const;

type CalcId = typeof CALCS[number]["id"];

const searchSchema = z.object({
  c: z.string().optional().default("sip"),
  symbol: z.string().optional(),
});

export const Route = createFileRoute("/investing-calculators")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Investing Calculators — SIP, CAGR, Brokerage & more | Calculyx AI" },
      { name: "description", content: "15 investment calculators — SIP, Lumpsum, CAGR, Dividend, Brokerage (Zerodha, Groww, Angel One, IBKR, Robinhood), FIRE, SWP, Goal Planner, and more." },
      { property: "og:title", content: "Investing Calculators — Calculyx AI" },
      { property: "og:description", content: "SIP, Lumpsum, CAGR, Dividend, Brokerage, FIRE, SWP, Goal Planner — 15 calculators for investors in India and the US." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://calculyxai.online/investing-calculators" },
      { property: "og:image", content: "https://calculyxai.online/og-image.jpg" },
      { name: "twitter:image", content: "https://calculyxai.online/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://calculyxai.online/investing-calculators" }],
  }),
  component: Page,
});

// Live-data prefill for every calculator. When `?symbol=X` is present, we
// fetch the stock detail server fn and feed live price / assumed CAGR /
// dividend into whichever view is active. If nothing is set, defaults apply.
type StockCtx = {
  symbol: string;
  name: string;
  price: number;
  currency: "INR" | "USD";
  isIndian: boolean;
  assumedReturn: number;
  divYield?: number;
  logoDomain?: string;
};

function Page() {
  const { c, symbol } = Route.useSearch();
  const navigate = useNavigate({ from: "/investing-calculators" });
  const active = (CALCS.find((x) => x.id === c)?.id ?? "sip") as CalcId;

  const stockQuery = useQuery({
    enabled: !!symbol,
    queryKey: ["calc-prefill", symbol],
    queryFn: () => getStockDetail({ data: { symbol: symbol! } }),
    staleTime: 60_000,
  });

  const ctx: StockCtx | null = useMemo(() => {
    if (!symbol || !stockQuery.data) return null;
    const d = stockQuery.data;
    const cat = getCatalogEntry(d.symbol);
    return {
      symbol: d.symbol,
      name: d.name,
      price: d.price,
      currency: d.currency === "INR" ? "INR" : "USD",
      isIndian: d.region === "IN",
      assumedReturn: cat?.assumedReturn ?? 12,
      divYield: d.divYield,
      logoDomain: d.logoDomain,
    };
  }, [symbol, stockQuery.data]);

  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Calculator className="h-4 w-4" /> Investing calculators
          </div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            All investing <span className="font-serif italic text-gold">math</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            15 calculators for stock investors — SIP, CAGR, brokerage across Indian and US brokers, dividend income, position sizing, FIRE, SWP, and more.
          </p>

          {symbol && (
            <StockContext ctx={ctx} loading={stockQuery.isLoading} symbol={symbol} />
          )}

          <div className="mt-8 flex flex-wrap gap-1.5">
            {CALCS.map((t) => (
              <button key={t.id} onClick={() => navigate({ search: (s: { c?: string; symbol?: string }) => ({ ...s, c: t.id }) })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${active === t.id ? "bg-foreground text-background" : "border border-white/10 bg-white/[0.02] text-muted-foreground hover:text-foreground"}`}>
                {t.name}
              </button>
            ))}
          </div>

          <motion.div key={active} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            {active === "sip" && <SipView ctx={ctx} />}
            {active === "lumpsum" && <LumpsumView ctx={ctx} />}
            {active === "cagr" && <CagrView ctx={ctx} />}
            {active === "dividend" && <DividendView ctx={ctx} />}
            {active === "brokerage" && <BrokerageView ctx={ctx} />}
            {active === "average" && <AverageView ctx={ctx} />}
            {active === "position" && <PositionView ctx={ctx} />}
            {active === "pl" && <PLView ctx={ctx} />}
            {active === "compare" && <CompareView ctx={ctx} />}
            {active === "fire" && <FireView ctx={ctx} />}
            {active === "goal" && <GoalView ctx={ctx} />}
            {active === "allocator" && <AllocatorView />}
            {active === "rebalance" && <RebalanceView ctx={ctx} />}
            {active === "swp" && <SwpView ctx={ctx} />}
            {active === "dca" && <DcaView ctx={ctx} />}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StockContext({ ctx, loading, symbol }: { ctx: StockCtx | null; loading: boolean; symbol: string }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <Link to="/stocks/$symbol" params={{ symbol }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> back to stock
      </Link>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        {loading ? (
          <span className="text-sm text-muted-foreground">Loading live data for {symbol}…</span>
        ) : ctx ? (
          <span className="text-sm">
            Prefilled with <span className="font-semibold">{ctx.name}</span> ·
            live price <span className="font-mono font-semibold">{ctx.currency === "INR" ? "₹" : "$"}{ctx.price.toLocaleString(ctx.currency === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: 2 })}</span>
            {ctx.divYield ? <> · yield <span className="font-mono">{ctx.divYield.toFixed(2)}%</span></> : null}
            {" · assumed return "}<span className="font-mono">{ctx.assumedReturn}% p.a.</span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Live data unavailable — showing defaults.</span>
        )}
      </div>
      {ctx && (
        <div className="ml-auto flex gap-2">
          <button onClick={() => {
            const bundle = runAll15({ symbol: ctx.symbol, name: ctx.name, currency: ctx.currency, price: ctx.price, assumedReturn: ctx.assumedReturn, divYield: ctx.divYield, isIndian: ctx.isIndian });
            exportAll15Pdf(bundle);
          }} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs hover:bg-white/[0.1]">
            <FileDown className="h-3 w-3" /> All-15 PDF
          </button>
          <button onClick={() => {
            const bundle = runAll15({ symbol: ctx.symbol, name: ctx.name, currency: ctx.currency, price: ctx.price, assumedReturn: ctx.assumedReturn, divYield: ctx.divYield, isIndian: ctx.isIndian });
            exportAll15Xlsx(bundle);
          }} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs hover:bg-white/[0.1]">
            <FileSpreadsheet className="h-3 w-3" /> All-15 Excel
          </button>
        </div>
      )}
    </div>
  );
}

// ---- shared field components ----

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
function NumInput({ value, onChange, step = 1 }: { value: number; onChange: (v: number) => void; step?: number }) {
  return <input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value) || 0)}
    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20" />;
}
function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }> }) {
  return <select value={value} onChange={(e) => onChange(e.target.value as T)}
    className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 font-mono text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20">
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;
}
function Card({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "primary" }) {
  const c = tone === "up" ? "text-emerald-400" : tone === "down" ? "text-red-400" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-xl font-semibold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}
function useCurrency(initial: "INR" | "USD" = "INR") {
  const [ccy, setCcy] = useState<"INR" | "USD">(initial);
  const fmt = (v: number) => ccy === "INR" ? `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return { ccy, setCcy, fmt, Toggle: () => (
    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.02] p-0.5 text-xs">
      {(["INR", "USD"] as const).map((k) => (
        <button key={k} onClick={() => setCcy(k)} className={`rounded-full px-3 py-1 ${ccy === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{k}</button>
      ))}
    </div>
  ) };
}

// ---- views ----

function SipView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const [monthly, setMonthly] = useState(ctx?.currency === "USD" ? 500 : 5000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(ctx?.assumedReturn ?? 12);
  const res = useMemo(() => sip({ monthly, rate, years }), [monthly, rate, years]);
  const data = useMemo(() => Array.from({ length: years }, (_, i) => {
    const y = i + 1;
    const s = sip({ monthly, rate, years: y });
    return { year: y, Invested: Math.round(s.invested), FutureValue: Math.round(s.futureValue) };
  }), [monthly, rate, years]);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Field label={`Monthly investment${ctx ? ` — in ${ctx.name}` : ""}`}><NumInput value={monthly} step={500} onChange={setMonthly} /></Field>
          <Field label="Years"><NumInput value={years} onChange={setYears} /></Field>
          <Field label="Expected return (% p.a.)"><NumInput value={rate} step={0.5} onChange={setRate} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Card label="Projected value" value={fmt(res.futureValue)} tone="primary" />
          <Card label="Invested" value={fmt(res.invested)} />
          <Card label="Profit" value={fmt(res.gains)} tone="up" />
        </div>
      </div>
      <div className="mt-6 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Area dataKey="Invested" stackId="1" stroke="#94a3b8" fill="#94a3b833" />
            <Area dataKey="FutureValue" stackId="0" stroke="hsl(var(--primary))" fill="url(#g1)" />
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LumpsumView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const [amount, setAmount] = useState(ctx?.currency === "USD" ? 10000 : 100000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(ctx?.assumedReturn ?? 12);
  const res = useMemo(() => lumpsum({ principal: amount, rate, years }), [amount, rate, years]);
  const data = useMemo(() => Array.from({ length: years }, (_, i) => {
    const y = i + 1;
    const r = lumpsum({ principal: amount, rate, years: y });
    return { year: y, Value: Math.round(r.futureValue), Invested: Math.round(r.invested) };
  }), [amount, rate, years]);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          {ctx && <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-muted-foreground">One-time investment in <span className="font-semibold text-foreground">{ctx.name}</span> at live price {fmt(ctx.price)}.</div>}
          <Field label="Investment amount"><NumInput value={amount} step={5000} onChange={setAmount} /></Field>
          <Field label="Years"><NumInput value={years} onChange={setYears} /></Field>
          <Field label="Expected return (% p.a.)"><NumInput value={rate} step={0.5} onChange={setRate} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Card label="Future value" value={fmt(res.futureValue)} tone="primary" />
          <Card label="Invested" value={fmt(res.invested)} />
          <Card label="Gains" value={fmt(res.gains)} tone="up" />
        </div>
      </div>
      <div className="mt-6 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
            <Line dataKey="Value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line dataKey="Invested" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CagrView({ ctx }: { ctx: StockCtx | null }) {
  const [start, setStart] = useState(ctx ? ctx.price * 0.5 : 250);
  const [end, setEnd] = useState(ctx?.price ?? 1320);
  const [years, setYears] = useState(5);
  const res = useMemo(() => cagr({ start, end, years }), [start, end, years]);
  const growth = useMemo(() => Array.from({ length: Math.max(1, Math.round(years)) + 1 }, (_, i) => ({
    year: i,
    Value: +(start * Math.pow(1 + res.cagr / 100, i)).toFixed(2),
  })), [start, years, res.cagr]);
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          {ctx && <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-muted-foreground">Sample from <span className="font-semibold text-foreground">{ctx.name}</span>, current price {ctx.price.toFixed(2)}.</div>}
          <Field label="Bought at"><NumInput value={start} step={0.5} onChange={setStart} /></Field>
          <Field label="Current price"><NumInput value={end} step={0.5} onChange={setEnd} /></Field>
          <Field label="Years held"><NumInput value={years} step={0.25} onChange={setYears} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Card label="CAGR" value={`${res.cagr.toFixed(2)}%`} tone="primary" />
          <Card label="Multiplier" value={`${res.multiplier.toFixed(2)}x`} tone="up" />
        </div>
      </div>
      <div className="mt-6 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={growth}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Line dataKey="Value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DividendView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const [shares, setShares] = useState(100);
  const initDps = ctx?.divYield && ctx?.price ? (ctx.price * ctx.divYield) / 100 : ctx?.currency === "USD" ? 1 : 15;
  const [dps, setDps] = useState(initDps);
  const [price, setPrice] = useState(ctx?.price ?? 500);
  const res = useMemo(() => dividend({ shares, dps, priceForYield: price }), [shares, dps, price]);
  const projection = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    year: i + 1,
    Dividends: Math.round(res.annual * (i + 1)),
  })), [res.annual]);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          {ctx && <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-muted-foreground">Live yield for <span className="font-semibold text-foreground">{ctx.name}</span>: <span className="font-mono">{ctx.divYield ? `${ctx.divYield.toFixed(2)}%` : "—"}</span></div>}
          <Field label="Shares owned"><NumInput value={shares} onChange={setShares} /></Field>
          <Field label="Dividend per share (annual)"><NumInput value={dps} step={0.1} onChange={setDps} /></Field>
          <Field label="Current price"><NumInput value={price} step={0.5} onChange={setPrice} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Card label="Annual income" value={fmt(res.annual)} tone="primary" />
          <Card label="Monthly income" value={fmt(res.monthly)} />
          <Card label="Yield" value={`${res.yieldPct.toFixed(2)}%`} tone="up" />
        </div>
      </div>
      <div className="mt-6 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projection}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
            <Bar dataKey="Dividends" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


function BrokerageView({ ctx }: { ctx: StockCtx | null }) {
  const [market, setMarket] = useState<"IN" | "US">(ctx?.isIndian ? "IN" : ctx ? "US" : "IN");
  const brokers = market === "IN" ? BROKERS_IN : BROKERS_US;
  const [broker, setBroker] = useState<BrokerId>(brokers[0].id);
  const [tradeType, setTradeType] = useState<"delivery" | "intraday">("delivery");
  const [buy, setBuy] = useState(ctx?.price ?? 500);
  const [sell, setSell] = useState((ctx?.price ?? 500) * 1.1);
  const [qty, setQty] = useState(50);
  const res = useMemo(() => calcBrokerage({ broker, buyPrice: buy, sellPrice: sell, qty, tradeType, market }), [broker, buy, sell, qty, tradeType, market]);
  const fmt = (v: number) => market === "IN" ? `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const feeBreakdown = [
    { name: "Brokerage", value: res.brokerage, color: "hsl(var(--primary))" },
    { name: "Taxes/fees", value: res.totalCharges - res.brokerage, color: "#f59e0b" },
  ].filter((x) => x.value > 0);
  return (
    <div>
      <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.02] p-0.5 text-xs">
        {(["IN", "US"] as const).map((k) => (
          <button key={k} onClick={() => { setMarket(k); const first = (k === "IN" ? BROKERS_IN : BROKERS_US)[0].id; setBroker(first); }}
            className={`rounded-full px-3 py-1 ${market === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {k === "IN" ? "🇮🇳 India" : "🇺🇸 US"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Broker"><Select value={broker} onChange={setBroker} options={brokers.map((b) => ({ value: b.id, label: b.name }))} /></Field>
          <Field label="Trade type"><Select value={tradeType} onChange={setTradeType} options={[{ value: "delivery", label: "Delivery" }, { value: "intraday", label: "Intraday" }]} /></Field>
          <Field label="Buy price"><NumInput value={buy} step={0.5} onChange={setBuy} /></Field>
          <Field label="Sell price"><NumInput value={sell} step={0.5} onChange={setSell} /></Field>
          <Field label="Quantity"><NumInput value={qty} onChange={setQty} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Card label="Brokerage" value={fmt(res.brokerage)} />
          <Card label="Taxes/fees" value={fmt(res.totalCharges - res.brokerage)} />
          <Card label="Total charges" value={fmt(res.totalCharges)} />
          <Card label="Breakeven %" value={`${res.breakevenPct.toFixed(2)}%`} />
          <div className="col-span-2"><Card label="Net profit" value={fmt(res.netPL)} tone={res.netPL >= 0 ? "up" : "down"} /></div>
        </div>
      </div>
      {feeBreakdown.length > 0 && (
        <div className="mt-6 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={feeBreakdown} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={3}>
                {feeBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function AverageView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const initPrice = ctx?.price ?? 400;
  const [lots, setLots] = useState([{ qty: 10, price: initPrice * 1.05 }, { qty: 20, price: initPrice * 0.9 }]);
  const res = useMemo(() => stockAverage(lots), [lots]);
  const chartData = lots.map((l, i) => ({ name: `Lot ${i + 1}`, Price: l.price, Avg: res.avg }));
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Quantity</span><span>Price</span><span></span>
          </div>
          {lots.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <NumInput value={l.qty} onChange={(v) => setLots((p) => p.map((x, j) => j === i ? { ...x, qty: v } : x))} />
              <NumInput value={l.price} step={0.5} onChange={(v) => setLots((p) => p.map((x, j) => j === i ? { ...x, price: v } : x))} />
              <button onClick={() => setLots((p) => p.filter((_, j) => j !== i))} className="px-2 text-muted-foreground hover:text-red-400">✕</button>
            </div>
          ))}
          <button onClick={() => setLots((p) => [...p, { qty: 0, price: 0 }])} className="rounded-lg border border-dashed border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">+ Add lot</button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Card label="Average cost" value={fmt(res.avg)} tone="primary" />
          <Card label="Total quantity" value={String(res.totalQty)} />
          <Card label="Total invested" value={fmt(res.totalCost)} />
        </div>
      </div>
      <div className="mt-6 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
            <Bar dataKey="Price" fill="hsl(var(--primary))" />
            <Bar dataKey="Avg" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PositionView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const [portfolio, setPortfolio] = useState(ctx?.currency === "USD" ? 100_000 : 1_000_000);
  const [risk, setRisk] = useState(2);
  const [stop, setStop] = useState(5);
  const [entry, setEntry] = useState(ctx?.price ?? 500);
  const res = useMemo(() => positionSize({ portfolio, riskPct: risk, stopLossPct: stop, entryPrice: entry }), [portfolio, risk, stop, entry]);
  const alloc = [
    { name: "This trade", value: Math.max(0, res.capitalDeployed), color: "hsl(var(--primary))" },
    { name: "Rest of portfolio", value: Math.max(0, portfolio - res.capitalDeployed), color: "#94a3b8" },
  ].filter((x) => x.value > 0);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          {ctx && <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-muted-foreground">Entry seeded from <span className="font-semibold text-foreground">{ctx.name}</span> live price.</div>}
          <Field label="Portfolio size"><NumInput value={portfolio} step={10000} onChange={setPortfolio} /></Field>
          <Field label="Risk per trade (%)"><NumInput value={risk} step={0.25} onChange={setRisk} /></Field>
          <Field label="Stop-loss (%)"><NumInput value={stop} step={0.25} onChange={setStop} /></Field>
          <Field label="Entry price"><NumInput value={entry} step={0.5} onChange={setEntry} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Card label="Maximum quantity" value={String(res.qty)} tone="primary" />
          <Card label="Risk amount" value={fmt(res.riskAmount)} />
          <Card label="Capital deployed" value={fmt(res.capitalDeployed)} />
        </div>
      </div>
      {alloc.length > 0 && (
        <div className="mt-6 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={alloc} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {alloc.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function PLView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const [buy, setBuy] = useState(ctx?.price ?? 500);
  const [sell, setSell] = useState((ctx?.price ?? 500) * 1.2);
  const [qty, setQty] = useState(100);
  const [tax, setTax] = useState(ctx?.isIndian === false ? 15 : 12.5);
  const res = useMemo(() => profitLoss({ buy, sell, qty, taxRate: tax }), [buy, sell, qty, tax]);
  const rows = [
    { name: "Invested", value: res.invested, color: "#94a3b8" },
    { name: "Proceeds", value: res.proceeds, color: "hsl(var(--primary))" },
    { name: "Net", value: res.net, color: res.net >= 0 ? "#10b981" : "#ef4444" },
  ];
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Buy price"><NumInput value={buy} step={0.5} onChange={setBuy} /></Field>
          <Field label="Sell price"><NumInput value={sell} step={0.5} onChange={setSell} /></Field>
          <Field label="Quantity"><NumInput value={qty} onChange={setQty} /></Field>
          <Field label="Cap-gains tax %"><NumInput value={tax} step={0.5} onChange={setTax} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Card label="Gross P/L" value={fmt(res.gross)} tone={res.gross >= 0 ? "up" : "down"} />
          <Card label="Tax" value={fmt(res.tax)} />
          <Card label="Net P/L" value={fmt(res.net)} tone={res.net >= 0 ? "up" : "down"} />
          <Card label="ROI" value={`${res.roi.toFixed(2)}%`} tone={res.roi >= 0 ? "up" : "down"} />
        </div>
      </div>
      <div className="mt-6 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
            <Bar dataKey="value">{rows.map((r, i) => <Cell key={i} fill={r.color} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CompareView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const [amount, setAmount] = useState(ctx?.currency === "USD" ? 10000 : 100000);
  const [years, setYears] = useState(10);
  const [stockRate, setStockRate] = useState(ctx?.assumedReturn ?? 15);
  const res = useMemo(() => compareAssets({ amount, years, stockCagr: stockRate }), [amount, years, stockRate]);
  const rows = [
    { name: ctx ? ctx.symbol : "Stock", value: res.stock, color: "hsl(var(--primary))" },
    { name: "Nifty/SIP (12%)", value: res.nifty, color: "#f59e0b" },
    { name: "Gold (9%)", value: res.gold, color: "#eab308" },
    { name: "FD (7%)", value: res.fd, color: "#94a3b8" },
  ];
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          {ctx && <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-muted-foreground">Comparing <span className="font-semibold text-foreground">{ctx.name}</span> at {ctx.assumedReturn}% CAGR vs classic asset classes.</div>}
          <Field label="Amount"><NumInput value={amount} step={5000} onChange={setAmount} /></Field>
          <Field label="Years"><NumInput value={years} onChange={setYears} /></Field>
          <Field label="Assumed stock CAGR (% p.a.)"><NumInput value={stockRate} step={0.5} onChange={setStockRate} /></Field>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
              <Bar dataKey="value">{rows.map((r, i) => <Cell key={i} fill={r.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map((r) => <Card key={r.name} label={r.name} value={fmt(r.value)} />)}
      </div>
    </div>
  );
}

function FireView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const [expense, setExpense] = useState(ctx?.currency === "USD" ? 40000 : 600000);
  const [rate, setRate] = useState(4);
  const res = useMemo(() => fire({ annualExpense: expense, withdrawalRate: rate }), [expense, rate]);
  const bars = [
    { name: "Lean FIRE", value: Math.round(res.leanFire), color: "#94a3b8" },
    { name: "FIRE", value: Math.round(res.fireNumber), color: "hsl(var(--primary))" },
    { name: "Fat FIRE", value: Math.round(res.fatFire), color: "#f59e0b" },
  ];
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Field label="Annual expense today"><NumInput value={expense} step={10000} onChange={setExpense} /></Field>
          <Field label="Safe withdrawal rate (%)"><NumInput value={rate} step={0.25} onChange={setRate} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Card label="FIRE number" value={fmt(res.fireNumber)} tone="primary" />
          <Card label="Lean FIRE" value={fmt(res.leanFire)} />
          <Card label="Fat FIRE" value={fmt(res.fatFire)} />
        </div>
      </div>
      <div className="mt-6 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
            <Bar dataKey="value">{bars.map((b, i) => <Cell key={i} fill={b.color} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GoalView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const [goalName, setGoalName] = useState("Buy House");
  const [target, setTarget] = useState(ctx?.currency === "USD" ? 500_000 : 20_000_000);
  const [years, setYears] = useState(15);
  const [rate, setRate] = useState(ctx?.assumedReturn ?? 12);
  const res = useMemo(() => goalPlanner({ target, years, rate }), [target, years, rate]);
  const growth = useMemo(() => Array.from({ length: Math.max(1, years) + 1 }, (_, i) => {
    const n = i * 12; const r = rate / 12 / 100;
    const v = r === 0 ? res.sipMonthly * n : res.sipMonthly * (((Math.pow(1 + r, n) - 1) / r)) * (1 + r);
    return { year: i, Value: Math.round(isFinite(v) ? v : 0) };
  }), [res.sipMonthly, rate, years]);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Field label="Goal"><input value={goalName} onChange={(e) => setGoalName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm" /></Field>
          <Field label="Target amount"><NumInput value={target} step={100000} onChange={setTarget} /></Field>
          <Field label="Years"><NumInput value={years} onChange={setYears} /></Field>
          <Field label="Expected return (% p.a.)"><NumInput value={rate} step={0.5} onChange={setRate} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            To hit <span className="font-semibold">{fmt(target)}</span> for <span className="font-semibold">{goalName}</span> in {years} years:
          </div>
          <Card label="Required monthly SIP" value={fmt(res.sipMonthly)} tone="primary" />
          <Card label="Or lump-sum today" value={fmt(res.lumpsumNeeded)} />
        </div>
      </div>
      <div className="mt-6 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={growth}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
            <Area dataKey="Value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AllocatorView() {
  const [age, setAge] = useState(30);
  const [risk, setRisk] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const res = useMemo(() => portfolioAllocation({ age, risk }), [age, risk]);
  const data = [
    { name: "India equity", value: res.india, color: "#8b5cf6" },
    { name: "US equity", value: res.us, color: "#3b82f6" },
    { name: "Gold", value: res.gold, color: "#eab308" },
    { name: "Bonds", value: res.bonds, color: "#94a3b8" },
    { name: "Cash", value: res.cash, color: "#64748b" },
  ].filter((d) => d.value > 0);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-3">
        <Field label="Age"><NumInput value={age} onChange={setAge} /></Field>
        <Field label="Risk profile">
          <Select value={risk} onChange={setRisk} options={[{ value: "conservative", label: "Conservative" }, { value: "balanced", label: "Balanced" }, { value: "aggressive", label: "Aggressive" }]} />
        </Field>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 font-mono">
              <span className="h-3 w-3 rounded" style={{ background: d.color }} />
              <span className="flex-1">{d.name}</span>
              <span className="font-semibold">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={2}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RebalanceView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const [portfolio, setPortfolio] = useState(ctx?.currency === "USD" ? 100_000 : 1_000_000);
  const [rows, setRows] = useState([
    { asset: "Equity", current: 70, target: 60 },
    { asset: "Bonds", current: 15, target: 25 },
    { asset: "Gold", current: 10, target: 10 },
    { asset: "Cash", current: 5, target: 5 },
  ]);
  const cur = Object.fromEntries(rows.map((r) => [r.asset, r.current]));
  const tgt = Object.fromEntries(rows.map((r) => [r.asset, r.target]));
  const res = useMemo(() => rebalance(cur, tgt, portfolio), [portfolio, rows]);
  const chart = rows.map((r) => ({ name: r.asset, Current: r.current, Target: r.target }));
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Field label="Portfolio value"><NumInput value={portfolio} step={10000} onChange={setPortfolio} /></Field>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Asset</span><span>Current %</span><span>Target %</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr] gap-2">
              <input value={r.asset} onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, asset: e.target.value } : x))} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm" />
              <NumInput value={r.current} step={0.5} onChange={(v) => setRows((p) => p.map((x, j) => j === i ? { ...x, current: v } : x))} />
              <NumInput value={r.target} step={0.5} onChange={(v) => setRows((p) => p.map((x, j) => j === i ? { ...x, target: v } : x))} />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {res.map((r) => (
            <div key={r.asset} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3">
              <div className="font-semibold">{r.asset}</div>
              <div className="text-right">
                <div className={`font-mono text-sm font-semibold ${r.action === "Buy" ? "text-emerald-400" : r.action === "Sell" ? "text-red-400" : "text-muted-foreground"}`}>
                  {r.action} {r.action !== "Hold" && fmt(Math.abs(r.deltaValue))}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">{r.current}% → {r.target}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Current" fill="#94a3b8" />
            <Bar dataKey="Target" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SwpView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const [corpus, setCorpus] = useState(ctx?.currency === "USD" ? 1_000_000 : 10_000_000);
  const [monthly, setMonthly] = useState(ctx?.currency === "USD" ? 5000 : 50000);
  const [rate, setRate] = useState(9);
  const res = useMemo(() => swp({ corpus, monthly, rate }), [corpus, monthly, rate]);
  const timeline = useMemo(() => {
    const out: Array<{ year: number; Balance: number }> = [];
    let bal = corpus;
    const r = rate / 12 / 100;
    for (let m = 0; m <= res.months && m <= 600; m++) {
      if (m % 12 === 0) out.push({ year: m / 12, Balance: Math.round(Math.max(0, bal)) });
      bal = bal * (1 + r) - monthly;
      if (bal <= 0) { out.push({ year: (m + 1) / 12, Balance: 0 }); break; }
    }
    return out;
  }, [corpus, monthly, rate, res.months]);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Field label="Corpus"><NumInput value={corpus} step={100000} onChange={setCorpus} /></Field>
          <Field label="Monthly withdrawal"><NumInput value={monthly} step={1000} onChange={setMonthly} /></Field>
          <Field label="Expected return (% p.a.)"><NumInput value={rate} step={0.25} onChange={setRate} /></Field>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Card label={res.exhausted ? "Corpus lasts" : "Corpus never depletes at these settings"} value={res.exhausted ? `${res.years.toFixed(1)} years` : "∞"} tone="primary" />
          <Card label="Total withdrawn" value={fmt(monthly * res.months)} />
        </div>
      </div>
      <div className="mt-6 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
            <Area dataKey="Balance" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DcaView({ ctx }: { ctx: StockCtx | null }) {
  const { fmt, Toggle } = useCurrency(ctx?.currency ?? "INR");
  const basePrice = ctx?.price ?? 400;
  const baseAmt = ctx?.currency === "USD" ? 500 : 5000;
  const [purchases, setPurchases] = useState([
    { amount: baseAmt, price: basePrice * 1.05 },
    { amount: baseAmt, price: basePrice * 0.9 },
    { amount: baseAmt, price: basePrice * 1.15 },
  ]);
  const res = useMemo(() => dca(purchases), [purchases]);
  const chart = purchases.map((p, i) => ({ name: `Buy ${i + 1}`, Price: p.price, Avg: res.avg }));
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Amount invested</span><span>Price per share</span><span></span>
          </div>
          {purchases.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <NumInput value={p.amount} step={500} onChange={(v) => setPurchases((x) => x.map((y, j) => j === i ? { ...y, amount: v } : y))} />
              <NumInput value={p.price} step={0.5} onChange={(v) => setPurchases((x) => x.map((y, j) => j === i ? { ...y, price: v } : y))} />
              <button onClick={() => setPurchases((x) => x.filter((_, j) => j !== i))} className="px-2 text-muted-foreground hover:text-red-400">✕</button>
            </div>
          ))}
          <button onClick={() => setPurchases((x) => [...x, { amount: 0, price: 0 }])} className="rounded-lg border border-dashed border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">+ Add purchase</button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Card label="Average price" value={fmt(res.avg)} tone="primary" />
          <Card label="Total shares" value={res.totalShares.toFixed(4)} />
          <Card label="Total invested" value={fmt(res.totalInvested)} />
        </div>
      </div>
      <div className="mt-6 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v) => fmt(v as number)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line dataKey="Price" stroke="#94a3b8" dot={{ r: 3 }} />
            <Line dataKey="Avg" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
