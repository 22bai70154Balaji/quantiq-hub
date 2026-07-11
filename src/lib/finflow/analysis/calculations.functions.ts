import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { newReportId, newShareSlug } from "./report-id";

const SavePayload = z.object({
  calculatorType: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(120),
  country: z.string().min(2).max(4).optional(),
  inputs: z.record(z.string(), z.unknown()),
  results: z.record(z.string(), z.unknown()),
  summary: z.record(z.string(), z.unknown()).default({}),
});

export const saveCalculation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SavePayload.parse(d))
  .handler(async ({ context, data }) => {
    const report_id = newReportId();
    const { data: row, error } = await context.supabase
      .from("saved_calculations")
      .insert({
        user_id: context.userId,
        calculator_type: data.calculatorType,
        name: data.name,
        country: data.country ?? null,
        inputs: data.inputs,
        results: data.results,
        summary: data.summary,
        report_id,
      })
      .select("id, report_id, share_slug, is_public, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyCalculations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_calculations")
      .select("id, calculator_type, name, country, summary, is_public, share_slug, report_id, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyCalculation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("saved_calculations")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");
    return row;
  });

export const deleteCalculation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("saved_calculations")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const toggleCalculationShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), makePublic: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    // Get the row to see if it already has a slug.
    const { data: existing, error: readErr } = await context.supabase
      .from("saved_calculations")
      .select("id, share_slug")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!existing) throw new Error("Not found");

    const patch: { is_public: boolean; share_slug?: string } = { is_public: data.makePublic };
    if (data.makePublic && !existing.share_slug) patch.share_slug = newShareSlug();

    const { data: updated, error } = await context.supabase
      .from("saved_calculations")
      .update(patch)
      .eq("id", data.id)
      .select("id, is_public, share_slug")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

// PUBLIC read — no auth. Uses the RLS policy (is_public=true AND share_slug not null).
export const getSharedCalculation = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(4).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: row, error } = await supabase
      .from("saved_calculations")
      .select("id, calculator_type, name, country, summary, inputs, results, report_id, created_at, ai_insights, share_slug")
      .eq("share_slug", data.slug)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Report not found or no longer public");
    return row;
  });
