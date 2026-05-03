"use server";

import { redirect } from "next/navigation";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { setMemberCookie } from "../../lib/session";

export async function signInOrRegisterAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "");

  if (!email || !name) {
    redirect("/login?error=invalid");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/login?error=email");
  }

  const expected = process.env.CLUB_CODE;
  if (!expected || !isSupabaseConfigured()) {
    redirect("/login?error=server");
  }
  if (code !== expected) {
    redirect("/login?error=code");
  }

  const sb = supabase();

  // Find by email (case-insensitive via the unique index on lower(email)).
  const { data: existing } = await sb
    .from("members")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  let memberId = existing?.id;

  if (!memberId) {
    const { data: created, error } = await sb
      .from("members")
      .insert({ email, name })
      .select("id")
      .single();
    if (error || !created) {
      redirect("/login?error=server");
    }
    memberId = created.id;
  }

  await setMemberCookie(memberId);
  redirect("/");
}
