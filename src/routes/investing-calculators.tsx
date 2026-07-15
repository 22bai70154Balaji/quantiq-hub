import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { sip, lumpsum, cagr, dividend, stockAverage, positionSize, profitLoss, swp, dca, fire, goalPlanner, portfolioAllocation, rebalance, compareAssets, calcBrokerage, BROKERS_IN, BROKERS_US, type BrokerId } from "@/lib/finflow/investing-calcs";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid } from "recharts";

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

const searchSchema = z.object({ c: z.string().optional().default("sip") });

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

function Page() {
  const { c } = Route.useSearch();
  const navigate = useNavigate({ from: "/investing-calculators" });
  const active = (CALCS.find((x) => x.id === c)?.id ?? "sip") as CalcId;

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

          <div className="mt-8 flex flex-wrap gap-1.5">
            {CALCS.map((t) => (
              <button key={t.id} onClick={() => navigate({ search: { c: t.id } })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${active === t.id ? "bg-foreground text-background" : "border border-white/10 bg-white/[0.02] text-muted-foreground hover:text-foreground"}`}>
                {t.name}
              </button>
            ))}
          </div>

          <motion.div key={active} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            {active === "sip" && <SipView />}
            {active === "lumpsum" && <LumpsumView />}
            {active === "cagr" && <CagrView />}
            {active === "dividend" && <DividendView />}
            {active === "brokerage" && <BrokerageView />}
            {active === "average" && <AverageView />}
            {active === "position" && <PositionView />}
            {active === "pl" && <PLView />}
            {active === "compare" && <CompareView />}
            {active === "fire" && <FireView />}
            {active === "goal" && <GoalView />}
            {active === "allocator" && <AllocatorView />}
            {active === "rebalance" && <RebalanceView />}
            {active === "swp" && <SwpView />}
            {active === "dca" && <DcaView />}
          </motion.div>
        </div>
      </main>
      <Footer />
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
function useCurrency() {
  const [ccy, setCcy] = useState<"INR" | "USD">("INR");
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

function SipView() {
  const { fmt, Toggle } = useCurrency();
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
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
          <Field label="Monthly investment"><NumInput value={monthly} step={500} onChange={setMonthly} /></Field>
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

function LumpsumView() {
  const { fmt, Toggle } = useCurrency();
  const [amount, setAmount] = useState(100000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const res = useMemo(() => lumpsum({ principal: amount, rate, years }), [amount, rate, years]);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
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
    </div>
  );
}

function CagrView() {
  const [start, setStart] = useState(250);
  const [end, setEnd] = useState(1320);
  const [years, setYears] = useState(8);
  const res = useMemo(() => cagr({ start, end, years }), [start, end, years]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-3">
        <Field label="Bought at"><NumInput value={start} step={0.5} onChange={setStart} /></Field>
        <Field label="Current price"><NumInput value={end} step={0.5} onChange={setEnd} /></Field>
        <Field label="Years held"><NumInput value={years} step={0.25} onChange={setYears} /></Field>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Card label="CAGR" value={`${res.cagr.toFixed(2)}%`} tone="primary" />
        <Card label="Multiplier" value={`${res.multiplier.toFixed(2)}x`} tone="up" />
      </div>
    </div>
  );
}

function DividendView() {
  const { fmt, Toggle } = useCurrency();
  const [shares, setShares] = useState(100);
  const [dps, setDps] = useState(15);
  const [price, setPrice] = useState(500);
  const res = useMemo(() => dividend({ shares, dps, priceForYield: price }), [shares, dps, price]);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
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
    </div>
  );
}

function BrokerageView() {
  const [market, setMarket] = useState<"IN" | "US">("IN");
  const brokers = market === "IN" ? BROKERS_IN : BROKERS_US;
  const [broker, setBroker] = useState<BrokerId>(brokers[0].id);
  const [tradeType, setTradeType] = useState<"delivery" | "intraday">("delivery");
  const [buy, setBuy] = useState(500);
  const [sell, setSell] = useState(550);
  const [qty, setQty] = useState(100);
  const res = useMemo(() => calcBrokerage({ broker, buyPrice: buy, sellPrice: sell, qty, tradeType, market }), [broker, buy, sell, qty, tradeType, market]);
  const fmt = (v: number) => market === "IN" ? `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
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
    </div>
  );
}

function AverageView() {
  const { fmt, Toggle } = useCurrency();
  const [lots, setLots] = useState([{ qty: 10, price: 400 }, { qty: 20, price: 350 }]);
  const res = useMemo(() => stockAverage(lots), [lots]);
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
    </div>
  );
}

function PositionView() {
  const { fmt, Toggle } = useCurrency();
  const [portfolio, setPortfolio] = useState(1_000_000);
  const [risk, setRisk] = useState(2);
  const [stop, setStop] = useState(5);
  const [entry, setEntry] = useState(500);
  const res = useMemo(() => positionSize({ portfolio, riskPct: risk, stopLossPct: stop, entryPrice: entry }), [portfolio, risk, stop, entry]);
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
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
    </div>
  );
}

function PLView() {
  const { fmt, Toggle } = useCurrency();
  const [buy, setBuy] = useState(500);
  const [sell, setSell] = useState(600);
  const [qty, setQty] = useState(100);
  const [tax, setTax] = useState(12.5);
  const res = useMemo(() => profitLoss({ buy, sell, qty, taxRate: tax }), [buy, sell, qty, tax]);
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
    </div>
  );
}

