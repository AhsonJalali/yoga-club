import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { verifySession } from "../../../../lib/session-token";
import { COOKIE_NAME, parseCookieHeader } from "../../../../lib/cookies";

const BUCKET = "check-in-photos"; // reuse the existing public bucket, avatars/ prefix

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Uploads a profile picture to storage and saves its public URL on the member.
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

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, reason: "missing-file" }, { status: 400 });
  }

  const sb = supabase();
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `avatars/${memberId}-${rand}.jpg`;
  const arrayBuf = await file.arrayBuffer();

  const { error: uploadErr } = await sb.storage
    .from(BUCKET)
    .upload(path, arrayBuf, { contentType: file.type || "image/jpeg", upsert: true });
  if (uploadErr) {
    console.error("[avatar] upload failed:", uploadErr);
    return NextResponse.json({ ok: false, reason: "upload-failed" }, { status: 500 });
  }

  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const { error: updateErr } = await sb
    .from("members")
    .update({ avatar_url: publicUrl })
    .eq("id", memberId);
  if (updateErr) {
    console.error("[avatar] member update failed:", updateErr);
    return NextResponse.json({ ok: false, reason: "update-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: publicUrl });
}
