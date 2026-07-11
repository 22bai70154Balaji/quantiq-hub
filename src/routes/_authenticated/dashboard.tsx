import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, LogOut, Sparkles, Star, MessageSquare, Trash2, ArrowRight, User as UserIcon, Users as UsersIcon, Mail, Phone, Link2, Check, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CALC_BY_SLUG, type CalcSlug } from "@/lib/finflow/registry";
import { useCountry } from "@/lib/finflow/country-store";
import { COUNTRIES, type Country } from "@/lib/finflow/countries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Dashboard — Calculyxai" },
      { name: "description", content: "Your saved Calculyxai reports, recent calculations, and account overview." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Dashboard,
});

type Tab = "saved" | "favorites" | "profile" | "users";

function Dashboard() {
  const [tab, setTab] = useState<Tab>("saved");
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
      if (data.user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
        setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      }
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
    toast.success("Signed out");
  };

  return (
    <>
      <Navbar />
      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="text-sm font-medium text-primary">Dashboard</div>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">{email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/ai"><Button variant="outline" className="rounded-full"><Sparkles className="mr-1 h-3.5 w-3.5" /> AI Assistant</Button></Link>
              <Button variant="outline" className="rounded-full" onClick={signOut}><LogOut className="mr-1 h-3.5 w-3.5" /> Sign out</Button>
            </div>
          </div>

          <div className="mt-8 inline-flex flex-wrap rounded-full border bg-card p-1">
            {((["saved", "favorites", "profile", ...(isAdmin ? ["users" as const] : [])]) as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${tab === t ? "bg-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "saved" ? "Saved calculations" : t === "users" ? "Users" : t}
              </button>
            ))}
          </div>

          <div className="mt-8 pb-24">
            {tab === "saved" && <SavedList />}
            {tab === "favorites" && <FavoritesList />}
            {tab === "profile" && <Profile />}
            {tab === "users" && isAdmin && <UsersList />}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SavedList() {
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["saved_calculations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_calculations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = async (id: string) => {
    const { error } = await supabase.from("saved_calculations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["saved_calculations"] }); }
  };

  const copyLink = async (slug: string, id: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("Share link copied");
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1800);
    } catch { toast.error("Could not copy link"); }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!data?.length) return (
    <EmptyState icon={Bookmark} title="No saved calculations yet"
      body="Run any calculator and hit Save to keep it here for later." cta={{ to: "/calculators", label: "Open calculators" }} />
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((s) => {
        const meta = CALC_BY_SLUG[s.calculator_type as CalcSlug];
        const Icon = meta?.icon ?? Bookmark;
        const summary = (s.summary as { kpis?: { label: string; value: string }[] } | null) ?? {};
        const kpis = summary.kpis ?? [];
        const country = s.country ? COUNTRIES[s.country as Country] : null;
        return (
          <motion.div key={s.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl border border-sheen glass p-5 shadow-soft flex flex-col">
            <div className="flex items-start justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${meta?.accent ?? "from-primary to-primary"} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1">
                {s.is_public && s.share_slug && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2 py-0.5 text-[10px] font-medium">
                    <Globe className="h-3 w-3" /> Public
                  </span>
                )}
                <button onClick={() => del(s.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-3 font-display text-lg font-semibold tracking-tight leading-tight">{s.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {country && <span>{country.flag} {country.name}</span>}
              {s.report_id && <span className="font-mono">{s.report_id}</span>}
              <span>{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
            {kpis.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {kpis.slice(0, 4).map((k, i) => (
                  <div key={i} className="rounded-xl border bg-card/60 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{k.label}</div>
                    <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums truncate">{k.value}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-auto pt-4 flex items-center justify-between">
              {meta && (
                <Link to="/calc/$type" params={{ type: meta.slug }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Re-run <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
              {s.is_public && s.share_slug && (
                <button onClick={() => copyLink(s.share_slug!, s.id)}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-muted">
                  {copiedId === s.id ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                  {copiedId === s.id ? "Copied" : "Share"}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function FavoritesList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["favorite_currencies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorite_currencies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [base, setBase] = useState("USD");
  const [quote, setQuote] = useState("INR");

  const add = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("favorite_currencies").insert({ user_id: user.id, base, quote });
    if (error) toast.error(error.message); else { toast.success("Added"); qc.invalidateQueries({ queryKey: ["favorite_currencies"] }); }
  };

  const del = async (id: string) => {
    await supabase.from("favorite_currencies").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["favorite_currencies"] });
  };

  const CURR = ["USD", "EUR", "GBP", "INR", "AED", "JPY", "AUD", "CAD", "CHF", "SGD"];
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Base</div>
          <select value={base} onChange={(e) => setBase(e.target.value)} className="mt-1 h-10 rounded-xl border bg-background px-3 text-sm">
            {CURR.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Quote</div>
          <select value={quote} onChange={(e) => setQuote(e.target.value)} className="mt-1 h-10 rounded-xl border bg-background px-3 text-sm">
            {CURR.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Button onClick={add}><Star className="mr-1 h-3.5 w-3.5" /> Add pair</Button>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> :
        !data?.length ? <EmptyState icon={Star} title="No favorite pairs" body="Pin the currency pairs you watch." /> :
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((f) => (
            <div key={f.id} className="rounded-2xl border bg-card p-4 flex items-center justify-between">
              <div>
                <div className="font-mono text-lg font-semibold">{f.base} → {f.quote}</div>
                <div className="text-xs text-muted-foreground">Added {new Date(f.created_at).toLocaleDateString()}</div>
              </div>
              <button onClick={() => del(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function Profile() {
  const [country, setCountry] = useCountry();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setName(data?.display_name ?? "");
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: name, country, currency: COUNTRIES[country].currency });
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-xl space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><UserIcon className="h-6 w-6" /></div>
        <div>
          <div className="font-display text-xl font-semibold tracking-tight">Profile</div>
          <div className="text-sm text-muted-foreground">Your preferences and defaults</div>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Display name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div>
        <label className="text-sm font-medium">Default country</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["IN", "US", "AE"] as const).map((k) => {
            const c = COUNTRIES[k];
            return (
              <button key={k} onClick={() => setCountry(k)}
                className={`rounded-xl border p-3 text-sm ${country === k ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>
                <div className="text-2xl">{c.flag}</div>
                <div className="mt-1 font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.currency}</div>
              </button>
            );
          })}
        </div>
      </div>
      <Button onClick={save} className="rounded-xl">Save changes</Button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, cta }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; cta?: { to: string; label: string } }) {
  return (
    <div className="rounded-2xl border bg-card p-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted"><Icon className="h-6 w-6 text-muted-foreground" /></div>
      <div className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {cta && <Link to={cta.to} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{cta.label} <ArrowRight className="h-3.5 w-3.5" /></Link>}
    </div>
  );
}

function UsersList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, phone, country, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading users…</div>;
  if (error) return <div className="text-sm text-destructive">Failed to load users</div>;
  if (!data?.length) return <EmptyState icon={UsersIcon} title="No users yet" body="Signups will appear here." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-xl font-semibold tracking-tight">Signed-up users</div>
          <div className="text-sm text-muted-foreground">{data.length} total</div>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.display_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{u.email ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{u.phone ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.country ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Silence unused import warning; MessageSquare kept if needed elsewhere
void MessageSquare;
