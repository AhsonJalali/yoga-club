import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";

const COOKIE_NAME = "yc_member";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 500 });
  }

  const jar = await cookies();
  const memberId = jar.get(COOKIE_NAME)?.value;
  if (!memberId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

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
