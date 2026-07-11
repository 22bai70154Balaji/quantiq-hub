import { motion } from "framer-motion";
import type { Kpi } from "@/lib/finflow/analysis/types";

const toneClass: Record<NonNullable<Kpi["tone"]>, string> = {
  primary: "text-gradient",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  neutral: "text-foreground",
};

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {kpis.map((k, i) => (
        <motion.div
          key={`${k.label}-${i}`}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
          className="min-w-0 rounded-2xl border border-sheen glass p-5 shadow-soft"
        >
          <div className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{k.label}</div>
          <div className={`mt-1.5 font-mono text-2xl font-semibold leading-tight tracking-tight tabular-nums break-words sm:text-3xl ${k.tone ? toneClass[k.tone] : ""}`}>
            {k.value}
          </div>
          {k.sub && <div className="mt-1 truncate text-xs text-muted-foreground">{k.sub}</div>}
        </motion.div>
      ))}
    </div>
  );
}
