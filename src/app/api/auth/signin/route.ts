import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { verifyPassword, escapeLike } from "../../../../lib/auth";
import { signSession, isSessionSecretConfigured, SESSION_TTL_S } from "../../../../lib/session-token";
import { isRateLimited, recordFailure, clearFailures } from "../../../../lib/rate-limit";

const COOKIE_NAME = "yc_member";

function back(req: NextRequest, error?: string): NextResponse {
  const url = new URL("/login", req.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return back(req, "invalid");
  if (!isSupabaseConfigured()) return back(req, "server");
  if (!isSessionSecretConfigured()) {
    console.error("[signin] SESSION_SECRET not set");
    return back(req, "server");
  }
  if (isRateLimited(`signin:${email}`)) return back(req, "slow-down");

  const sb = supabase();
  const { data: member, error: lookupErr } = await sb
    .from("members")
    .select("id, password_hash")
    .ilike("email", escapeLike(email))
    .maybeSingle();
  if (lookupErr) {
    console.error("[signin] lookup failed:", lookupErr);
    return back(req, "server");
  }
  if (!member?.password_hash) {
    recordFailure(`signin:${email}`);
    return back(req, "credentials");
  }

  const ok = await verifyPassword(password, member.password_hash);
  if (!ok) {
    recordFailure(`signin:${email}`);
    return back(req, "credentials");
  }
  clearFailures(`signin:${email}`);

  const response = NextResponse.redirect(new URL("/", req.url), 303);
  response.cookies.set(COOKIE_NAME, signSession(member.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_S,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
