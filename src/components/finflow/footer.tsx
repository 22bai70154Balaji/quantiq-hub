import { Link } from "@tanstack/react-router";
import { FinFlowLogo } from "@/components/finflow/logo";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
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
          <FooterCol title="Calculators" links={[
            { to: "/calc/currency", label: "Currency" },
            { to: "/calc/mortgage", label: "Mortgage" },
            { to: "/calc/sip", label: "SIP" },
            { to: "/calc/property", label: "Property" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/", label: "About" },
            { to: "/", label: "Privacy" },
            { to: "/", label: "Terms" },
            { to: "/", label: "Contact" },
          ]} />
        </div>
        <div className="mt-10 flex flex-col justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} FinFlow AI. All figures are estimates, not financial advice.</p>
          <p>Made with precision.</p>
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
