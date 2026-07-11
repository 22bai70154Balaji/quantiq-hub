import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { Sparkles, Calculator, Newspaper, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Calculyx AI" },
      { name: "description", content: "Calculyx AI is a premium suite of financial calculators and AI insights built for India, USA, and UAE." },
      { property: "og:title", content: "About — Calculyx AI" },
      { property: "og:description", content: "Premium financial calculators and AI insights for India, USA, and UAE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24">
        <article className="mx-auto max-w-4xl px-6 py-12">
          <div className="text-sm font-medium text-primary">About Calculyx AI</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            Money math, made <span className="font-serif italic text-gold">effortless.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Calculyx AI is a premium suite of financial calculators and AI-powered insights, hand-tuned for
            three of the world's most active personal-finance markets — <strong>India</strong>,
            the <strong>USA</strong>, and the <strong>UAE</strong>.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <Feature icon={<Calculator className="h-5 w-5" />} title="12 precise calculators" body="EMI, SIP, mortgage, currency, property, tax — country-aware math with clean, readable outputs." />
            <Feature icon={<Sparkles className="h-5 w-5" />} title="AI you can question" body="Ask follow-ups, compare scenarios, and get plain-English explanations of your numbers." />
            <Feature icon={<Newspaper className="h-5 w-5" />} title="Live financial digest" body="Region-filtered market summaries refreshed automatically every 10 minutes." />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Privacy-first" body="Inputs stay in your browser wherever possible. No ad trackers. Ever." />
          </div>

          <h2 className="mt-16 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Our promise</h2>
          <p className="mt-3 text-[15px] leading-7 text-foreground/90">
            We build tools that respect your time and your intelligence. Numbers should feel precise. Interfaces
            should feel calm. And nothing on this site pretends to be advice it isn't — every calculator, chart,
            and AI reply is <em>informational</em>. Please confirm figures with your bank or a qualified advisor
            before you commit to a financial decision. See our{" "}
            <Link to="/disclaimer" className="text-primary underline underline-offset-4">disclaimer</Link>.
          </p>

          <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Who's behind it</h2>
          <p className="mt-3 text-[15px] leading-7 text-foreground/90">
            Calculyx AI is a solo-built product. Feedback, feature requests, and bug reports go to a single
            inbox — mine. If something feels off, tell me:{" "}
            <a href="mailto:saibalajijee@gmail.com" className="text-primary underline underline-offset-4">saibalajijee@gmail.com</a>.
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link to="/calculators" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-90">
              Try the calculators
            </Link>
            <Link to="/contact" className="rounded-full border border-sheen glass px-5 py-2.5 text-sm font-medium hover:bg-muted">
              Contact us
            </Link>
          </div>
        </article>
        <Footer />
      </main>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-sheen glass p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
          {icon}
        </div>
        <div className="font-display text-lg font-semibold tracking-tight">{title}</div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
