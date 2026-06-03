import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";

const COOKIE_NAME = "yc_member";
const BUCKET = "check-in-photos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Uploads a session photo to Supabase Storage and links its public URL back
// onto the matching check_ins row. Caller must already own a check_ins row
// for (memberId, sessionDate) — we don't create one here on purpose; the
// photo modal opens only after a successful Yes-I-did POST.
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 500 });
  }

  const memberId =
    req.cookies.get(COOKIE_NAME)?.value ??
    parseCookieHeader(req.headers.get("cookie"))[COOKIE_NAME];
  if (!memberId) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const sessionDate = String(formData.get("sessionDate") ?? "");
  const file = formData.get("file");

  if (!sessionDate) {
    return NextResponse.json({ ok: false, reason: "missing-date" }, { status: 400 });
  }
  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, reason: "missing-file" }, { status: 400 });
  }

  const sb = supabase();
  const { data: existing, error: lookupErr } = await sb
    .from("check_ins")
    .select("id")
    .eq("member_id", memberId)
    .eq("session_date", sessionDate)
    .maybeSingle();
  if (lookupErr) {
    console.error("[upload-photo] lookup failed:", lookupErr);
    return NextResponse.json({ ok: false, reason: "lookup-failed" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ ok: false, reason: "no-check-in" }, { status: 404 });
  }

  // Filename: <memberId>/<sessionDate>-<rand>.jpg. Client compresses to JPEG
  // before sending, so we always store as .jpg even if the browser quirks
  // and reports image/png or similar — Supabase doesn't sniff content.
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${memberId}/${sessionDate}-${rand}.jpg`;

  const arrayBuf = await file.arrayBuffer();
  const { error: uploadErr } = await sb.storage
    .from(BUCKET)
    .upload(path, arrayBuf, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (uploadErr) {
    console.error("[upload-photo] upload failed:", uploadErr);
    return NextResponse.json({ ok: false, reason: "upload-failed" }, { status: 500 });
  }

  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const { error: updateErr } = await sb
    .from("check_ins")
    .update({ photo_url: publicUrl })
    .eq("member_id", memberId)
    .eq("session_date", sessionDate);
  if (updateErr) {
    console.error("[upload-photo] update failed:", updateErr);
    return NextResponse.json({ ok: false, reason: "update-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: publicUrl });
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
