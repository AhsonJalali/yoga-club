# Yoga Club

A small accountability app for me and ~5–15 friends. Three required sessions a week (Mon · Wed · Fri). Miss one, you owe $25 to [@AceJalali](https://venmo.com/AceJalali). The vibe is *building a habit together*, not punishing.

## Stack

- Next.js 15 (App Router, TypeScript, Tailwind v4)
- Supabase (Postgres) — free tier
- Self-serve auth: name + email + password (bcrypt-hashed). httpOnly cookie session. No email verification — honor system all the way down.

## Deploying from scratch

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor** → run `supabase/schema.sql` (creates `members`, `classes`, `check_ins`).
3. **SQL Editor** → run `supabase/seed.sql` (12 curated Yoga With Adriene classes).
4. (Optional) **Table Editor** → `members` → pre-seed anyone you want. Otherwise members self-register on first login (name + email + password).
5. **Project Settings → API** → copy the Project URL, the `anon` public key, and the `service_role` key.

### 2. Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo. Framework auto-detects as Next.js.
3. **Environment Variables** — add the vars below. Set them for Production, Preview, and Development.
4. Click **Deploy**.

Required — the app won't function without these (sign-in fails outright without `SESSION_SECRET`):

```
NEXT_PUBLIC_SUPABASE_URL       = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = sb_publishable_... (or eyJ... anon public key)
SUPABASE_SERVICE_ROLE_KEY      = sb_secret_...     (or eyJ... service_role key — keep secret)
SESSION_SECRET                 = (generate with: openssl rand -hex 32)
```

Optional — see `.env.example` for what each one gates:

```
CLUB_INVITE_CODE     # require an invite code to self-register; unset = open registration
RESEND_API_KEY       # send real password-reset / reminder emails; unset = logged to console only
RESEND_FROM          # "from" address for those emails (needs a verified Resend domain)
NEXT_PUBLIC_APP_URL  # base URL used to build links in emails; falls back to the Vercel deploy URL
CRON_SECRET          # authenticates the daily reminder cron; Vercel sends it automatically when set
```

### 3. Local dev

```bash
cp .env.example .env.local   # then fill in the vars above
npm install
npm run dev
```

Open http://localhost:3000.

## How it works

- Logged-in user marks their own session **Yes** or **No** for the day. Honor system.
- "No" on a required day pops a Venmo modal and adds $25 to the **Group Pot**.
- Past required days with no answer auto-count as missed at midnight (logic recomputes on every page load).
- Leaderboard ranks by fewest missed sessions; calendar shows the designated class for every required day.
- A daily cron (`/api/cron/remind`, see `vercel.json`) emails anyone who hasn't checked in yet on a required day — no-op if `RESEND_API_KEY` isn't set. Not linked from anywhere in the app.

## Schedule

- **Mon · Wed · Fri** — required, ~20 min beginner-friendly
- **Tue · Thu · Sat · Sun** — recovery, no penalty
- **Friday** can stretch to 30–40 min restorative

Edit `src/lib/schedule.ts` to change required days, penalty amount, or Venmo handle.

## Adding members later

Just share the URL. New members register themselves on the login screen with name + email + password. No verification, honor system.

## Files of note

- `src/lib/schedule.ts` — required days, $25 penalty, Venmo handle, day-theme metadata
- `src/lib/picker.ts` — deterministic "class of the day" picker
- `src/components/CheckInRoster.tsx` — Yes/No card + Venmo popup
- `supabase/schema.sql` + `supabase/seed.sql` — database setup
