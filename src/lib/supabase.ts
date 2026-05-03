import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

export function supabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local."
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export type Member = {
  id: string;
  name: string;
  venmo_handle: string | null;
  created_at: string;
};

export type ClassItem = {
  id: string;
  title: string;
  instructor: string;
  youtube_url: string;
  duration_minutes: number;
  tags: string[];
};

export type CheckInStatus = "done" | "skipped";

export type CheckIn = {
  id: string;
  member_id: string;
  class_id: string | null;
  session_date: string;
  status: CheckInStatus;
  note: string | null;
  created_at: string;
};
