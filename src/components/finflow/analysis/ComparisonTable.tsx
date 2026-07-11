import type { ComparisonBlock } from "@/lib/finflow/analysis/types";

export function ComparisonTable({ block }: { block: ComparisonBlock }) {
  const highlightIndex = (row: ComparisonBlock["rows"][number]): number | null => {
    if (!row.highlight || !row.numericValues?.length) return null;
    const values = row.numericValues;
    if (row.highlight === "min") {
      let idx = 0;
      values.forEach((v, i) => { if (v < values[idx]) idx = i; });
      return idx;
    }
    let idx = 0;
    values.forEach((v, i) => { if (v > values[idx]) idx = i; });
    return idx;
  };
  return (
    <div className="rounded-2xl border border-sheen glass shadow-soft overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60">
        <div className="font-display text-base font-semibold tracking-tight">{block.title}</div>
        <div className="text-xs text-muted-foreground">Side-by-side comparison · winners highlighted</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Metric</th>
              {block.options.map((o) => (
                <th key={o} className="px-4 py-3 font-medium text-right">{o}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r) => {
              const winIdx = highlightIndex(r);
              return (
                <tr key={r.key} className="border-t border-border/50">
                  <td className="px-4 py-3 text-muted-foreground">{r.label}</td>
                  {r.values.map((v, i) => (
                    <td
                      key={i}
                      className={`px-4 py-3 text-right tabular-nums ${winIdx === i ? "font-semibold text-success" : ""}`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
