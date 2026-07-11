import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function StatusBar() {
  const [latency, setLatency] = useState(14);
  const [sims, setSims] = useState(1_402_881);

  useEffect(() => {
    const t = setInterval(() => {
      setLatency(12 + Math.floor(Math.random() * 6));
      setSims((s) => s + Math.floor(Math.random() * 7));
    }, 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-5 z-40 hidden justify-center px-6 md:flex"
    >
      <div className="pointer-events-auto flex items-center gap-6 rounded-full border border-white/10 glass px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          <span>Systems Operational</span>
        </div>
        <span className="h-3 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <span>Latency</span>
          <span className="tabular-nums text-foreground" style={{ color: "oklch(0.82 0.13 82)" }}>{latency}ms</span>
        </div>
        <span className="h-3 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <span>Simulations</span>
          <span className="tabular-nums text-foreground">{sims.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
