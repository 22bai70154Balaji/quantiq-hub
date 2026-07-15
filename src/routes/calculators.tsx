import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, LineChart } from "lucide-react";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { CalculatorsGrid } from "@/components/finflow/calculators-grid";

export const Route = createFileRoute("/calculators")({
  head: () => ({
    meta: [
      { title: "All Financial Calculators — Calculyxai" },
      { name: "description", content: "Browse Calculyxai's 12 financial calculators — currency, mortgage, home loan, SIP, FD, tax, GST, salary, property, retirement, inflation, and compound interest." },
      { property: "og:title", content: "All Financial Calculators — Calculyxai" },
      { property: "og:description", content: "Precision calculators for currency, loans, taxes, investments, and real estate across India, USA, and UAE." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://calculyxai.online/calculators" },
      { property: "og:image", content: "https://calculyxai.online/og-image.jpg" },
      { name: "twitter:image", content: "https://calculyxai.online/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://calculyxai.online/calculators" }],
  }),
  component: () => (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-6 pt-12 text-center">
          <div className="text-sm font-medium text-primary">Full library</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            All <span className="font-serif italic text-gold">calculators</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Pick a calculator to run precise, country-aware financial math. Every result is an estimate — verify with your bank before deciding.
          </p>
          <Link to="/investing-calculators" className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20">
            <LineChart className="h-4 w-4" /> Explore 15 investing calculators (SIP, CAGR, Brokerage, FIRE, SWP…) <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <CalculatorsGrid />
      </main>
      <Footer />
    </div>
  ),
});
