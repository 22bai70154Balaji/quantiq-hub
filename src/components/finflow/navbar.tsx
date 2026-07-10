import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Moon, Sun, Sparkles, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { useCountry } from "@/lib/finflow/country-store";
import { COUNTRIES, type Country } from "@/lib/finflow/countries";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

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
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "glass border-b" : ""}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-elegant">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">FinFlow<span className="text-primary">.ai</span></span>
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
        <div className="glass border-t md:hidden">
          <div className="mx-auto max-w-7xl px-6 py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.header>
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
