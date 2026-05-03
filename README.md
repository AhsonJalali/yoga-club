# Yoga Club

A small accountability app for me and ~5–15 friends. Three required sessions a week (Mon · Wed · Fri). Miss one, you owe $50 to [@AceJalali](https://venmo.com/AceJalali). The vibe is *building a habit together*, not punishing.

## Stack

- Next.js 15 (App Router, TypeScript, Tailwind v4)
- Supabase (Postgres) — free tier
- No real auth: pick your name + enter a shared club code, stored in an httpOnly cookie

## Deploying from scratch

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor** → run `supabase/schema.sql` (creates `members`, `classes`, `check_ins`).
3. **SQL Editor** → run `supabase/seed.sql` (12 curated Yoga With Adriene classes).
4. **Table Editor** → `members` → insert a row per friend (`name` is required, `venmo_handle` optional).
5. **Project Settings → API** → copy the Project URL, the `anon` public key, and the `service_role` key.

### 2. Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo. Framework auto-detects as Next.js.
3. **Environment Variables** — add the four below. Set them for Production, Preview, and Development.
4. Click **Deploy**.

```
NEXT_PUBLIC_SUPABASE_URL       = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = eyJ... (anon public key)
SUPABASE_SERVICE_ROLE_KEY      = eyJ... (service_role key — keep secret)
CLUB_CODE                      = downward-dog-2026  (any memorable string)
```

Share `CLUB_CODE` with friends out of band (text/Signal). They use it once per device.

### 3. Local dev

```bash
cp .env.example .env.local   # then fill in the four vars above
npm install
npm run dev
```

Open http://localhost:3000.

## How it works

- Logged-in user marks their own session **Yes** or **No** for the day. Honor system.
- "No" on a required day pops a Venmo modal and adds $50 to the **Group Pot**.
- Past required days with no answer auto-count as missed at midnight (logic recomputes on every page load).
- Leaderboard ranks by fewest missed sessions; calendar shows the designated class for every required day.

## Schedule

- **Mon · Wed · Fri** — required, ~20 min beginner-friendly
- **Tue · Thu · Sat · Sun** — recovery, no penalty
- **Friday** can stretch to 30–40 min restorative

Edit `src/lib/schedule.ts` to change required days, penalty amount, or Venmo handle.

## Adding members later

Insert directly into the `members` table in Supabase. They show up in the login dropdown immediately.

## Files of note

- `src/lib/schedule.ts` — required days, $50 penalty, Venmo handle, day-theme metadata
- `src/lib/picker.ts` — deterministic "class of the day" picker
- `src/components/CheckInRoster.tsx` — Yes/No card + Venmo popup
- `supabase/schema.sql` + `supabase/seed.sql` — database setup
