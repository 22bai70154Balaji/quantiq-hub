import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { Hero } from "@/components/finflow/hero";
import { CalculatorsGrid } from "@/components/finflow/calculators-grid";
import { NewsSection } from "@/components/finflow/news-section";
import { InteractiveChart } from "@/components/finflow/chart";
import { TrustAndTestimonials } from "@/components/finflow/testimonials";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinFlow AI — Premium Financial Calculators & AI Insights" },
      { name: "description", content: "12 professional calculators for mortgage, SIP, tax, and currency across India, USA, and UAE — powered by AI." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CalculatorsGrid compact />
        <InteractiveChart />
        <NewsSection limit={3} />
        <TrustAndTestimonials />
      </main>
      <Footer />
    </>
  );
}
