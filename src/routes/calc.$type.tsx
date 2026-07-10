import { createFileRoute, notFound } from "@tanstack/react-router";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { CALC_BY_SLUG, type CalcSlug } from "@/lib/finflow/registry";
import { CurrencyCalc } from "@/components/finflow/calcs/currency-calc";
import { EmiCalc } from "@/components/finflow/calcs/emi-calc";
import { SipCalc } from "@/components/finflow/calcs/sip-calc";
import { SimpleCalc } from "@/components/finflow/calcs/simple-calc";
import { PropertyCalc } from "@/components/finflow/calcs/property-calc";
import { HomeLoanEngine } from "@/components/finflow/calcs/home-loan-engine";

const VALID: CalcSlug[] = ["currency", "mortgage", "home-loan", "income-tax", "gst", "salary", "sip", "fd", "compound-interest", "inflation", "retirement", "property"];

export const Route = createFileRoute("/calc/$type")({
  beforeLoad: ({ params }) => {
    if (!VALID.includes(params.type as CalcSlug)) throw notFound();
  },
  head: ({ params }) => {
    const meta = CALC_BY_SLUG[params.type as CalcSlug];
    return {
      meta: [
        { title: `${meta?.name ?? "Calculator"} — FinFlow AI` },
        { name: "description", content: meta?.tagline ?? "Financial calculator" },
      ],
    };
  },
  component: CalcPage,
});

function CalcPage() {
  const { type } = Route.useParams();
  const slug = type as CalcSlug;
  return (
    <>
      <Navbar />
      <main>
        {slug === "currency" && <CurrencyCalc />}
        {slug === "mortgage" && <EmiCalc slug="mortgage" defaultRate={6.8} defaultYears={30} defaultPrincipal={400000} />}
        {slug === "home-loan" && <HomeLoanEngine />}
        {slug === "sip" && <SipCalc />}
        {slug === "property" && <PropertyCalc />}
        {["fd", "compound-interest", "inflation", "retirement", "gst", "income-tax", "salary"].includes(slug) && <SimpleCalc slug={slug} />}
      </main>
      <Footer />
    </>
  );
}
