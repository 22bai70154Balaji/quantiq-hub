import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — FinFlow AI" },
      { name: "description", content: "FinFlow AI calculators, AI responses, and news summaries are informational only — not financial advice." },
      { property: "og:title", content: "Disclaimer — FinFlow AI" },
      { property: "og:description", content: "Informational only — not financial, tax, legal, or investment advice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24">
        <article className="mx-auto max-w-3xl px-6 py-12">
          <div className="text-sm font-medium text-primary">Legal</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Financial <span className="font-serif italic text-gold">Disclaimer</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: July 10, 2026</p>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-sheen glass p-5 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <p>
              All calculators, AI-generated responses, news summaries, and reports on FinFlow AI are provided
              for <strong>informational and educational purposes only</strong>. They are estimates — not
              financial, tax, legal, or investment advice.
            </p>
          </div>

          <div className="prose prose-slate mt-8 max-w-none text-[15px] leading-7 text-foreground/90 [&>h2]:mt-10 [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-semibold [&>p]:mt-3 [&>ul]:mt-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mt-1">
            <h2>Estimates only</h2>
            <p>
              Every number produced by our calculators (EMI, SIP, tax, mortgage, currency conversion, property
              cost, etc.) is a mathematical estimate based on the inputs you provide. Real-world figures can
              differ because of bank fees, processing charges, tax slab changes, insurance, statutory levies,
              FX spreads, and other factors we don't model.
            </p>

            <h2>Information may change</h2>
            <p>
              Interest rates, exchange rates, tax rules, regulatory limits, and market data change frequently
              and may be outdated by the time you read them. We do not guarantee the accuracy, completeness,
              or timeliness of any data displayed on the site.
            </p>

            <h2>Always verify before deciding</h2>
            <p>
              Before making any financial decision — signing a loan, investing, remitting money abroad, buying
              property, or filing taxes — please confirm details directly with the relevant bank, brokerage,
              tax authority, or a licensed advisor in your jurisdiction.
            </p>

            <h2>AI outputs are not advice</h2>
            <p>
              The FinFlow AI assistant uses large language models. Its answers can be incomplete, outdated, or
              factually wrong. Treat them as a starting point for research, not as a final answer.
            </p>

            <h2>No fiduciary relationship</h2>
            <p>
              Using FinFlow AI does not create a client, fiduciary, or advisory relationship between you and
              us. We are not a bank, broker, RIA, IFA, tax preparer, or law firm.
            </p>

            <h2>Third-party links</h2>
            <p>
              Where we link to banks, exchanges, or other websites, we are not responsible for their content,
              pricing, or terms.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about this disclaimer? Email{" "}
              <a href="mailto:saibalajijee@gmail.com" className="text-primary underline underline-offset-4">saibalajijee@gmail.com</a>.
            </p>
          </div>
        </article>
        <Footer />
      </main>
    </div>
  );
}
