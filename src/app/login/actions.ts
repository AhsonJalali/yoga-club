"use server";

import { redirect } from "next/navigation";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { setMemberCookie } from "../../lib/session";
import { hashPassword, verifyPassword } from "../../lib/auth";

const PASSWORD_MIN = 6;

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) redirect("/login?error=invalid");
  if (!isSupabaseConfigured()) redirect("/login?error=server");

  const sb = supabase();
  const { data: member } = await sb
    .from("members")
    .select("id, password_hash")
    .ilike("email", email)
    .maybeSingle();

  if (!member?.password_hash) redirect("/login?error=credentials");
  const ok = await verifyPassword(password, member.password_hash);
  if (!ok) redirect("/login?error=credentials");

  await setMemberCookie(member.id);
  redirect("/");
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "");

  if (!email || !name || !password) redirect("/login?mode=register&error=invalid");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/login?mode=register&error=email");
  if (password.length < PASSWORD_MIN) redirect("/login?mode=register&error=short");

  const expected = process.env.CLUB_CODE;
  if (!expected || !isSupabaseConfigured()) redirect("/login?mode=register&error=server");
  if (code !== expected) redirect("/login?mode=register&error=code");

  const sb = supabase();

  const { data: existing } = await sb
    .from("members")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (existing) redirect("/login?mode=register&error=exists");

  const password_hash = await hashPassword(password);
  const { data: created, error } = await sb
    .from("members")
    .insert({ email, name, password_hash })
    .select("id")
    .single();
  if (error || !created) redirect("/login?mode=register&error=server");

  await setMemberCookie(created.id);
  redirect("/");
}
