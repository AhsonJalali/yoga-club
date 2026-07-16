import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import { verifySession } from "../../../lib/session-token";

const COOKIE_NAME = "yc_member";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 500 });
  }

  // Read the cookie straight off NextRequest (see fix history — cookies() can
  // return an empty jar in Route Handlers on Next 16).
  const memberId = verifySession(
    req.cookies.get(COOKIE_NAME)?.value ??
      parseCookieHeader(req.headers.get("cookie"))[COOKIE_NAME]
  );
  if (!memberId) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const sessionDate = String(formData.get("sessionDate") ?? "");
  const status = String(formData.get("status") ?? "");
  const ratingRaw = formData.get("rating");
  const photoUrlRaw = formData.get("photo_url");

  if (!sessionDate) return NextResponse.json({ ok: false, reason: "missing-date" }, { status: 400 });

  const sb = supabase();

  // Branch 1: PATCH-style — merge rating/photo_url onto an existing row without
  // touching status. Never NULLs out existing values.
  if (!status) {
    const updates: Record<string, unknown> = {};
    if (hasValue(ratingRaw)) {
      const rating = parseInt(String(ratingRaw), 10);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ ok: false, reason: "bad-rating" }, { status: 400 });
      }
      updates.rating = rating;
    }
    if (hasValue(photoUrlRaw)) updates.photo_url = String(photoUrlRaw);
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, reason: "nothing-to-update" }, { status: 400 });
    }
    const { data: existing, error: lookupErr } = await sb
      .from("check_ins").select("id").eq("member_id", memberId).eq("session_date", sessionDate).maybeSingle();
    if (lookupErr) return NextResponse.json({ ok: false, reason: "lookup-failed" }, { status: 500 });
    if (!existing) return NextResponse.json({ ok: false, reason: "no-check-in" }, { status: 404 });
    const { error: updErr } = await sb
      .from("check_ins").update(updates).eq("member_id", memberId).eq("session_date", sessionDate);
    if (updErr) return NextResponse.json({ ok: false, reason: "patch-failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (!["done", "skipped", "clear"].includes(status)) {
    return NextResponse.json({ ok: false, reason: "bad-status" }, { status: 400 });
  }

  if (status === "clear") {
    const { error } = await sb
      .from("check_ins").delete().eq("member_id", memberId).eq("session_date", sessionDate);
    if (error) return NextResponse.json({ ok: false, reason: "delete-failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Look up first so we don't wipe rating/photo_url on a plain status write.
  const { data: existing, error: lookupErr } = await sb
    .from("check_ins").select("id").eq("member_id", memberId).eq("session_date", sessionDate).maybeSingle();
  if (lookupErr) return NextResponse.json({ ok: false, reason: "lookup-failed" }, { status: 500 });

  const rating = hasValue(ratingRaw) ? parseInt(String(ratingRaw), 10) : null;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ ok: false, reason: "bad-rating" }, { status: 400 });
  }
  const photoUrl = hasValue(photoUrlRaw) ? String(photoUrlRaw) : null;

  if (existing) {
    const updates: Record<string, unknown> = { status };
    if (rating !== null) updates.rating = rating;
    if (photoUrl !== null) updates.photo_url = photoUrl;
    const { error } = await sb
      .from("check_ins").update(updates).eq("member_id", memberId).eq("session_date", sessionDate);
    if (error) return NextResponse.json({ ok: false, reason: "update-failed" }, { status: 500 });
  } else {
    // New row — tag it to the challenge whose window contains this date.
    const challengeId = await resolveChallengeId(sb, sessionDate);
    const payload: Record<string, unknown> = {
      member_id: memberId, session_date: sessionDate, status, class_id: null, note: null, challenge_id: challengeId,
    };
    if (rating !== null) payload.rating = rating;
    if (photoUrl !== null) payload.photo_url = photoUrl;
    const { error } = await sb.from("check_ins").insert(payload);
    if (error) return NextResponse.json({ ok: false, reason: "insert-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// The challenge whose [start_date, end_date] window contains the session date.
async function resolveChallengeId(
  sb: ReturnType<typeof supabase>,
  sessionDate: string
): Promise<string | null> {
  const { data } = await sb
    .from("challenges")
    .select("id, start_date")
    .lte("start_date", sessionDate)
    .gte("end_date", sessionDate)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

function hasValue(v: FormDataEntryValue | null): boolean {
  return v !== null && v !== undefined && String(v).length > 0;
}

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}
