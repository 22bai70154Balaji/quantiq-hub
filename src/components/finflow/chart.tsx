import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { useMemo } from "react";
import { calcSip } from "@/lib/finflow/calculators";

export function InteractiveChart() {
  const data = useMemo(() => {
    const years = 20;
    const rows = [] as { year: string; conservative: number; moderate: number; aggressive: number }[];
    for (let y = 1; y <= years; y++) {
      rows.push({
        year: `Y${y}`,
        conservative: Math.round(calcSip({ monthly: 25000, annualRate: 8, years: y }).futureValue),
        moderate: Math.round(calcSip({ monthly: 25000, annualRate: 12, years: y }).futureValue),
        aggressive: Math.round(calcSip({ monthly: 25000, annualRate: 15, years: y }).futureValue),
      });
    }
    return rows;
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
            Visualise
          </div>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            See <span className="font-serif italic text-gold">compounding</span> before you commit.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Every calculator ships with rich, interactive charts — so you can feel the shape of your money over time.
          </p>
        </div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-elegant"
        >
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">SIP · ₹25,000/mo</div>
            <div className="mt-1 font-display text-2xl font-semibold">Growth across return scenarios</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.72 0.18 262)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="year" stroke="oklch(0.65 0.02 260)" fontSize={11} />
                <YAxis stroke="oklch(0.65 0.02 260)" fontSize={11} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.14 0.014 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }}
                  formatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`}
                />
                <Area type="monotone" dataKey="aggressive" stroke="oklch(0.72 0.18 262)" fill="url(#gA)" strokeWidth={2} />
                <Line type="monotone" dataKey="moderate" stroke="oklch(0.7 0.18 190)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="conservative" stroke="oklch(0.7 0.22 320)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <Legend color="oklch(0.72 0.18 262)" label="15% p.a." />
            <Legend color="oklch(0.7 0.18 190)" label="12% p.a." />
            <Legend color="oklch(0.7 0.22 320)" label="8% p.a." />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
