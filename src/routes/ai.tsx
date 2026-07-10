import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, User as UserIcon, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/finflow/navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { askFinFlowAi } from "@/lib/finflow/ai.functions";
import { useCountry } from "@/lib/finflow/country-store";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI Assistant — FinFlow AI" }] }),
  component: AiPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How do I choose between a 15-year and 30-year mortgage?",
  "Explain SIP vs lump sum with a concrete example.",
  "What's the total cost of owning a 1 Cr flat in Mumbai?",
  "Compare 6% FD vs 12% mutual fund SIP over 10 years.",
];

function AiPage() {
  const navigate = useNavigate();
  const [country] = useCountry();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ask = useServerFn(askFinFlowAi);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    if (!signedIn) { navigate({ to: "/auth" }); return; }
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({ data: { messages: next, country } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
      setMessages(next);
    } finally { setBusy(false); }
  };

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-8">
        <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-4xl flex-col px-4">
          <div className="flex items-center gap-3 pb-4 pt-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold tracking-tight">FinFlow AI</div>
              <div className="text-xs text-muted-foreground">Finance questions · calculation help · comparisons</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-2xl border bg-card/50 p-4 sm:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="grid place-items-center h-full">
                <div className="max-w-lg text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">Ask FinFlow AI anything</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Powered by advanced reasoning models. Tuned for India, USA, and UAE finance.</p>
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-xl border bg-card p-3 text-left text-sm hover:border-primary hover:bg-muted transition">
                        {s}
                      </button>
                    ))}
                  </div>
                  {signedIn === false && (
                    <div className="mt-6 text-sm">
                      <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to start chatting.
                    </div>
                  )}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
                {m.role === "user" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted"><UserIcon className="h-4 w-4" /></div>
                )}
              </motion.div>
            ))}
            {busy && (
              <div className="flex gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div>
                <div className="rounded-2xl bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "120ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "240ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={signedIn === false ? "Sign in to chat…" : "Ask about mortgages, tax, investments…"}
              className="h-12 flex-1 rounded-2xl border bg-card px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={busy}
            />
            <Button type="submit" size="lg" className="rounded-2xl" disabled={busy || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Back to home</Link>
          </div>
        </div>
      </main>
    </>
  );
}
