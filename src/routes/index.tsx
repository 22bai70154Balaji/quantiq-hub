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
      { title: "Calculyxai — Financial Calculators & AI Insights for India, USA & UAE" },
      { name: "description", content: "12 precision financial calculators for currency, mortgage, SIP, tax, and property — with an AI assistant tuned for India, the USA, and the UAE." },
      { property: "og:title", content: "Calculyxai — Financial Calculators & AI Insights" },
      { property: "og:description", content: "Precision calculators plus an AI assistant for India, the USA, and the UAE." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://calculyxai.online/" },
      { property: "og:image", content: "https://calculyxai.online/og-image.jpg" },
      { name: "twitter:image", content: "https://calculyxai.online/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://calculyxai.online/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <CalculatorsGrid compact />
        <InteractiveChart />
        <NewsSection limit={3} />
        <TrustAndTestimonials />
      </main>
      <Footer />
    </div>
  );
}
