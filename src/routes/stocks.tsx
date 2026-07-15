import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, RefreshCw, TrendingUp, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { listTopStocks, type StockQuote, META_BY_SYMBOL } from "@/lib/finflow/stocks.functions";

export const Route = createFileRoute("/stocks")({
  head: () => ({
    meta: [
      { title: "Top 50 Live Stocks — India, US & Global | Calculyx AI" },
      { name: "description", content: "Live top-50 stock prices for Indian (Nifty 50), US, and Global markets. Click any stock for a full AI-powered analysis and investment calculators." },
      { property: "og:title", content: "Top 50 Live Stocks — Calculyx AI" },
      { property: "og:description", content: "Real-time quotes for Nifty 50, US large-caps and a Global blend — plus AI analysis and calculators per stock." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://calculyxai.online/stocks" },
      { property: "og:image", content: "https://calculyxai.online/og-image.jpg" },
      { name: "twitter:image", content: "https://calculyxai.online/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://calculyxai.online/stocks" }],
  }),
  component: StocksPage,
});

function StocksPage() {
  const [market, setMarket] = useState<"IN" | "US" | "GLOBAL">("IN");
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["top-stocks", market],
    queryFn: () => listTopStocks({ data: { market } }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const stocks = useMemo(() => {
    const data = query.data ?? [];
    if (!q.trim()) return data;
    const t = q.toLowerCase();
    return data.filter((s) => s.symbol.toLowerCase().includes(t) || s.name.toLowerCase().includes(t));
  }, [query.data, q]);

  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <TrendingUp className="h-4 w-4" /> Live market
          </div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            Top 50 live <span className="font-serif italic text-gold">stocks</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Real-time quotes across India (Nifty 50), the US large-caps, and a Global blend. Click any stock for a full analysis — AI bull/bear, financial health, news, earnings, and 7 embedded calculators.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border bg-card/70 backdrop-blur p-1 shadow-soft">
              {(["IN", "US", "GLOBAL"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setMarket(r)}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${market === r ? "bg-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {r === "IN" ? "🇮🇳 India 50" : r === "US" ? "🇺🇸 US 50" : "🌍 Global 50"}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search symbol or name…"
                className="h-10 w-full rounded-full border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm hover:bg-white/[0.06] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Auto-refresh · 60s
            </span>
          </div>

          {query.isLoading && (
            <div className="mt-10 text-center text-sm text-muted-foreground">Loading live quotes…</div>
          )}
          {query.isError && (
            <div className="mt-10 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              Failed to load live quotes. Please try again.
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stocks.map((s, i) => (
              <StockCard key={s.symbol} stock={s} index={i} />
            ))}
          </div>

          {!query.isLoading && stocks.length === 0 && (
            <div className="mt-10 text-center text-sm text-muted-foreground">No stocks match your filters.</div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StockCard({ stock, index }: { stock: StockQuote; index: number }) {
  const meta = META_BY_SYMBOL[stock.symbol];
  const assumedReturn = meta?.assumedReturn ?? 12;
  const up = stock.change >= 0;
  const fmt = (v: number) =>
    stock.currency === "INR"
      ? `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
      : `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.4) }}
      className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
    >
      <Link to="/stocks/$symbol" params={{ symbol: stock.symbol }} className="absolute inset-0 z-0" aria-label={`Open ${stock.name} details`} />
      <div className="relative z-10 pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <StockLogo symbol={stock.symbol} name={stock.name} />
            <div className="min-w-0">
              <div className="font-mono text-xs font-semibold tracking-wider text-muted-foreground">
                {stock.region === "US" ? "🇺🇸" : "🇮🇳"} {stock.symbol}
              </div>
              <div className="mt-1 truncate font-display text-lg font-semibold tracking-tight">{stock.name}</div>
            </div>
          </div>
          <div
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            }`}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {stock.changePercent.toFixed(2)}%
          </div>
        </div>

        <div className="mt-4 font-mono text-2xl font-semibold tabular-nums">{fmt(stock.price)}</div>
        <div className={`font-mono text-xs tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
          {up ? "+" : ""}
          {fmt(stock.change)} today
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <MiniStat label="Open" value={fmt(stock.open)} />
          <MiniStat label="Prev close" value={fmt(stock.prevClose)} />
          <MiniStat label="Day high" value={fmt(stock.high)} />
          <MiniStat label="Day low" value={fmt(stock.low)} />
        </div>

        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Assumed long-run return
          </div>
          <div className="mt-0.5 font-mono text-sm font-semibold text-primary">{assumedReturn}% p.a.</div>
        </div>
      </div>

      <div className="relative z-20 mt-3 flex gap-2">
        <Link
          to="/stocks/$symbol"
          params={{ symbol: stock.symbol }}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-foreground/90"
        >
          View analysis <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/calc/$type"
          params={{ type: "sip" }}
          search={{ symbol: stock.symbol, rate: assumedReturn } as never}
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium hover:bg-white/[0.06]"
          title="Use in SIP calculator"
        >
          SIP
        </Link>
      </div>
    </motion.div>
  );
}



// Domain map — Logo.dev's /ticker/ index skips most .NS/.BO listings, so we
// fall back to the company's primary domain for Indian tickers.
const LOGO_DOMAIN_BY_SYMBOL: Record<string, string> = {
  "RELIANCE.NS": "ril.com",
  "TCS.NS": "tcs.com",
  "INFY.NS": "infosys.com",
  "HDFCBANK.NS": "hdfcbank.com",
  "ICICIBANK.NS": "icicibank.com",
  "BHARTIARTL.NS": "airtel.in",
  "SBIN.NS": "sbi.co.in",
  "TATAMOTORS.NS": "tatamotors.com",
};

function StockLogo({ symbol, name }: { symbol: string; name: string }) {
  const token = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as string | undefined;
  const [stage, setStage] = useState<"primary" | "fallback" | "initials">("primary");
  const ticker = symbol.replace(/\.(NS|BO)$/i, "");
  const isIndian = /\.(NS|BO)$/i.test(symbol);
  const domain = LOGO_DOMAIN_BY_SYMBOL[symbol.toUpperCase()];
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // For Indian tickers, try domain first, then ticker. For US, ticker first, then domain (none).
  const primary = isIndian && domain
    ? `https://img.logo.dev/${domain}?token=${token}&size=80&format=png&fallback=404`
    : `https://img.logo.dev/ticker/${encodeURIComponent(ticker)}?token=${token}&size=80&format=png&fallback=404`;
  const fallback = isIndian && domain
    ? `https://img.logo.dev/ticker/${encodeURIComponent(ticker)}?token=${token}&size=80&format=png&fallback=404`
    : domain
      ? `https://img.logo.dev/${domain}?token=${token}&size=80&format=png&fallback=404`
      : null;

  if (!token || stage === "initials") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-mono text-xs font-semibold text-foreground/80">
        {initials || ticker.slice(0, 2)}
      </div>
    );
  }

  const src = stage === "primary" ? primary : (fallback ?? primary);

  return (
    <img
      key={src}
      src={src}
      alt={`${name} logo`}
      width={40}
      height={40}
      loading="lazy"
      onError={() => setStage((s) => (s === "primary" && fallback ? "fallback" : "initials"))}
      className="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-white object-contain p-0.5"
    />
  );
}



function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-xs tabular-nums text-foreground/90">{value}</div>
    </div>
  );
}
