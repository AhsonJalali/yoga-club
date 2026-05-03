"use server";

import { redirect } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { setMemberCookie } from "../../lib/session";

export async function loginAction(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  const code = String(formData.get("code") ?? "");

  const expected = process.env.CLUB_CODE;
  if (!expected) {
    redirect("/login?error=server");
  }
  if (code !== expected) {
    redirect("/login?error=code");
  }

  const { data, error } = await supabase()
    .from("members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();

  if (error || !data) {
    redirect("/login?error=member");
  }

  await setMemberCookie(memberId);
  redirect("/");
}
