import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — FinFlow AI" },
      { name: "description", content: "How FinFlow AI collects, uses, and protects your data across our financial calculators and AI tools." },
      { property: "og:title", content: "Privacy Policy — FinFlow AI" },
      { property: "og:description", content: "How FinFlow AI collects, uses, and protects your data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24">
        <article className="mx-auto max-w-3xl px-6 py-12">
          <div className="text-sm font-medium text-primary">Legal</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Privacy <span className="font-serif italic text-gold">Policy</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: July 10, 2026</p>

          <div className="prose prose-slate mt-8 max-w-none text-[15px] leading-7 text-foreground/90 [&>h2]:mt-10 [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-semibold [&>p]:mt-3 [&>ul]:mt-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mt-1">
            <p>
              This page explains what information FinFlow AI ("we", "us") collects, how we use it, and the choices
              you have. This page is maintained by the FinFlow AI team and is not an independent legal certification.
            </p>

            <h2>Information we collect</h2>
            <ul>
              <li><strong>Account data:</strong> email, name, and authentication identifiers when you sign up.</li>
              <li><strong>Usage data:</strong> which calculators you open, inputs you enter to compute results (kept on your device unless you save them), and basic device/browser diagnostics.</li>
              <li><strong>Content you submit:</strong> messages you send via our Contact form or AI assistant.</li>
            </ul>

            <h2>How we use your data</h2>
            <ul>
              <li>To operate calculators, save your preferences, and personalize results.</li>
              <li>To provide the AI assistant and generate PDFs / reports you request.</li>
              <li>To respond to support requests you send us.</li>
              <li>To detect abuse and keep the service secure.</li>
            </ul>

            <h2>Data storage & security</h2>
            <p>
              Account data is stored with our managed backend provider under industry-standard encryption in
              transit (TLS) and at rest. Access to production data is limited to the app owner. Calculator inputs
              are processed in your browser wherever possible; only data you explicitly save is persisted.
            </p>

            <h2>AI processing</h2>
            <p>
              When you use the AI assistant, your prompts are sent to our AI gateway for inference. We do not use
              your prompts to train third-party models. Do not submit sensitive personal or financial identifiers
              (e.g. full account numbers, government IDs) into the assistant.
            </p>

            <h2>Cookies</h2>
            <p>
              We use only strictly necessary cookies for authentication and app preferences (such as your selected
              country). We do not run third-party advertising trackers.
            </p>

            <h2>Your rights</h2>
            <p>
              You can request access, correction, or deletion of your account data at any time by contacting us at{" "}
              <a href="mailto:saibalajijee@gmail.com" className="text-primary underline underline-offset-4">saibalajijee@gmail.com</a>.
            </p>

            <h2>Financial disclaimer</h2>
            <p>
              FinFlow AI provides estimates and educational tools only. Nothing on this site constitutes financial,
              legal, or tax advice. Always consult a qualified advisor before making financial decisions.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this policy as the product evolves. Material changes will be reflected on this page
              with a new "Last updated" date.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about privacy? Email{" "}
              <a href="mailto:saibalajijee@gmail.com" className="text-primary underline underline-offset-4">saibalajijee@gmail.com</a>.
            </p>
          </div>
        </article>
        <Footer />
      </main>
    </div>
  );
}
