// Evening reminder cron. Vercel Hobby only allows daily crons, so this is
// scheduled at 0 1 * * * UTC (= 8 PM EST winter, 9 PM EDT summer — see
// vercel.json). The route itself re-checks today is a required day in ET,
// so a stray invocation at the wrong hour is a no-op.
//
// Flow:
//   1. Auth check: if CRON_SECRET is set, require `Authorization: Bearer ...`
//      (Vercel cron sets this automatically when the env var is configured).
//   2. Confirm today is Mon/Wed/Fri in Eastern time. Otherwise skip.
//   3. Pull all members + today's check-ins, diff, email everyone missing.
//   4. sendEmail() degrades to console.log when RESEND_API_KEY is absent, so
//      this is safe to wire up before Resend keys exist.
//
// Not linked from anywhere in the app and intentionally not in robots/sitemap.
import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { sendEmail, appBaseUrl } from "../../../../lib/email";
import { todayEastern, todayEasternIso } from "../../../../lib/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DayKindLabel = "foundation" | "mobility" | "stretch";

function dayCopy(dow: number): { kind: DayKindLabel; headline: string; vibe: string } {
  if (dow === 1) {
    return {
      kind: "foundation",
      headline: "Foundation Monday",
      vibe: "Even 20 minutes of gentle flow counts — set the tone for the week.",
    };
  }
  if (dow === 3) {
    return {
      kind: "mobility",
      headline: "Mobility Wednesday",
      vibe: "Loosen up the middle of the week with some mobility and balance work.",
    };
  }
  // dow === 5 (already gated to REQUIRED_DOWS upstream)
  return {
    kind: "stretch",
    headline: "Stretch Friday",
    vibe: "Ease into the weekend with a stretch or restorative session.",
  };
}

function renderHtml(name: string, headline: string, vibe: string, url: string): string {
  // Inline styles only — most email clients strip <style> blocks. Zinc/dark
  // palette to roughly match the app shell.
  const safeName = name ? name.split(" ")[0] : "friend";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#14110d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e4dccd;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#14110d;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1b1713;border:1px solid #2c2620;border-radius:12px;padding:32px;">
            <tr><td>
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;">Yoga Club</p>
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;color:#f1ebe1;">${headline}</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#d4d4d8;">Hey ${escapeHtml(safeName)}, did you do yoga today?</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#a1a1aa;">${escapeHtml(vibe)} If you already practiced, just tap Yes so the leaderboard knows.</p>
              <p style="margin:0 0 24px;">
                <a href="${url}" style="display:inline-block;background:#e07a52;color:#14110d;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;font-size:15px;">Check in now</a>
              </p>
              <p style="margin:0;font-size:12px;color:#71717a;">No penalty if you genuinely rested — just mark it so the day doesn't count as missed.</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText(name: string, headline: string, vibe: string, url: string): string {
  const safeName = name ? name.split(" ")[0] : "friend";
  return `${headline}

Hey ${safeName}, did you do yoga today?

${vibe} If you already practiced, just tap Yes so the leaderboard knows.

Check in: ${url}

No penalty if you genuinely rested — just mark it so the day doesn't count as missed.`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function handle(req: NextRequest) {
  // Auth: Vercel cron sets Authorization: Bearer ${CRON_SECRET} when the env
  // var is configured. In local dev with no secret, allow the call through so
  // we can poke at the route manually.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    }
  }

  const today = todayEastern();
  const dow = today.getDay();
  const sessionDate = todayEasternIso();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 500 });
  }
  const sb = supabase();

  // Reminders are scoped to the active challenge: only on its required days,
  // and only to its enrolled participants.
  const { data: challenge } = await sb
    .from("challenges")
    .select("id, required_dows")
    .lte("start_date", sessionDate)
    .gte("end_date", sessionDate)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!challenge) {
    return NextResponse.json({ ok: true, skipped: "no active challenge" });
  }
  const requiredDows = (challenge.required_dows as number[] | null) ?? [1, 3, 5];
  if (!requiredDows.includes(dow)) {
    return NextResponse.json({ ok: true, skipped: "not a required day" });
  }

  const { data: parts, error: partErr } = await sb
    .from("challenge_participants")
    .select("member_id")
    .eq("challenge_id", challenge.id);
  if (partErr) {
    console.error("[cron/remind] participants query failed:", partErr);
    return NextResponse.json({ ok: false, reason: "participants-query-failed" }, { status: 500 });
  }
  const enrolledIds = new Set((parts ?? []).map((p) => p.member_id as string));

  const { data: allMembers, error: memberErr } = await sb
    .from("members")
    .select("id, email, name");
  if (memberErr) {
    console.error("[cron/remind] members query failed:", memberErr);
    return NextResponse.json({ ok: false, reason: "members-query-failed" }, { status: 500 });
  }
  const members = (allMembers ?? []).filter((m) => enrolledIds.has(m.id as string));

  const { data: checkIns, error: checkErr } = await sb
    .from("check_ins")
    .select("member_id")
    .eq("session_date", sessionDate);
  if (checkErr) {
    console.error("[cron/remind] check_ins query failed:", checkErr);
    return NextResponse.json({ ok: false, reason: "checkins-query-failed" }, { status: 500 });
  }

  const checkedIn = new Set((checkIns ?? []).map((c) => c.member_id as string));
  const unchecked = members.filter((m) => !checkedIn.has(m.id as string));

  const { kind, headline, vibe } = dayCopy(dow);
  const url = `${appBaseUrl()}/`;

  let sent = 0;
  const failures: Array<{ email: string; error: string }> = [];
  for (const m of unchecked) {
    const email = (m.email as string | null) ?? "";
    if (!email) continue;
    const name = (m.name as string | null) ?? "";
    const res = await sendEmail({
      to: email,
      subject: "Did you do yoga today?",
      html: renderHtml(name, headline, vibe, url),
      text: renderText(name, headline, vibe, url),
    });
    if (res.ok) sent += 1;
    else failures.push({ email, error: res.error ?? "unknown" });
  }

  return NextResponse.json({
    ok: true,
    dayKind: kind,
    sessionDate,
    totalMembers: members?.length ?? 0,
    alreadyCheckedIn: checkedIn.size,
    sent,
    failures: failures.length ? failures : undefined,
  });
}

// Vercel cron hits GET. Allow POST too in case anyone wires a manual trigger.
export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
