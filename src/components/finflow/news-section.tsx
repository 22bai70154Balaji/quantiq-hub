import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Newspaper, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getFinanceNews } from "@/lib/finflow/news.functions";

export function NewsSection({ region = "Global" as "Global" | "India" | "USA" | "UAE", limit }: { region?: "Global" | "India" | "USA" | "UAE"; limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["news", region],
    queryFn: () => getFinanceNews({ data: { region } }),
    staleTime: 15 * 60 * 1000,
  });

  const items = (data?.items ?? []).slice(0, limit ?? 6);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-primary">Live insights</div>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Markets today,<br />summarised by AI.
          </h2>
        </div>
        <Link to="/news" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Full feed <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) :
          items.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-soft transition hover:shadow-elegant"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  <Newspaper className="h-3 w-3" /> {n.category}
                </span>
                <ImpactBadge impact={n.impact} />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight">
                {n.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{n.summary}</p>
              <div className="mt-4 text-xs text-muted-foreground">{n.region}</div>
            </motion.div>
          ))}
      </div>
    </section>
  );
}

function ImpactBadge({ impact }: { impact: "positive" | "neutral" | "negative" }) {
  if (impact === "positive") return <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><TrendingUp className="h-3 w-3" /> Bullish</span>;
  if (impact === "negative") return <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><TrendingDown className="h-3 w-3" /> Bearish</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><Minus className="h-3 w-3" /> Neutral</span>;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="h-4 w-24 rounded animate-shimmer" />
      <div className="mt-4 h-5 w-full rounded animate-shimmer" />
      <div className="mt-2 h-5 w-2/3 rounded animate-shimmer" />
      <div className="mt-4 h-3 w-full rounded animate-shimmer" />
      <div className="mt-2 h-3 w-4/5 rounded animate-shimmer" />
    </div>
  );
}
