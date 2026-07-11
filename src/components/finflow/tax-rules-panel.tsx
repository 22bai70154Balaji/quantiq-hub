import { useState } from "react";
import { ChevronDown, Lightbulb, ScrollText } from "lucide-react";
import type { Country } from "@/lib/finflow/countries";
import { formatMoney } from "@/lib/finflow/countries";
import { taxRulesFor } from "@/lib/finflow/tax-rules";
import { taxSavingTips } from "@/lib/finflow/tax-tips";

export function TaxRulesPanel({ country, income }: { country: Country; income: number }) {
  const rules = taxRulesFor(country);
  const tips = taxSavingTips(country, income);
  const [showRules, setShowRules] = useState(true);
  const [showTips, setShowTips] = useState(true);

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {/* Rules card */}
      <div className="rounded-2xl border bg-card p-5 shadow-soft">
        <button
          type="button"
          onClick={() => setShowRules((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <ScrollText className="h-4 w-4" />
            </span>
            <div>
              <div className="font-display text-base font-semibold tracking-tight">Rules applied</div>
              <div className="text-xs text-muted-foreground">{rules.regime}</div>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 transition ${showRules ? "rotate-180" : ""}`} />
        </button>
        {showRules && (
          <div className="mt-4 space-y-3">
            {rules.brackets.length > 1 ? (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Slab</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.brackets.map((b, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {formatMoney(b.from, country)}
                          {b.to !== null ? ` – ${formatMoney(b.to, country)}` : " +"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{b.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                {rules.brackets[0].rate}% flat rate.
              </div>
            )}
            {rules.standardDeduction && (
              <div className="text-xs text-muted-foreground">
                {rules.standardDeduction.label}:{" "}
                <span className="font-mono tabular-nums text-foreground">
                  {formatMoney(rules.standardDeduction.amount, country)}
                </span>
              </div>
            )}
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {rules.notes.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
            <div className="pt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Effective from {rules.effectiveFrom}
            </div>
          </div>
        )}
      </div>

      {/* Tips card */}
      <div className="rounded-2xl border bg-gradient-to-br from-amber-400/10 via-transparent to-transparent p-5 shadow-soft">
        <button
          type="button"
          onClick={() => setShowTips((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/15 text-amber-300">
              <Lightbulb className="h-4 w-4" />
            </span>
            <div>
              <div className="font-display text-base font-semibold tracking-tight">Tax-saving ideas</div>
              <div className="text-xs text-muted-foreground">{tips.length} suggestions for {rules.regime.split("·")[0].trim()}</div>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 transition ${showTips ? "rotate-180" : ""}`} />
        </button>
        {showTips && (
          <ul className="mt-4 space-y-3">
            {tips.map((t, i) => (
              <li key={i} className="rounded-xl border bg-card/60 p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-medium">{t.title}</div>
                  {t.potentialSavingLabel && (
                    <span className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                      {t.potentialSavingLabel}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{t.detail}</div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 text-[10px] italic text-muted-foreground">
          Informational only — not tax advice. Confirm with a qualified professional.
        </div>
      </div>
    </div>
  );
}