function CompareView() {
  const { fmt, Toggle } = useCurrency();
  const [amount, setAmount] = useState(100000);
  const [years, setYears] = useState(10);
  const [stockRate, setStockRate] = useState(15);
  const res = useMemo(() => compareAssets({ amount, years, stockCagr: stockRate }), [amount, years, stockRate]);
  const rows = [
    { name: "Stock", value: res.stock, color: "hsl(var(--primary))" },
    { name: "Nifty/SIP (12%)", value: res.nifty, color: "#f59e0b" },
    { name: "Gold (9%)", value: res.gold, color: "#eab308" },
    { name: "FD (7%)", value: res.fd, color: "#94a3b8" },
  ];
  return (
    <div>
      <div className="mb-3 flex justify-end"><Toggle /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
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

function FireView() {
  const { fmt, Toggle } = useCurrency();
  const [expense, setExpense] = useState(600000);
  const [rate, setRate] = useState(4);
  const res = useMemo(() => fire({ annualExpense: expense, withdrawalRate: rate }), [expense, rate]);
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
    </div>
  );
}

function GoalView() {
  const { fmt, Toggle } = useCurrency();
  const [goalName, setGoalName] = useState("Buy House");
  const [target, setTarget] = useState(20_000_000);
  const [years, setYears] = useState(15);
  const [rate, setRate] = useState(12);
  const res = useMemo(() => goalPlanner({ target, years, rate }), [target, years, rate]);
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

function RebalanceView() {
  const { fmt, Toggle } = useCurrency();
  const [portfolio, setPortfolio] = useState(1_000_000);
  const [rows, setRows] = useState([
    { asset: "Equity", current: 70, target: 60 },
    { asset: "Bonds", current: 15, target: 25 },
    { asset: "Gold", current: 10, target: 10 },
    { asset: "Cash", current: 5, target: 5 },
  ]);
  const cur = Object.fromEntries(rows.map((r) => [r.asset, r.current]));
  const tgt = Object.fromEntries(rows.map((r) => [r.asset, r.target]));
  const res = useMemo(() => rebalance(cur, tgt, portfolio), [portfolio, rows]);
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
    </div>
  );
}

function SwpView() {
  const { fmt, Toggle } = useCurrency();
  const [corpus, setCorpus] = useState(10_000_000);
  const [monthly, setMonthly] = useState(50000);
  const [rate, setRate] = useState(9);
  const res = useMemo(() => swp({ corpus, monthly, rate }), [corpus, monthly, rate]);
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
    </div>
  );
}

function DcaView() {
  const { fmt, Toggle } = useCurrency();
  const [purchases, setPurchases] = useState([
    { amount: 5000, price: 400 },
    { amount: 5000, price: 350 },
    { amount: 5000, price: 500 },
  ]);
  const res = useMemo(() => dca(purchases), [purchases]);
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
    </div>
  );
}
