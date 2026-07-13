import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NW_KIND = z.enum(["asset", "liability"]);
const NW_CATEGORY = z.enum([
  "cash",
  "investments",
  "real_estate",
  "other_asset",
  "loan",
  "credit_card",
  "other_liability",
]);

export type NwKind = z.infer<typeof NW_KIND>;
export type NwCategory = z.infer<typeof NW_CATEGORY>;

export type NetWorthEntry = {
  id: string;
  kind: NwKind;
  category: NwCategory;
  label: string;
  amount: number;
  currency: string;
  as_of: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const listNetWorthEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NetWorthEntry[]> => {
    const { data, error } = await context.supabase
      .from("net_worth_entries")
      .select("id, kind, category, label, amount, currency, as_of, notes, created_at, updated_at")
      .order("as_of", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      ...r,
      amount: Number(r.amount),
    })) as NetWorthEntry[];
  });

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  kind: NW_KIND,
  category: NW_CATEGORY,
  label: z.string().trim().min(1).max(120),
  amount: z.number().finite().min(0).max(1e13),
  currency: z.string().min(2).max(4).default("INR"),
  as_of: z.string().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const upsertNetWorthEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSchema.parse(d))
  .handler(async ({ context, data }) => {
    const row = {
      user_id: context.userId,
      kind: data.kind,
      category: data.category,
      label: data.label,
      amount: data.amount,
      currency: data.currency,
      as_of: data.as_of ?? new Date().toISOString().slice(0, 10),
      notes: data.notes ?? null,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("net_worth_entries")
        .update(row)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("net_worth_entries")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteNetWorthEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("net_worth_entries")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
