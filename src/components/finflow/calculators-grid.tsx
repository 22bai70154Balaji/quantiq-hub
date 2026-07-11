import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { CALCULATORS } from "@/lib/finflow/registry";

export function CalculatorsGrid({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return CALCULATORS;
    return CALCULATORS.filter((c) =>
      c.name.toLowerCase().includes(s) || c.tagline.toLowerCase().includes(s) || c.category.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <div className="text-sm font-medium text-primary">Calculators</div>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Every financial answer,<br />in one search.
          </h2>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search calculators…"
            className="h-11 w-full rounded-full border bg-card pl-9 pr-4 text-sm shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.slice(0, compact ? 8 : filtered.length).map((c, idx) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.slug}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.03, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to="/calc/$type" params={{ type: c.slug }} className="group block">
                <div className="relative h-full overflow-hidden rounded-2xl border bg-card p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant">
                  <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${c.accent} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20`} />
                  <div className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${c.accent} text-white shadow-elegant ring-1 ring-white/15 transition-transform duration-500 group-hover:scale-[1.06] group-hover:rotate-[-2deg]`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="relative mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{c.category}</div>
                  <h3 className="relative mt-1.5 font-display text-[1.35rem] font-semibold leading-tight tracking-[-0.02em]">{c.name}</h3>
                  <p className="relative mt-2 text-[13.5px] leading-relaxed text-muted-foreground line-clamp-2">{c.tagline}</p>
                  <div className="relative mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {compact && (
        <div className="mt-8 text-center">
          <Link to="/calculators" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all 12 calculators <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
