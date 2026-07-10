import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — FinFlow AI" },
      { name: "description", content: "The terms governing your use of FinFlow AI calculators, AI assistant, and related tools." },
      { property: "og:title", content: "Terms of Service — FinFlow AI" },
      { property: "og:description", content: "The terms governing your use of FinFlow AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24">
        <article className="mx-auto max-w-3xl px-6 py-12">
          <div className="text-sm font-medium text-primary">Legal</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Terms of Service</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: July 10, 2026</p>

          <div className="prose prose-slate mt-8 max-w-none text-[15px] leading-7 text-foreground/90 [&>h2]:mt-10 [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-semibold [&>p]:mt-3 [&>ul]:mt-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mt-1">
            <p>
              By accessing or using FinFlow AI ("the service"), you agree to these Terms. If you do not agree,
              please do not use the service.
            </p>

            <h2>Use of the service</h2>
            <ul>
              <li>You must be at least 18 years old, or have your legal guardian's consent.</li>
              <li>You are responsible for any activity performed under your account.</li>
              <li>You will not attempt to reverse engineer, disrupt, or abuse the service, its AI models, or its infrastructure.</li>
            </ul>

            <h2>Financial disclaimer</h2>
            <p>
              All calculators, AI outputs, news summaries, and reports are provided <strong>for informational and
              educational purposes only</strong>. They are estimates, not financial, tax, legal, or investment
              advice. Interest rates, currencies, market data and regulations change frequently — always verify
              figures with your bank or a qualified advisor before making decisions.
            </p>

            <h2>AI assistant</h2>
            <p>
              The AI assistant can make mistakes. It may present inaccurate or outdated information. Do not rely
              on it for regulated decisions (medical, legal, tax, immigration, etc.). Do not submit sensitive
              personal identifiers in your prompts.
            </p>

            <h2>Third-party data</h2>
            <p>
              News feeds, exchange rates, and reference data are sourced from third-party providers. We do not
              guarantee accuracy, completeness, or timeliness of that data.
            </p>

            <h2>Availability</h2>
            <p>
              The service is provided "as is" and "as available", without warranties of any kind. We may modify,
              suspend, or discontinue features at any time.
            </p>

            <h2>Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, FinFlow AI and its contributors will not be liable for any
              indirect, incidental, or consequential damages, or for financial losses arising from decisions you
              make based on the service.
            </p>

            <h2>Intellectual property</h2>
            <p>
              The FinFlow AI brand, interface, and content are owned by us. You keep ownership of any data or
              content you submit, and you grant us the limited right to process it to operate the service on
              your behalf.
            </p>

            <h2>Termination</h2>
            <p>
              We may suspend or terminate access if you violate these Terms or misuse the service.
            </p>

            <h2>Changes to these terms</h2>
            <p>
              We may revise these Terms as the service evolves. Continued use after changes take effect
              constitutes acceptance of the revised Terms.
            </p>

            <h2>Contact</h2>
            <p>
              Questions? Email{" "}
              <a href="mailto:saibalajijee@gmail.com" className="text-primary underline underline-offset-4">saibalajijee@gmail.com</a>.
            </p>
          </div>
        </article>
        <Footer />
      </main>
    </div>
  );
}
