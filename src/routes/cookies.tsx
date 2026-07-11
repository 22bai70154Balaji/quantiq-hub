import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — FinFlow AI" },
      { name: "description", content: "How FinFlow AI uses cookies and local storage to keep you signed in and remember your preferences." },
      { property: "og:title", content: "Cookie Policy — FinFlow AI" },
      { property: "og:description", content: "Strictly necessary cookies only — no ad trackers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24">
        <article className="mx-auto max-w-3xl px-6 py-12">
          <div className="text-sm font-medium text-primary">Legal</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Cookie <span className="font-serif italic text-gold">Policy</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: July 10, 2026</p>

          <div className="prose prose-slate mt-8 max-w-none text-[15px] leading-7 text-foreground/90 [&>h2]:mt-10 [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-semibold [&>p]:mt-3 [&>ul]:mt-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mt-1">
            <p>
              FinFlow AI uses a small number of cookies and browser storage entries so the app can work. We do
              not use third-party advertising trackers or cross-site marketing pixels.
            </p>

            <h2>What we store</h2>
            <ul>
              <li><strong>Authentication:</strong> a session token so you stay signed in on this device.</li>
              <li><strong>Preferences:</strong> your selected country, currency, and light/dark theme.</li>
              <li><strong>Calculator inputs (local only):</strong> some calculators cache the last values you entered in your browser's local storage to make repeat use faster. These never leave your device unless you explicitly save a report.</li>
              <li><strong>Diagnostics:</strong> anonymous performance signals used to keep the app fast and error-free.</li>
            </ul>

            <h2>What we do NOT use</h2>
            <ul>
              <li>Third-party advertising cookies.</li>
              <li>Cross-site tracking pixels.</li>
              <li>Social-network re-marketing tags.</li>
            </ul>

            <h2>Managing cookies</h2>
            <p>
              You can clear cookies and local storage for this site from your browser's privacy settings at any
              time. Signing out from the app also invalidates your session token. Note that clearing storage
              will sign you out and reset your saved preferences.
            </p>

            <h2>Changes</h2>
            <p>
              If we add analytics or third-party integrations in the future, we will update this page before
              enabling them.
            </p>

            <h2>Contact</h2>
            <p>
              Email{" "}
              <a href="mailto:saibalajijee@gmail.com" className="text-primary underline underline-offset-4">saibalajijee@gmail.com</a>{" "}
              with any cookie-related questions.
            </p>
          </div>
        </article>
        <Footer />
      </main>
    </div>
  );
}
