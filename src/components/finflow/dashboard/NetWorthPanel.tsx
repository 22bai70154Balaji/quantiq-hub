import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Wallet, TrendingUp, Home, Landmark, CreditCard, Package, Banknote, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listNetWorthEntries,
  upsertNetWorthEntry,
  deleteNetWorthEntry,
  type NetWorthEntry,
  type NwCategory,
  type NwKind,
} from "@/lib/finflow/dashboard.functions";
import { useCountry } from "@/lib/finflow/country-store";
import { formatMoney } from "@/lib/finflow/countries";

const CATEGORY_META: Record<NwCategory, { label: string; kind: NwKind; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  cash:            { label: "Cash",           kind: "asset",     icon: Banknote,   accent: "from-emerald-500 to-teal-500" },
  investments:     { label: "Investments",    kind: "asset",     icon: TrendingUp, accent: "from-sky-500 to-indigo-500" },
  real_estate:     { label: "Real Estate",    kind: "asset",     icon: Home,       accent: "from-amber-500 to-orange-500" },
  other_asset:     { label: "Other Assets",   kind: "asset",     icon: Package,    accent: "from-fuchsia-500 to-pink-500" },
  loan:            { label: "Loans",          kind: "liability", icon: Landmark,   accent: "from-rose-500 to-red-500" },
  credit_card:     { label: "Credit Cards",   kind: "liability", icon: CreditCard, accent: "from-orange-500 to-rose-500" },
  other_liability: { label: "Other Liab.",    kind: "liability", icon: Wallet,     accent: "from-slate-500 to-zinc-600" },
};

const ASSET_CATS: NwCategory[] = ["cash", "investments", "real_estate", "other_asset"];
const LIAB_CATS: NwCategory[] = ["loan", "credit_card", "other_liability"];

