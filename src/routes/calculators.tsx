import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { CalculatorsGrid } from "@/components/finflow/calculators-grid";

export const Route = createFileRoute("/calculators")({
  head: () => ({
    meta: [
      { title: "All Calculators — FinFlow AI" },
      { name: "description", content: "Browse 12 financial calculators for currency, loans, taxes, investments, and real estate." },
    ],
  }),
  component: () => (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="mx-auto max-w-7xl px-6 pt-16 text-center">
          <div className="text-sm font-medium text-primary">Full library</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">All calculators</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Pick a calculator to run precise, country-aware financial math.</p>
        </div>
        <CalculatorsGrid />
      </main>
      <Footer />
    </>
  ),
});
