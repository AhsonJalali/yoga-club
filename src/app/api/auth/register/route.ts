import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { hashPassword } from "../../../../lib/auth";

const COOKIE_NAME = "yc_member";
const MAX_AGE = 365 * 24 * 60 * 60;
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

  if (!email || !name || !password) return back(req, "invalid");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return back(req, "email");
  if (password.length < PASSWORD_MIN) return back(req, "short");
  if (!isSupabaseConfigured()) return back(req, "server");

  const sb = supabase();
  const { data: existing, error: lookupErr } = await sb
    .from("members")
    .select("id")
    .ilike("email", email)
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
  response.cookies.set(COOKIE_NAME, created.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
