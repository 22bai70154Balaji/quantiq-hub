import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CalcShell({
  title, tagline, children, accent, icon: Icon,
  saveType, saveInputs, saveResults, saveName,
}: {
  title: string; tagline: string; children: ReactNode; accent: string;
  icon: React.ComponentType<{ className?: string }>;
  saveType?: string;
  saveInputs?: Record<string, unknown>;
  saveResults?: Record<string, unknown>;
  saveName?: string;
}) {
  const canSave = !!saveType;
  const onSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in to save calculations"); return; }
    const { error } = await supabase.from("saved_calculations").insert({
      user_id: user.id,
      calculator_type: saveType!,
      name: saveName ?? title,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputs: (saveInputs ?? {}) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results: (saveResults ?? {}) as any,
    });
    if (error) toast.error(error.message); else toast.success("Saved to dashboard");
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-28">
      <Link to="/calculators" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All calculators
      </Link>
      <motion.div
        initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex items-start gap-4">
          <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-elegant`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-1 max-w-xl text-muted-foreground">{tagline}</p>
          </div>
        </div>
        {canSave && (
          <Button variant="outline" size="sm" onClick={onSave} className="rounded-full">
            <Bookmark className="mr-1 h-3.5 w-3.5" /> Save
          </Button>
        )}
      </motion.div>
      <div className="mt-10">{children}</div>
    </div>
  );
}

export function StatCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "primary" | "success" | "warning" | "destructive" }) {
  const tones: Record<string, string> = {
    primary: "text-gradient",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl ${tone ? tones[tone] : ""}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function InputRow({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function NumberInput({
  value, onChange, prefix, suffix, step = 1, min, max,
}: {
  value: number; onChange: (n: number) => void; prefix?: string; suffix?: string; step?: number; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center rounded-xl border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      {prefix && <span className="pl-3 text-sm text-muted-foreground">{prefix}</span>}
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent px-3 py-2.5 text-base font-medium focus:outline-none"
      />
      {suffix && <span className="pr-3 text-sm text-muted-foreground">{suffix}</span>}
    </div>
  );
}
