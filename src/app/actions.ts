"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { currentMember } from "../lib/session";

export async function checkInAction(formData: FormData) {
  const me = await currentMember();
  if (!me) redirect("/login");
  if (!isSupabaseConfigured()) return;

  const sessionDate = String(formData.get("sessionDate") ?? "");
  const classId = String(formData.get("classId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!sessionDate) return;

  await supabase()
    .from("check_ins")
    .upsert(
      {
        member_id: me.id,
        session_date: sessionDate,
        class_id: classId,
        note,
      },
      { onConflict: "member_id,session_date" }
    );

  revalidatePath("/");
  revalidatePath("/week");
  revalidatePath("/ledger");
}

export async function undoCheckInAction(formData: FormData) {
  const me = await currentMember();
  if (!me) redirect("/login");
  if (!isSupabaseConfigured()) return;

  const sessionDate = String(formData.get("sessionDate") ?? "");
  if (!sessionDate) return;

  await supabase()
    .from("check_ins")
    .delete()
    .eq("member_id", me.id)
    .eq("session_date", sessionDate);

  revalidatePath("/");
}

// Honor-system: the logged-in user marks their own status for a given date.
// status: "done" → did the session; "skipped" → admitted miss; "clear" → undo.
export async function setStatusAction(sessionDate: string, status: "done" | "skipped" | "clear") {
  const me = await currentMember();
  if (!me) redirect("/login");
  if (!sessionDate) return;
  if (!isSupabaseConfigured()) return;

  const sb = supabase();
  if (status === "clear") {
    await sb.from("check_ins").delete().eq("member_id", me.id).eq("session_date", sessionDate);
  } else {
    await sb
      .from("check_ins")
      .upsert(
        { member_id: me.id, session_date: sessionDate, status, class_id: null, note: null },
        { onConflict: "member_id,session_date" }
      );
  }

  revalidatePath("/");
}
