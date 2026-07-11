import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { useCountry } from "@/lib/finflow/country-store";
import { COUNTRIES, type Country } from "@/lib/finflow/countries";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { FinFlowLogo } from "@/components/finflow/logo";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/calculators", label: "Calculators" },
  { to: "/news", label: "News" },
  { to: "/ai", label: "AI Assistant" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [country, setCountry] = useCountry();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-6">
      <div
        className={`mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-full border border-sheen glass pl-3 pr-2 sm:pl-5 sm:pr-3 transition-shadow ${scrolled ? "shadow-elegant" : "shadow-soft"}`}
      >
        <Link to="/" className="flex items-center" aria-label="FinFlow AI home">
          <FinFlowLogo className="h-8 w-auto text-foreground" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-full px-3.5 py-1.5 text-sm text-foreground bg-muted" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CountryPill country={country} onChange={setCountry} />
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="grid h-9 w-9 place-items-center rounded-full border transition hover:bg-muted"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" variant="default" className="rounded-full">Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="default" className="rounded-full">Sign in</Button>
            </Link>
          )}
          <button className="md:hidden grid h-9 w-9 place-items-center rounded-full border" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-2 rounded-3xl glass border-sheen md:hidden">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-xl px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function CountryPill({ country, onChange }: { country: Country; onChange: (c: Country) => void }) {
  const [open, setOpen] = useState(false);
  const c = COUNTRIES[country];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition hover:bg-muted"
      >
        <span aria-hidden>{c.flag}</span>
        <span className="hidden sm:inline">{c.currency}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border bg-popover p-1 shadow-elegant">
            {(Object.keys(COUNTRIES) as Country[]).map((k) => {
              const cc = COUNTRIES[k];
              return (
                <button
                  key={k}
                  onClick={() => { onChange(k); setOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition hover:bg-muted ${country === k ? "bg-muted" : ""}`}
                >
                  <span className="text-lg">{cc.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{cc.name}</div>
                    <div className="text-xs text-muted-foreground">{cc.currency} · {cc.symbol}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
