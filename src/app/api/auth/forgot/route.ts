import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { escapeLike } from "../../../../lib/auth";
import { isRateLimited, recordFailure } from "../../../../lib/rate-limit";
import { sendEmail, appBaseUrl } from "../../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function ok(): NextResponse {
  // Always return the same shape regardless of whether the email exists, so
  // attackers can't probe which addresses are registered.
  return NextResponse.json({ ok: true });
}

function buildEmail(resetUrl: string, name: string | null): { html: string; text: string } {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const text = [
    greeting,
    "",
    "Someone (hopefully you) asked to reset your Yoga Club password.",
    "Open the link below to set a new one — it expires in 1 hour.",
    "",
    resetUrl,
    "",
    "If you didn't request this, you can safely ignore this email; your password won't change.",
    "",
    "— Yoga Club",
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
      <p>${greeting}</p>
      <p>Someone (hopefully you) asked to reset your Yoga Club password. Click the button below to set a new one — the link expires in <strong>1 hour</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 20px; border-radius: 10px; background: #e07a52; color: #ffffff; text-decoration: none; font-weight: 600;">
          Reset password
        </a>
      </p>
      <p style="font-size: 13px; color: #555;">Or copy and paste this URL into your browser:<br/>
        <a href="${resetUrl}" style="color: #555; word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="font-size: 13px; color: #888; margin-top: 32px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
      <p style="font-size: 13px; color: #888;">— Yoga Club</p>
    </div>
  `.trim();

  return { html, text };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  // Invalid input still returns 200 — we don't want to confirm or deny.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ok();
  // Every request costs an email send, so throttle per address (still a 200,
  // so probing reveals nothing).
  if (isRateLimited(`forgot:${email}`)) return ok();
  recordFailure(`forgot:${email}`);
  if (!isSupabaseConfigured()) {
    console.error("[forgot] supabase not configured");
    return ok();
  }

  const sb = supabase();
  const { data: member, error: lookupErr } = await sb
    .from("members")
    .select("id, email, name")
    .ilike("email", escapeLike(email))
    .maybeSingle();
  if (lookupErr) {
    console.error("[forgot] lookup failed:", lookupErr);
    return ok();
  }
  if (!member) return ok();

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  const { error: insertErr } = await sb.from("password_reset_tokens").insert({
    member_id: member.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (insertErr) {
    console.error("[forgot] token insert failed:", insertErr);
    return ok();
  }

  const resetUrl = `${appBaseUrl()}/reset/${rawToken}`;
  const { html, text } = buildEmail(resetUrl, member.name ?? null);

  const sent = await sendEmail({
    to: member.email,
    subject: "Reset your Yoga Club password",
    html,
    text,
  });
  if (!sent.ok) {
    console.error("[forgot] sendEmail failed:", sent.error);
  }

  return ok();
}