export function NetWorthPanel() {
  const [country] = useCountry();
  const qc = useQueryClient();
  const list = useServerFn(listNetWorthEntries);
  const upsert = useServerFn(upsertNetWorthEntry);
  const del = useServerFn(deleteNetWorthEntry);
  const [editing, setEditing] = useState<Partial<NetWorthEntry> | null>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["net_worth_entries"],
    queryFn: () => list(),
  });

  const totals = useMemo(() => {
    const byCat = new Map<NwCategory, number>();
    let assets = 0;
    let liab = 0;
    for (const e of entries ?? []) {
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
      if (e.kind === "asset") assets += e.amount;
      else liab += e.amount;
    }
    // MoM delta: current-month net vs previous-month net
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    const netAtMonth = (m: string) =>
      (entries ?? [])
        .filter((e) => (e.as_of ?? "").slice(0, 7) <= m)
        .reduce((s, e) => s + (e.kind === "asset" ? e.amount : -e.amount), 0);
    const cur = netAtMonth(thisMonth);
    const prv = netAtMonth(prevMonth);
    const deltaPct = prv !== 0 ? ((cur - prv) / Math.abs(prv)) * 100 : 0;
    return { assets, liab, net: assets - liab, byCat, deltaPct };
  }, [entries]);

  async function handleSave(payload: NwSavePayload) {
    try {
      await upsert({ data: payload });
      await qc.invalidateQueries({ queryKey: ["net_worth_entries"] });
      toast.success(payload.id ? "Updated" : "Added");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    try {
      await del({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["net_worth_entries"] });
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading net worth…</div>;

  const positive = totals.deltaPct >= 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="rounded-3xl border border-sheen glass p-8 shadow-soft"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Net Worth</div>
            <div className="mt-2 font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl text-gradient">
              {formatMoney(totals.net, country)}
            </div>
            {(entries?.length ?? 0) >= 2 && (
              <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {positive ? "+" : ""}{totals.deltaPct.toFixed(1)}% MoM
              </div>
            )}
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Assets</div>
              <div className="mt-1 font-mono text-xl font-semibold text-success tabular-nums">{formatMoney(totals.assets, country)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Liabilities</div>
              <div className="mt-1 font-mono text-xl font-semibold text-destructive tabular-nums">{formatMoney(totals.liab, country)}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(Object.keys(CATEGORY_META) as NwCategory[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const value = totals.byCat.get(cat) ?? 0;
          return (
            <div key={cat} className="min-w-0 rounded-2xl border border-sheen glass p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${meta.accent} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium">{meta.label}</div>
                </div>
                <button
                  onClick={() => setEditing({ category: cat, kind: meta.kind, label: "", amount: 0 })}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Add ${meta.label}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className={`mt-3 font-mono text-xl font-semibold tabular-nums ${meta.kind === "liability" ? "text-destructive" : "text-foreground"}`}>
                {formatMoney(value, country)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {(entries ?? []).filter((e) => e.category === cat).length} entries
              </div>
            </div>
          );
        })}
      </div>

      {/* Entries list */}
      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <div className="font-display text-lg font-semibold tracking-tight">All entries</div>
            <div className="text-xs text-muted-foreground">Add each account or asset separately for accuracy.</div>
          </div>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => setEditing({ category: "cash", kind: "asset", label: "", amount: 0 })}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add entry
          </Button>
        </div>

        {!entries?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No entries yet — click <span className="font-medium text-foreground">Add entry</span> or the + on any category card.
          </div>
        ) : (
          <div className="divide-y">
            <EntryGroup title="Assets" items={(entries ?? []).filter((e) => ASSET_CATS.includes(e.category))} country={country} onEdit={setEditing} onDelete={handleDelete} />
            <EntryGroup title="Liabilities" items={(entries ?? []).filter((e) => LIAB_CATS.includes(e.category))} country={country} onEdit={setEditing} onDelete={handleDelete} />
          </div>
        )}
      </div>

      {editing && (
        <EntryDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function EntryGroup({
  title,
  items,
  country,
  onEdit,
  onDelete,
}: {
  title: string;
  items: NetWorthEntry[];
  country: "IN" | "US" | "AE";
  onEdit: (e: NetWorthEntry) => void;
  onDelete: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="p-4">
      <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{title}</div>
      <div className="space-y-1">
        {items.map((e) => {
          const meta = CATEGORY_META[e.category];
          const Icon = meta.icon;
          return (
            <div key={e.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/40">
              <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${meta.accent} text-white`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{e.label}</div>
                <div className="truncate text-xs text-muted-foreground">{meta.label} · {e.as_of}</div>
              </div>
              <div className={`font-mono text-sm font-semibold tabular-nums ${e.kind === "liability" ? "text-destructive" : "text-foreground"}`}>
                {formatMoney(e.amount, country)}
              </div>
              <button onClick={() => onEdit(e)} className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(e.id)} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EntryDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<NetWorthEntry>;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    kind: NwKind;
    category: NwCategory;
    label: string;
    amount: number;
    currency: string;
    as_of?: string;
    notes?: string | null;
  }) => void;
}) {
  const [country] = useCountry();
  const [category, setCategory] = useState<NwCategory>(initial.category ?? "cash");
  const [label, setLabel] = useState(initial.label ?? "");
  const [amount, setAmount] = useState<string>(String(initial.amount ?? ""));
  const [asOf, setAsOf] = useState(initial.as_of ?? new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const meta = CATEGORY_META[category];
  const currency = initial.currency ?? { IN: "INR", US: "USD", AE: "AED" }[country];

  async function submit() {
    const num = Number(amount);
    if (!label.trim()) { toast.error("Label is required"); return; }
    if (!Number.isFinite(num) || num < 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    onSave({
      id: initial.id,
      kind: meta.kind,
      category,
      label: label.trim(),
      amount: num,
      currency,
      as_of: asOf,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-elegant">
        <div className="font-display text-lg font-semibold tracking-tight">
          {initial.id ? "Edit entry" : "Add entry"}
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NwCategory)}
              className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm"
            >
              {(Object.keys(CATEGORY_META) as NwCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label} ({CATEGORY_META[c].kind})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. HDFC Savings"
              className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount ({currency})</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="mt-1 h-11 w-full rounded-xl border bg-background px-3 font-mono text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">As of</label>
            <input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{initial.id ? "Update" : "Add"}</Button>
        </div>
      </div>
    </div>
  );
}
