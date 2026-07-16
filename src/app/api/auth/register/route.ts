import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { hashPassword, escapeLike } from "../../../../lib/auth";
import { signSession, isSessionSecretConfigured, SESSION_TTL_S } from "../../../../lib/session-token";

const COOKIE_NAME = "yc_member";
const PASSWORD_MIN = 6;

function back(req: NextRequest, error?: string): NextResponse {
  const url = new URL("/login", req.url);
  url.searchParams.set("mode", "register");
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const invite = String(formData.get("invite") ?? "").trim();

  if (!email || !name || !password) return back(req, "invalid");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return back(req, "email");
  if (password.length < PASSWORD_MIN) return back(req, "short");
  // Registration is invite-only when CLUB_INVITE_CODE is set (leave it unset
  // in dev/demo to keep sign-up open).
  const requiredInvite = process.env.CLUB_INVITE_CODE;
  if (requiredInvite && invite.toLowerCase() !== requiredInvite.trim().toLowerCase()) {
    return back(req, "invite");
  }
  if (!isSupabaseConfigured()) return back(req, "server");
  if (!isSessionSecretConfigured()) {
    console.error("[register] SESSION_SECRET not set");
    return back(req, "server");
  }

  const sb = supabase();
  const { data: existing, error: lookupErr } = await sb
    .from("members")
    .select("id")
    .ilike("email", escapeLike(email))
    .maybeSingle();
  if (lookupErr) {
    console.error("[register] lookup failed:", lookupErr);
    return back(req, "server");
  }
  if (existing) return back(req, "exists");

  const password_hash = await hashPassword(password);
  const { data: created, error } = await sb
    .from("members")
    .insert({ email, name, password_hash })
    .select("id")
    .single();
  if (error || !created) {
    console.error("[register] insert failed:", error);
    return back(req, "server");
  }

  const response = NextResponse.redirect(new URL("/", req.url), 303);
  response.cookies.set(COOKIE_NAME, signSession(created.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_S,
    secure: process.env.NODE_ENV === "production",
  });
  // Reset the rules-seen flag so the new member sees the onboarding modal.
  response.cookies.set("seen_rules", "", { maxAge: 0, path: "/" });
  return response;
}
