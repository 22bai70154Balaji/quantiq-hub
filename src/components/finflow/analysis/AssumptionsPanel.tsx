import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

export function AssumptionsPanel({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-sheen glass shadow-soft">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-base font-semibold tracking-tight">Assumptions used</div>
            <div className="text-xs text-muted-foreground">{items.length} assumption{items.length === 1 ? "" : "s"} · click to expand</div>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="border-t border-border/60 px-5 py-4 space-y-2 text-sm text-foreground/90">
          {items.map((a, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
