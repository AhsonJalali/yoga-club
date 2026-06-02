import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { hashPassword } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PASSWORD_MIN = 6;

function fail(error: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const rawToken = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!rawToken || !password) return fail("invalid");
  if (password.length < PASSWORD_MIN) return fail("short");
  if (!isSupabaseConfigured()) return fail("server", 500);

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const sb = supabase();
  const { data: tokenRow, error: lookupErr } = await sb
    .from("password_reset_tokens")
    .select("id, member_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (lookupErr) {
    console.error("[reset] token lookup failed:", lookupErr);
    return fail("server", 500);
  }
  if (!tokenRow) return fail("token");
  if (tokenRow.used_at) return fail("token");
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) return fail("expired");

  const newHash = await hashPassword(password);

  const { error: updateErr } = await sb
    .from("members")
    .update({ password_hash: newHash })
    .eq("id", tokenRow.member_id);
  if (updateErr) {
    console.error("[reset] password update failed:", updateErr);
    return fail("server", 500);
  }

  // Mark the token used. If this fails it's not fatal — the password is
  // already changed and the token has a 1h TTL — but log it so we notice
  // any persistent issue with the table.
  const { error: markErr } = await sb
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);
  if (markErr) {
    console.error("[reset] mark-used failed:", markErr);
  }

  return NextResponse.json({ ok: true });
}
