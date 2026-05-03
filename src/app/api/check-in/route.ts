import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";

const COOKIE_NAME = "yc_member";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 500 });
  }

  // Read cookie directly off NextRequest. Avoids any next/headers async-context
  // quirk that intermittently returns an empty jar in Route Handlers on Next 16
  // (see fix history — cookies() worked fine in Server Components but returned
  // nothing here in production, causing spurious 401s after a valid sign-in).
  const memberId =
    req.cookies.get(COOKIE_NAME)?.value ??
    parseCookieHeader(req.headers.get("cookie"))[COOKIE_NAME];
  if (!memberId) {
    console.warn("[check-in] no cookie", {
      hasHeader: Boolean(req.headers.get("cookie")),
      headerLen: req.headers.get("cookie")?.length ?? 0,
    });
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const sessionDate = String(formData.get("sessionDate") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!sessionDate) return NextResponse.json({ ok: false, reason: "missing-date" }, { status: 400 });
  if (!["done", "skipped", "clear"].includes(status)) {
    return NextResponse.json({ ok: false, reason: "bad-status" }, { status: 400 });
  }

  const sb = supabase();
  if (status === "clear") {
    const { error } = await sb
      .from("check_ins")
      .delete()
      .eq("member_id", memberId)
      .eq("session_date", sessionDate);
    if (error) {
      console.error("[check-in] delete failed:", error);
      return NextResponse.json({ ok: false, reason: "delete-failed" }, { status: 500 });
    }
  } else {
    const { error } = await sb
      .from("check_ins")
      .upsert(
        { member_id: memberId, session_date: sessionDate, status, class_id: null, note: null },
        { onConflict: "member_id,session_date" }
      );
    if (error) {
      console.error("[check-in] upsert failed:", error);
      return NextResponse.json({ ok: false, reason: "upsert-failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

// Manual fallback parser. NextRequest.cookies normally handles this, but we
// double-check off the raw header in case of an edge runtime quirk.
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
