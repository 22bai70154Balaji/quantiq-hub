import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  { name: "Shivaram", role: "Research Student in Fintech", quote: "The property calculator saves me hours per client meeting. The stamp-duty breakdown alone is worth it.", rating: 5 },
  { name: "Sumanth S", role: "Research Student in Fintech", quote: "Finally an SIP calculator that also handles USD and lets me compare with 401(k) growth. Beautiful UI.", rating: 5 },
  { name: "Sahithi", role: "Research Student in Fintech", quote: "Live AED conversion and Dubai property costs in one place. This is the tool I didn't know I needed.", rating: 5 },
];

const TRUST = [
  { label: "Calculations run", value: "2.4M+" },
  { label: "Countries supported", value: "3" },
  { label: "Live currency pairs", value: "150+" },
  { label: "Uptime", value: "99.98%" },
];

export function TrustAndTestimonials() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.label} className="rounded-2xl border bg-card p-6">
              <div className="font-display text-3xl font-semibold tracking-tight text-gradient sm:text-4xl">{t.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
            Testimonials
          </div>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            <span className="font-serif italic text-gold">Loved</span> by professionals<br />across three continents.
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border bg-card p-6 shadow-soft"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="mt-4 text-base leading-relaxed">"{t.quote}"</p>
              <div className="mt-6">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
