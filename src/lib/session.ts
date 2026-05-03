import { cookies } from "next/headers";
import { supabase, isSupabaseConfigured, Member } from "./supabase";

const COOKIE_NAME = "yc_member";
const MAX_AGE_DAYS = 365;

export async function setMemberCookie(memberId: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, memberId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearMemberCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function currentMember(): Promise<Member | null> {
  if (!isSupabaseConfigured()) {
    const { DEMO_ME } = await import("./demo");
    return DEMO_ME;
  }
  const jar = await cookies();
  const id = jar.get(COOKIE_NAME)?.value;
  if (!id) return null;
  const { data, error } = await supabase().from("members").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as Member;
}
