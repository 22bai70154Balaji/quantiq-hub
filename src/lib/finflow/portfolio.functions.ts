import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ASSET_CLASS = z.enum([
  "stock",
  "etf",
  "mutual_fund",
  "crypto",
  "gold",
  "fd",
  "bond",
  "epf",
  "ppf",
  "nps",
]);

export type AssetClass = z.infer<typeof ASSET_CLASS>;

export type Holding = {
  id: string;
  asset_class: AssetClass;
  symbol: string | null;
  name: string;
  quantity: number;
  avg_cost: number;
  currency: string;
  manual_price: number | null;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // computed
  current_price: number;
  market_value: number;
  cost_basis: number;
  gain: number;
  gain_pct: number;
};

export type PortfolioSummary = {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPct: number;
  diversificationScore: number;
  riskBand: "Low" | "Moderate" | "High";
  allocation: { asset_class: AssetClass; value: number; pct: number }[];
};

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  asset_class: ASSET_CLASS,
  symbol: z.string().max(32).nullable().optional(),
  name: z.string().trim().min(1).max(120),
  quantity: z.number().finite().min(0).max(1e12),
  avg_cost: z.number().finite().min(0).max(1e10),
  currency: z.string().min(2).max(4).default("INR"),
  manual_price: z.number().finite().min(0).max(1e10).nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

function computeSummary(holdings: Holding[]): PortfolioSummary {
  const totalValue = holdings.reduce((s, h) => s + h.market_value, 0);
  const totalCost = holdings.reduce((s, h) => s + h.cost_basis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Allocation by asset_class
  const map = new Map<AssetClass, number>();
  for (const h of holdings) {
    map.set(h.asset_class, (map.get(h.asset_class) ?? 0) + h.market_value);
  }
  const allocation = Array.from(map.entries())
    .map(([ac, v]) => ({
      asset_class: ac,
      value: v,
      pct: totalValue > 0 ? (v / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Diversification (HHI-based, 0-100)
  const hhi = allocation.reduce((s, a) => s + Math.pow(a.pct / 100, 2), 0);
  const diversificationScore = Math.max(0, Math.min(100, Math.round((1 - hhi) * 100)));

  // Risk band: max concentration + presence of volatile classes
  const maxPct = allocation[0]?.pct ?? 0;
  const volatile = allocation
    .filter((a) => a.asset_class === "crypto" || a.asset_class === "stock")
    .reduce((s, a) => s + a.pct, 0);
  let riskBand: "Low" | "Moderate" | "High" = "Moderate";
  if (volatile > 70 || maxPct > 70) riskBand = "High";
  else if (volatile < 30 && maxPct < 40) riskBand = "Low";

  return { totalValue, totalCost, totalGain, totalGainPct, diversificationScore, riskBand, allocation };
}

export const listHoldings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ holdings: Holding[]; summary: PortfolioSummary }> => {
    const { data, error } = await context.supabase
      .from("holdings")
      .select("id, asset_class, symbol, name, quantity, avg_cost, currency, manual_price, purchase_date, notes, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Load cache prices for symbols we have
    const symbols = (data ?? []).filter((h) => h.symbol).map((h) => h.symbol as string);
    let priceMap = new Map<string, number>();
    if (symbols.length) {
      const { data: prices } = await context.supabase
        .from("holding_prices")
        .select("symbol, asset_class, price")
        .in("symbol", symbols);
      priceMap = new Map((prices ?? []).map((p) => [`${p.symbol}:${p.asset_class}`, Number(p.price)]));
    }

    const holdings: Holding[] = (data ?? []).map((h) => {
      const qty = Number(h.quantity);
      const avg = Number(h.avg_cost);
      const manual = h.manual_price != null ? Number(h.manual_price) : null;
      const cached = h.symbol ? priceMap.get(`${h.symbol}:${h.asset_class}`) : undefined;
      const current_price = manual ?? cached ?? avg;
      const market_value = qty * current_price;
      const cost_basis = qty * avg;
      const gain = market_value - cost_basis;
      const gain_pct = cost_basis > 0 ? (gain / cost_basis) * 100 : 0;
      return {
        ...h,
        quantity: qty,
        avg_cost: avg,
        manual_price: manual,
        current_price,
        market_value,
        cost_basis,
        gain,
        gain_pct,
      } as Holding;
    });

    return { holdings, summary: computeSummary(holdings) };
  });

export const upsertHolding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSchema.parse(d))
  .handler(async ({ context, data }) => {
    const row = {
      user_id: context.userId,
      asset_class: data.asset_class,
      symbol: data.symbol ?? null,
      name: data.name,
      quantity: data.quantity,
      avg_cost: data.avg_cost,
      currency: data.currency,
      manual_price: data.manual_price ?? null,
      purchase_date: data.purchase_date ?? null,
      notes: data.notes ?? null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("holdings").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("holdings")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteHolding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("holdings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
