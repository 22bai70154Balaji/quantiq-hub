import { createFileRoute } from "@tanstack/react-router";
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
      <StatusBar />
    </div>
  );
}
