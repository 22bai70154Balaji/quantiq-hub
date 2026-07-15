import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LineChart, Zap, FileDown, Sparkles, ArrowUpRight, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { Hero } from "@/components/finflow/hero";
import { CalculatorsGrid } from "@/components/finflow/calculators-grid";
import { NewsSection } from "@/components/finflow/news-section";
import { InteractiveChart } from "@/components/finflow/chart";
import { TrustAndTestimonials } from "@/components/finflow/testimonials";
import { StatusBar } from "@/components/finflow/status-bar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calculyx AI | AI Financial Intelligence Platform" },
      { name: "description", content: "AI-powered financial platform offering currency conversion, home loan calculators, tax calculators, investment planning, retirement planning, and AI-powered financial insights." },
      { property: "og:title", content: "Calculyx AI | AI Financial Intelligence Platform" },
      { property: "og:description", content: "AI-powered financial calculators and insights — currency, mortgage, tax, SIP, FD, retirement — for India, USA, and UAE." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://calculyxai.online/" },
      { property: "og:image", content: "https://calculyxai.online/og-image.jpg" },
      { name: "twitter:image", content: "https://calculyxai.online/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://calculyxai.online/" }],
  }),
  component: Index,
});

const UPDATES: Array<{
  tag: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  to: string;
  cta: string;
}> = [
  {
    tag: "New",
    title: "Live Stock Hub — India + US",
    desc: "Top-50 live prices for NSE and US markets with AI bull/bear cases, financial health scores, news, analyst ratings and earnings — all in one page.",
    icon: <LineChart className="h-5 w-5" />,
    to: "/stocks",
    cta: "Explore live stocks",
  },
  {
    tag: "New",
    title: "15 Investing Calculators, unified",
    desc: "SIP, Lumpsum, CAGR, Dividend, Brokerage (Zerodha · Groww · Robinhood · IBKR), FIRE, SWP, Goal Planner and more — with charts and live-data auto-fill.",
    icon: <TrendingUp className="h-5 w-5" />,
    to: "/investing-calculators",
    cta: "Open calculator hub",
  },
  {
    tag: "Power",
    title: "Analyze all 15 in one click",
    desc: "From any stock page, hit Analyze — every calculator runs against live price, CAGR and dividend yield and exports a combined PDF + multi-sheet Excel workbook.",
    icon: <Zap className="h-5 w-5" />,
    to: "/stocks",
    cta: "Try it on a stock",
  },
  {
    tag: "Export",
    title: "Live stock reports — PDF & Excel",
    desc: "Download a polished stock report with quick stats, health notes, news and earnings, or a multi-sheet workbook with price history — straight from the stock page.",
    icon: <FileDown className="h-5 w-5" />,
    to: "/stocks",
    cta: "Pick a stock to export",
  },
];

function Index() {
  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <WhatsNew />
        <CalculatorsGrid compact />
        <InteractiveChart />
        <NewsSection limit={3} />
        <TrustAndTestimonials />
      </main>
      <Footer />
      <StatusBar />
    </div>
  );
}

function WhatsNew() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
              What&apos;s new
              <span className="text-xs font-normal text-muted-foreground">· shipped this week</span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              The latest, <span className="font-serif italic text-gold">shipped</span> by Calculyx AI.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              A full stock intelligence hub, 15 unified investing calculators, one-click all-calculator analysis, and live PDF + Excel exports.
            </p>
          </div>
          <Link
            to="/stocks"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium hover:bg-white/[0.06]"
          >
            See it in action <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {UPDATES.map((u, i) => (
            <motion.div
              key={u.title}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-primary/30 hover:bg-white/[0.04]"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/20" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  {u.icon}
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                    {u.tag}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">{u.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{u.desc}</p>
                  <Link
                    to={u.to}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {u.cta} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

