import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { verifyPassword } from "../../../../lib/auth";

const COOKIE_NAME = "yc_member";
const MAX_AGE = 365 * 24 * 60 * 60;

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

  const sb = supabase();
  const { data: member, error: lookupErr } = await sb
    .from("members")
    .select("id, password_hash")
    .ilike("email", email)
    .maybeSingle();
  if (lookupErr) {
    console.error("[signin] lookup failed:", lookupErr);
    return back(req, "server");
  }
  if (!member?.password_hash) return back(req, "credentials");

  const ok = await verifyPassword(password, member.password_hash);
  if (!ok) return back(req, "credentials");

  const response = NextResponse.redirect(new URL("/", req.url), 303);
  response.cookies.set(COOKIE_NAME, member.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
