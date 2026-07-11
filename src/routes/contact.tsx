import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/finflow/navbar";
import { Footer } from "@/components/finflow/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import { sendContactEmail } from "@/lib/finflow/contact-email.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Calculyxai — Support, Feedback & Feature Requests" },
      { name: "description", content: "Get in touch with the Calculyxai team. Send feedback, report a bug, or request a new financial calculator." },
      { property: "og:title", content: "Contact Calculyxai" },
      { property: "og:description", content: "Support, feedback, and feature requests for Calculyxai." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://calculyxai.online/contact" },
      { property: "og:image", content: "https://calculyxai.online/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://calculyxai.online/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://calculyxai.online/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const send = useServerFn(sendContactEmail);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await send({
        data: {
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        },
      });
      if (res.sent) {
        toast.success("Message sent!", { description: "Thanks — I'll get back to you soon." });
        setName(""); setEmail(""); setSubject(""); setMessage("");
      } else if (res.reason === "not_configured") {
        toast.error("Email is not configured yet", { description: "Please email saibalajijee@gmail.com directly." });
      } else {
        toast.error("Could not send message", { description: "Please try again or email saibalajijee@gmail.com." });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      toast.error("Could not send message", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-page-gradient min-h-screen">
      <Navbar />
      <main className="pt-24">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="text-sm font-medium text-primary">Get in touch</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Contact <span className="font-serif italic text-gold">us</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Feedback, feature ideas, partnerships, or a bug you found — send a message and it will land in my inbox.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-2 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            <a href="mailto:saibalajijee@gmail.com" className="font-medium hover:text-primary">
              saibalajijee@gmail.com
            </a>
          </div>

          <form
            onSubmit={onSubmit}
            className="mt-10 space-y-5 rounded-2xl border bg-card/70 p-6 shadow-soft backdrop-blur-sm sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                required
                maxLength={200}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                required
                maxLength={4000}
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell me more…"
              />
              <div className="text-right text-xs text-muted-foreground">{message.length}/4000</div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button type="submit" disabled={submitting} size="lg" className="rounded-full">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send message"
                )}
              </Button>
            </div>
          </form>
        </div>
        <Footer />
      </main>
    </div>
  );
}
