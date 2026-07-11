import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { BreakdownTable } from "@/lib/finflow/analysis/types";

export function BreakdownTableView({ table }: { table: BreakdownTable }) {
  const [mode, setMode] = useState<"monthly" | "yearly">(table.yearlyRows?.length ? "yearly" : "monthly");
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const src = mode === "yearly" && table.yearlyRows?.length ? table.yearlyRows : table.rows;
    return open ? src : src.slice(0, 12);
  }, [mode, table, open]);

  const totalRows = (mode === "yearly" && table.yearlyRows?.length ? table.yearlyRows.length : table.rows.length);

  return (
    <div className="rounded-2xl border border-sheen glass shadow-soft overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
        <div>
          <div className="font-display text-base font-semibold tracking-tight">Detailed breakdown</div>
          <div className="text-xs text-muted-foreground">{totalRows} rows · scroll horizontally on mobile</div>
        </div>
        {table.yearlyRows?.length ? (
          <div className="inline-flex rounded-full border bg-card/60 p-1 text-xs">
            {(["monthly", "yearly"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1 capitalize transition ${mode === m ? "bg-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              {table.columns.map((c) => (
                <th key={c.key} className={`px-4 py-2.5 font-medium ${c.align === "right" ? "text-right" : ""}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border/50 hover:bg-muted/20">
                {table.columns.map((c) => (
                  <td key={c.key} className={`px-4 py-2.5 tabular-nums ${c.align === "right" ? "text-right" : ""}`}>
                    {String(r[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalRows > 12 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full border-t border-border/60 bg-muted/20 py-3 text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1"
        >
          {open ? "Show less" : `Show all ${totalRows} rows`}
          <ChevronRight className={`h-4 w-4 transition ${open ? "rotate-90" : ""}`} />
        </button>
      )}
    </div>
  );
}
