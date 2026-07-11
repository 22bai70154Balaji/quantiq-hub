import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const OWNER_EMAIL = "saibalajijee@gmail.com";

const input = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
});

export const sendContactEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!lovableKey || !resendKey) {
      console.warn("[contact-email] missing gateway credentials");
      return { sent: false, reason: "not_configured" as const };
    }

    const from = process.env.RESEND_FROM ?? "Calculyx AI <onboarding@resend.dev>";

    const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;background:#f5f7fb;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 24px rgba(9,37,80,0.08);">
        <h2 style="margin:0 0 16px;color:#092550;">New contact message</h2>
        <p style="margin:4px 0;"><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p style="margin:4px 0;"><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
        <p style="white-space:pre-wrap;line-height:1.6;color:#334155;">${escapeHtml(data.message)}</p>
      </div>
    </body></html>`;

    const text = `New contact message\n\nName: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\n\n${data.message}`;

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from,
        to: [OWNER_EMAIL],
        reply_to: data.email,
        subject: `[Calculyx Contact] ${data.subject}`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[contact-email] resend failed [${res.status}]: ${body}`);
      return { sent: false, reason: "provider_error" as const, status: res.status };
    }

    return { sent: true as const };
  });

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
