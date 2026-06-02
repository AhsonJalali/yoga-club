import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3, Flame, CalendarDays, Sparkles, DollarSign, Trophy } from "lucide-react";
import { currentMember } from "../../lib/session";
import { supabase, isSupabaseConfigured, Member, ClassItem, CheckIn, Challenge, ChallengeParticipant } from "../../lib/supabase";
import { DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS, DEMO_CHALLENGES, DEMO_PARTICIPANTS } from "../../lib/demo";
import { isoDate, todayEastern } from "../../lib/schedule";
import { challengeIdsForMember, windowLabel } from "../../lib/challenges";
import { BUCKETS, BucketKey, bucketMeta, computeRecap, MemberRecap } from "../../lib/recap";
import { Avatar } from "../../components/Avatar";

export const dynamic = "force-dynamic";

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ProfilePage() {
  const me = await currentMember();
  if (!me) redirect("/login");

  let members: Member[];
  let classes: ClassItem[];
  let checkIns: CheckIn[];
  let challenges: Challenge[];
  let participants: ChallengeParticipant[];

  if (isSupabaseConfigured()) {
    const sb = supabase();
    const [a, b, c, d, e] = await Promise.all([
      sb.from("members").select("*").order("name"),
      sb.from("classes").select("*"),
      sb.from("check_ins").select("*"),
      sb.from("challenges").select("*"),
      sb.from("challenge_participants").select("*"),
    ]);
    members = (a.data ?? []) as Member[];
    classes = (b.data ?? []) as ClassItem[];
    checkIns = (c.data ?? []) as CheckIn[];
    challenges = (d.data ?? []) as Challenge[];
    participants = (e.data ?? []) as ChallengeParticipant[];
  } else {
    members = DEMO_MEMBERS;
    classes = DEMO_CLASSES;
    checkIns = DEMO_CHECK_INS;
    challenges = DEMO_CHALLENGES;
    participants = DEMO_PARTICIPANTS;
  }

  const todayIso = isoDate(todayEastern());
  const joinedIds = challengeIdsForMember(participants, me.id);

  // Per-challenge stats for every challenge I joined, newest first.
  const mine = challenges
    .filter((c) => joinedIds.has(c.id))
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1))
    .map((c) => {
      const { byMember } = computeRecap(members, classes, checkIns, c, participants);
      return { challenge: c, recap: byMember.get(me.id) };
    })
    .filter((x): x is { challenge: Challenge; recap: MemberRecap } => Boolean(x.recap));

  // Lifetime aggregates.
  const totalSessions = mine.reduce((s, x) => s + x.recap.sessions, 0);
  const totalMinutes = mine.reduce((s, x) => s + x.recap.minutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const owedTotal = mine.reduce((s, x) => s + x.recap.owed, 0);
  const challengesCompleted = mine.filter((x) => x.challenge.end_date < todayIso).length;
  const ratedChallenges = mine.filter((x) => x.recap.eligible > 0);
  const avgCompletion = ratedChallenges.length
    ? Math.round(ratedChallenges.reduce((s, x) => s + x.recap.completionPct, 0) / ratedChallenges.length)
    : 0;

  // Lifetime favorite time of day across all challenges.
  const totals: Record<BucketKey, number> = { earlyMorning: 0, morning: 0, afternoon: 0, evening: 0, lateNight: 0 };
  for (const x of mine) for (const b of x.recap.buckets) totals[b.key] += b.count;
  let favKey: BucketKey | null = null;
  for (const b of BUCKETS) if (totals[b.key] > 0 && (favKey === null || totals[b.key] > totals[favKey])) favKey = b.key;
  const fav = favKey ? bucketMeta(favKey) : null;

  // Most-practiced weekday across joined challenges.
  const dow = new Array(7).fill(0);
  for (const c of checkIns) {
    if (c.member_id !== me.id || c.status !== "done" || !c.challenge_id || !joinedIds.has(c.challenge_id)) continue;
    dow[new Date(c.session_date + "T00:00:00").getDay()] += 1;
  }
  const topDowIdx = dow.some((n) => n > 0) ? dow.indexOf(Math.max(...dow)) : -1;

  return (
    <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
      <Link href="/?view=club" className="fade-up inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Yoga Club
      </Link>

      {/* header */}
      <div className="fade-up mt-5 flex items-center gap-4">
        <Avatar name={me.name} size={56} />
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">{me.name}</h1>
          <p className="text-sm text-muted">
            {mine.length} {mine.length === 1 ? "challenge" : "challenges"} joined · {challengesCompleted} completed
          </p>
        </div>
      </div>

      {mine.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center text-muted">
          You haven&apos;t joined a challenge yet. Once you do, your all-time stats show up here.
        </p>
      ) : (
        <>
          {/* lifetime totals */}
          <section className="fade-up-2 mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={<Flame className="h-4 w-4" />} value={`${totalSessions}`} label="total sessions" accent="coral" />
            <Stat icon={<Clock3 className="h-4 w-4" />} value={`${totalHours}`} label="hours on the mat" accent="clay" />
            <Stat icon={<CalendarDays className="h-4 w-4" />} value={`${challengesCompleted}`} label="challenges done" accent="sage" />
            <Stat icon={<Sparkles className="h-4 w-4" />} value={`${avgCompletion}%`} label="avg consistency" accent="sage" />
          </section>

          {/* lifetime patterns + money */}
          <section className="fade-up-2 mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Panel label="Favorite time">
              <div className="font-display text-2xl font-medium text-ink">{fav ? `${fav.emoji} ${fav.label}` : "—"}</div>
              <p className="mt-1 text-xs text-faint">{fav ? `your go-to window, ${fav.range}` : "no times logged yet"}</p>
            </Panel>
            <Panel label="Go-to day">
              <div className="font-display text-2xl font-medium text-ink">{topDowIdx >= 0 ? DOW_NAMES[topDowIdx] : "—"}</div>
              <p className="mt-1 text-xs text-faint">{topDowIdx >= 0 ? `${dow[topDowIdx]} sessions on this day` : "—"}</p>
            </Panel>
            <Panel label="Into the pot, all-time">
              <div className={`font-display text-2xl font-medium ${owedTotal > 0 ? "text-ink" : "text-sage"}`}>${owedTotal}</div>
              <p className="mt-1 text-xs text-faint">{owedTotal > 0 ? "across all challenges" : "spotless across the board"}</p>
            </Panel>
          </section>

          {/* per-challenge history / consistency trend */}
          <section className="fade-up-3 mt-8">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-clay" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink">Challenge by challenge</h2>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
              <ul>
                {mine.map(({ challenge: c, recap: r }) => {
                  const ended = c.end_date < todayIso;
                  return (
                    <li key={c.id} className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-0 sm:flex-row sm:items-center">
                      <div className="min-w-0 sm:w-48">
                        <p className="font-medium text-ink">{c.name}</p>
                        <p className="text-xs text-faint">{windowLabel(c)} · {ended ? "completed" : "in progress"}</p>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-line-strong">
                          <div className="h-full rounded-full bg-coral" style={{ width: `${r.completionPct}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:w-56 sm:justify-end">
                        <span className="text-sm tabular-nums text-muted">{r.completed}/{r.eligible} · {r.completionPct}%</span>
                        <span className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${r.owed > 0 ? "text-ink" : "text-sage"}`}>
                          <DollarSign className="h-3.5 w-3.5" />{r.owed}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Stat({ icon, value, label, accent }: { icon: React.ReactNode; value: string; label: string; accent: "coral" | "clay" | "sage" }) {
  const color = accent === "coral" ? "text-coral" : accent === "clay" ? "text-clay" : "text-sage";
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <span className={color}>{icon}</span>
      <div className="font-display mt-2 text-3xl font-medium tabular-nums text-ink">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-faint">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
