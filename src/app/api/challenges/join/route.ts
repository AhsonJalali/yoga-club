import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { verifySession } from "../../../../lib/session-token";
import { todayEasternIso } from "../../../../lib/schedule";
import { COOKIE_NAME, parseCookieHeader } from "../../../../lib/cookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Opt a member into a challenge. Only allowed while the join (grace) window is
// still open. Idempotent — re-joining is a no-op.
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 500 });
  }

  const memberId = verifySession(
    req.cookies.get(COOKIE_NAME)?.value ??
      parseCookieHeader(req.headers.get("cookie"))[COOKIE_NAME]
  );
  if (!memberId) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const challengeId = String(body?.challenge_id ?? "");
  if (!challengeId) {
    return NextResponse.json({ ok: false, reason: "missing-challenge" }, { status: 400 });
  }

  const sb = supabase();
  const { data: ch, error: chErr } = await sb
    .from("challenges")
    .select("id, end_date, join_closes_at")
    .eq("id", challengeId)
    .maybeSingle();
  if (chErr || !ch) {
    return NextResponse.json({ ok: false, reason: "no-challenge" }, { status: 404 });
  }

  const closes = (ch.join_closes_at as string | null) ?? (ch.end_date as string);
  if (todayEasternIso() > closes) {
    return NextResponse.json({ ok: false, reason: "join-closed" }, { status: 403 });
  }

  const { error } = await sb
    .from("challenge_participants")
    .upsert(
      { challenge_id: challengeId, member_id: memberId, joined_at: new Date().toISOString() },
      { onConflict: "challenge_id,member_id", ignoreDuplicates: true }
    );
  if (error) {
    console.error("[challenges/join] insert failed:", error);
    return NextResponse.json({ ok: false, reason: "insert-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
