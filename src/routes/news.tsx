import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { NewsSection } from "@/components/finflow/news-section";
import { useState } from "react";
import { useCountry } from "@/lib/finflow/country-store";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Financial News — FinFlow AI" },
      { name: "description", content: "AI-summarised daily financial news for India, USA, and UAE." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const [country] = useCountry();
  const initial = country === "IN" ? "India" : country === "US" ? "USA" : country === "AE" ? "UAE" : "Global";
  const [region, setRegion] = useState<"India" | "USA" | "UAE" | "Global">(initial as "India" | "USA" | "UAE" | "Global");

  return (
    <>
      <Navbar />
      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-6 pt-8">
          <div className="text-sm font-medium text-primary">Daily digest</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">Financial news</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">AI-summarised, region-filtered, refreshed regularly.</p>
          <div className="mt-6 inline-flex rounded-full border bg-card p-1">
            {(["Global", "India", "USA", "UAE"] as const).map((r) => (
              <button key={r} onClick={() => setRegion(r)}
                className={`rounded-full px-4 py-1.5 text-sm transition ${region === r ? "bg-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:text-foreground"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <NewsSection region={region} />
      </main>
      <Footer />
    </>
  );
}
