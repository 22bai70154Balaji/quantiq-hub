import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const input = z.object({
  to: z.string().email(),
  name: z.string().trim().max(120).optional(),
});

/**
 * Sends the Calculyx AI welcome email via the Resend gateway.
 *
 * Uses the shared `onboarding@resend.dev` sender by default. To email real
 * users, verify a domain in Resend and set `RESEND_FROM` (e.g.
 * "Calculyx AI <hello@yourdomain.com>") as a project secret.
 */
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!lovableKey || !resendKey) {
      console.warn("[welcome-email] missing gateway credentials");
      return { sent: false, reason: "not_configured" as const };
    }

    const from = process.env.RESEND_FROM ?? "Calculyx AI <onboarding@resend.dev>";
    const displayName = data.name?.trim() || "there";

    const html = renderWelcomeHtml(displayName);
    const text = renderWelcomeText(displayName);

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from,
        to: [data.to],
        subject: "Welcome to Calculyx AI 🎉",
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[welcome-email] resend failed [${res.status}]: ${body}`);
      return { sent: false, reason: "provider_error" as const, status: res.status };
    }

    return { sent: true as const };
  });

function renderWelcomeHtml(name: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(9,37,80,0.08);">
            <tr>
              <td style="background:linear-gradient(120deg,#014A92 0%,#0BE8FB 100%);padding:28px 32px;color:#ffffff;">
                <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;">Calculyx AI</div>
                <div style="opacity:.9;font-size:14px;margin-top:4px;">Premium financial calculators &amp; AI insights</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#092550;">Welcome, ${escapeHtml(name)} 👋</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                  Your Calculyx AI account is ready. You now have access to our full suite of financial calculators —
                  Home Loan, SIP, Mortgage, Property, Currency and more — plus an AI assistant tuned for personal finance.
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
                  Start with our flagship <strong>Home Loan Engine</strong> to compare live bank rates across India, USA and UAE.
                </p>
                <a href="https://id-preview--0ec82f2f-0a13-4559-b6a5-8c1e8bf0c043.lovable.app/calculators"
                   style="display:inline-block;background:#014A92;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;font-size:14px;">
                  Explore calculators →
                </a>
                <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
                  Questions? Just reply to this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px;font-size:12px;color:#94a3b8;">
                © Calculyx AI · You are receiving this because you signed up.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderWelcomeText(name: string) {
  return [
    `Welcome, ${name}!`,
    "",
    "Your Calculyx AI account is ready. Explore Home Loan, SIP, Mortgage, Property and Currency calculators, plus an AI assistant for personal finance.",
    "",
    "Open Calculyx AI: https://id-preview--0ec82f2f-0a13-4559-b6a5-8c1e8bf0c043.lovable.app/calculators",
    "",
    "Questions? Just reply to this email.",
  ].join("\n");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
