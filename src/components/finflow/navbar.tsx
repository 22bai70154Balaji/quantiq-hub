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
  { to: "/stocks", label: "Stocks" },
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
    <header className="fixed inset-x-0 top-4 z-50 px-3 sm:px-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className={`mx-auto flex h-13 max-w-5xl items-center justify-between gap-2 rounded-full border border-white/10 glass pl-4 pr-2 sm:pl-5 sm:pr-3 transition-all duration-500 ${scrolled ? "shadow-elegant py-1.5" : "py-2"}`}
      >
        <Link to="/" className="flex items-center gap-2.5" aria-label="Calculyx AI home">
          <FinFlowLogo className="h-7 w-auto text-foreground" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-[13px] font-medium text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <CountryPill country={country} onChange={setCountry} />
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="h-8 rounded-full px-4 text-[13px] font-semibold bg-foreground text-background hover:bg-foreground/90">Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="h-8 rounded-full px-4 text-[13px] font-semibold bg-foreground text-background hover:bg-foreground/90">Get Started</Button>
            </Link>
          )}
          <button className="md:hidden grid h-8 w-8 place-items-center rounded-full border border-white/10" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      {open && (
        <div className="mt-2 rounded-3xl glass md:hidden">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-xl px-3 py-2 text-sm hover:bg-white/5" onClick={() => setOpen(false)}>
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
        className="flex items-center gap-1.5 rounded-full h-8 px-2.5 text-[12.5px] text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
      >
        <span aria-hidden>{c.flag}</span>
        <span className="hidden sm:inline font-mono tracking-wider">{c.currency}</span>
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
