import { cookies } from "next/headers";
import { supabase, isSupabaseConfigured, Member } from "./supabase";
import { signSession, verifySession, SESSION_TTL_S } from "./session-token";

const COOKIE_NAME = "yc_member";

export async function setMemberCookie(memberId: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, signSession(memberId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_S,
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
  const id = verifySession(jar.get(COOKIE_NAME)?.value);
  if (!id) return null;
  const { data, error } = await supabase().from("members").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as Member;
}
