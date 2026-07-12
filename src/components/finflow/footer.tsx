import { Link } from "@tanstack/react-router";
import { FinFlowLogo } from "@/components/finflow/logo";
import { AlertTriangle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex items-start gap-3 rounded-2xl border border-sheen glass p-4 text-xs text-muted-foreground sm:text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            <strong className="text-foreground">Disclaimer:</strong> All calculators, AI responses, and news
            summaries on Calculyx AI are informational estimates only — not financial, tax, or legal advice.
            Rates and rules change; always verify details with the relevant bank or authority before making a
            financial decision.{" "}
            <Link to="/disclaimer" className="text-primary underline underline-offset-4">Read full disclaimer</Link>.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FinFlowLogo className="h-9 w-auto text-foreground" />
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Premium financial calculators and AI-powered insights for India, USA, and UAE.
            </p>
          </div>
          <FooterCol title="Product" links={[
            { to: "/calculators", label: "Calculators" },
            { to: "/ai", label: "AI Assistant" },
            { to: "/news", label: "News" },
            { to: "/dashboard", label: "Dashboard" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/about", label: "About Us" },
            { to: "/contact", label: "Contact" },
          ]} />
          <FooterCol title="Legal" links={[
            { to: "/privacy", label: "Privacy Policy" },
            { to: "/terms", label: "Terms & Conditions" },
            { to: "/disclaimer", label: "Disclaimer" },
            { to: "/cookies", label: "Cookie Policy" },
          ]} />
        </div>
        <div className="mt-10 flex flex-col justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Calculyx AI. All figures are estimates, not financial advice.</p>
          <p>Made By Sai Balaji{"\n"}.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
