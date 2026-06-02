// Thin wrapper around Resend's HTTP API. No SDK dependency.
// If RESEND_API_KEY is not set, emails are logged to console instead of sent —
// safe for local dev and graceful in prod if the key was forgotten.

type EmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(args: EmailArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Yoga Club <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `[email] No RESEND_API_KEY set — would send to ${args.to}\n  subject: ${args.subject}\n  body:\n${args.text ?? args.html}`
    );
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: args.to, subject: args.subject, html: args.html, text: args.text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Resend failed: ${res.status} ${body}`);
      return { ok: false, error: `${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] network error:", e);
    return { ok: false, error: String(e) };
  }
}

export function appBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
