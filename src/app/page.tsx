import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Heart, PlayCircle, ExternalLink, Moon, CheckCircle2, Sunrise, Waves, Leaf, CalendarDays, Sparkles, Star } from "lucide-react";
import { currentMember } from "../lib/session";
import { supabase, isSupabaseConfigured, Member, ClassItem, CheckIn, Challenge, ChallengeParticipant } from "../lib/supabase";
import { DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS, DEMO_CHALLENGES, DEMO_PARTICIPANTS } from "../lib/demo";
import { isoDate, isRequiredDay, VENMO_HANDLE, venmoUrl, nextRequiredDay, dayTheme, todayEastern } from "../lib/schedule";
import { currentChallenge, upcomingChallenge, lastEndedChallenge, revealedRecapChallenge, joinOpen, participantsFor, windowLabel, requiredDowsLabel } from "../lib/challenges";
import { requiredDatesBetween } from "../lib/recap";
import { assignChallengeClasses } from "../lib/picker";
import { youtubeEmbedUrl, youtubeThumb } from "../lib/youtube";
import { Avatar } from "../components/Avatar";
import { CheckInRoster } from "../components/CheckInRoster";
import { JoinChallengeCard } from "../components/JoinChallengeCard";
import { MomentBadge, ShareMomentButton } from "../components/Moment";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
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

  const today = todayEastern();
  const todayIso = isoDate(today);
  const { view } = await searchParams;

  // Between challenges, a revealed recap is the landing page (preserves the
  // "May recap is the first thing you see" behavior). Once a new challenge is
  // active, the home page takes over again.
  const current = currentChallenge(challenges, todayIso);
  const recapChallenge = revealedRecapChallenge(challenges);
  if (!current && recapChallenge && view !== "club") redirect("/recap");

  // The challenge the home page focuses on: the active one, else the next
  // upcoming, else the most recent.
  const focus = current ?? upcomingChallenge(challenges, todayIso) ?? lastEndedChallenge(challenges, todayIso);

  if (!focus) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-medium text-ink">No challenge yet</h1>
        <p className="mt-3 text-muted">A new challenge hasn&apos;t been set up. Hang tight.</p>
      </main>
    );
  }

  const fParticipants = participantsFor(participants, focus.id);
  const joinedById = new Map(fParticipants.map((p) => [p.member_id, p.joined_at.slice(0, 10)]));
  const roster = members
    .filter((m) => joinedById.has(m.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const enrolledMe = joinedById.has(me.id);
  const isActive = focus.start_date <= todayIso && todayIso <= focus.end_date;
  const beforeStart = todayIso < focus.start_date;
  const afterEnd = todayIso > focus.end_date;
  const joinable = !enrolledMe && joinOpen(focus, todayIso);
  const requiredToday = isActive && isRequiredDay(today, focus.required_dows);
  const recapReady = revealedRecapChallenge(challenges);

  // Focus-scoped check-ins (tagged to this challenge, or untagged-but-in-window).
  const inFocus = (c: CheckIn) =>
    c.challenge_id ? c.challenge_id === focus.id : c.session_date >= focus.start_date && c.session_date <= focus.end_date;
  const checkInsByMemberDate = new Map<string, CheckIn>();
  const doneByDate = new Map<string, Set<string>>();
  const ratingsByDate = new Map<string, number[]>(); // cumulative session ratings per day
  for (const c of checkIns) {
    if (!inFocus(c)) continue;
    checkInsByMemberDate.set(`${c.member_id}|${c.session_date}`, c);
    if (c.status === "done") {
      const set = doneByDate.get(c.session_date) ?? new Set<string>();
      set.add(c.member_id);
      doneByDate.set(c.session_date, set);
      if (typeof c.rating === "number") {
        const arr = ratingsByDate.get(c.session_date) ?? [];
        arr.push(c.rating);
        ratingsByDate.set(c.session_date, arr);
      }
    }
  }
  const avgRatingFor = (dateIso: string): { avg: number; count: number } | null => {
    const arr = ratingsByDate.get(dateIso);
    if (!arr || arr.length === 0) return null;
    return { avg: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10, count: arr.length };
  };

  const todayStatusByMember: Record<string, "done" | "skipped" | undefined> = {};
  for (const m of roster) todayStatusByMember[m.id] = checkInsByMemberDate.get(`${m.id}|${todayIso}`)?.status;

  const sessionByDate = assignChallengeClasses(classes, focus);
  const todaysClass = sessionByDate.get(todayIso) ?? null;
  const embed = todaysClass ? youtubeEmbedUrl(todaysClass.youtube_url) : null;
  const thumb = todaysClass ? youtubeThumb(todaysClass.youtube_url) : null;

  // Leaderboard scoped to this challenge's roster + rules. Eligible required days
  // run up to today (an active challenge); a not-yet-done past day is "missed",
  // today itself is still pending.
  const cap = todayIso < focus.end_date ? todayIso : focus.end_date;
  const requiredSoFar = requiredDatesBetween(focus.start_date, cap, focus.required_dows);
  const leaderboard = roster
    .map((m) => {
      const since = joinedById.get(m.id) ?? focus.start_date;
      const eligible = requiredSoFar.filter((d) => d >= since);
      const did: string[] = [];
      const missed: string[] = [];
      for (const d of eligible) {
        const ci = checkInsByMemberDate.get(`${m.id}|${d}`);
        if (ci?.status === "done") did.push(d);
        else if (d < todayIso) missed.push(d);
      }
      return { member: m, completed: did.length, eligible: eligible.length, missed, owed: missed.length * focus.penalty_usd };
    })
    .sort((a, b) => a.missed.length - b.missed.length || b.completed - a.completed);
  const potTotal = leaderboard.reduce((s, r) => s + r.owed, 0);
  const missedTotal = leaderboard.reduce((s, r) => s + r.missed.length, 0);

  const anchor = new Date(focus.start_date + "T00:00:00");
  const monthDays = monthGrid(anchor);
  const monthLabel = anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const startLabel = anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const statusPill = isActive ? "Active now" : beforeStart ? `Starts ${startLabel}` : "Completed";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {recapReady && (afterEnd || isActive) ? (
        <Link
          href="/recap"
          className="fade-up mb-6 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-3 text-sm transition hover:border-coral/40"
        >
          <span className="flex items-center gap-2 text-muted">
            <Sparkles className="h-4 w-4 text-coral" />
            <span className="font-medium text-ink">{recapReady.name} recap is ready</span> — see how everyone did.
          </span>
          <span className="shrink-0 text-coral">View →</span>
        </Link>
      ) : null}

      {/* Hero header */}
      <div className="fade-up flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-faint">
            <CalendarDays className="h-3.5 w-3.5 text-clay" />
            {focus.name} · {windowLabel(focus)}
            <span className={`ml-1 rounded-full border px-2 py-0.5 text-[10px] ${isActive ? "border-coral/40 text-coral" : "border-line-strong text-muted"}`}>{statusPill}</span>
          </div>
          <h1 className="font-display mt-3 text-4xl font-medium leading-[1.1] tracking-tight text-ink sm:text-5xl">
            {joinable ? (
              <>Join the <span className="italic text-clay">{focus.name}</span> challenge</>
            ) : requiredToday ? (
              <>Time to <span className="italic text-clay">step on the mat</span></>
            ) : isActive ? (
              <>Recovery day — <span className="italic text-clay">rest is the work</span></>
            ) : afterEnd ? (
              <><span className="italic text-clay">{focus.name}</span> is a wrap</>
            ) : (
              <>The <span className="italic text-clay">{focus.name}</span> challenge is coming</>
            )}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-muted">
            {dateLabel}. {requiredDowsLabel(focus)} each week · ${focus.penalty_usd}/missed session.
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-line bg-surface px-6 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-faint">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" />{focus.name} Pot
          </p>
          <p className="font-display mt-1.5 text-[2.75rem] font-medium leading-none tabular-nums text-ink">${potTotal.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-faint">from {missedTotal} missed {missedTotal === 1 ? "session" : "sessions"}</p>
        </div>
      </div>

      <section className="fade-up-2 mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {joinable ? (
            <JoinChallengeCard
              challengeId={focus.id}
              challengeName={focus.name}
              windowLabel={windowLabel(focus)}
              scheduleLabel={requiredDowsLabel(focus)}
              penalty={focus.penalty_usd}
              joinByLabel={focus.join_closes_at ? new Date(focus.join_closes_at + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : null}
              memberCount={roster.length}
            />
          ) : requiredToday ? (
            <>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_2px_12px_-4px_rgba(0,0,0,0.5)]">
                {todaysClass ? (
                  <>
                    <div className="relative aspect-video w-full bg-black">
                      {embed ? (
                        <iframe className="absolute inset-0 h-full w-full" src={embed} title={todaysClass.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                      ) : thumb ? (
                        <Image src={thumb} alt={todaysClass.title} fill className="object-cover" />
                      ) : null}
                    </div>
                    <div className="border-t border-line p-6">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-raised px-2.5 py-1"><Clock3 className="h-3 w-3 text-clay" /> {todaysClass.duration_minutes} min</span>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-raised px-2.5 py-1"><Heart className="h-3 w-3 text-clay" /> {todaysClass.instructor}</span>
                        {todaysClass.tags.slice(0, 3).map((t) => (<span key={t} className="rounded-md border border-line bg-raised px-2.5 py-1">{t}</span>))}
                      </div>
                      <h2 className="font-display mt-3 text-2xl font-medium text-ink">{todaysClass.title}</h2>
                      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                        {requiredToday ? (<><CheckCircle2 className="h-4 w-4 text-coral" /> Press play, then tap your face below to check in.</>) : (<><PlayCircle className="h-4 w-4 text-sage" /> Optional today — no penalty if you skip.</>)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-10 text-center text-muted">No session assigned today.</div>
                )}
              </div>

              <CheckInRoster members={roster} meId={me.id} sessionDate={todayIso} initialStatusByMember={todayStatusByMember} isRequiredDay={true} disabled={!enrolledMe || !isActive} disabledMessage={!enrolledMe ? "You're not in this challenge." : !isActive ? "This challenge isn't active." : undefined} />
            </>
          ) : (
            <RestDayCard nextDate={nextRequiredDay(today)} />
          )}
        </div>

        {/* Leaderboard sidebar */}
        <aside className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink">Ranking</h3>
            <span className="text-[11px] tabular-nums text-faint">${focus.penalty_usd}/miss</span>
          </div>
          {leaderboard.length === 0 ? (
            <p className="mt-4 text-sm text-faint">No one&apos;s joined yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {leaderboard.map((row, i) => {
                const isMe = row.member.id === me.id;
                const pct = row.eligible ? Math.round((row.completed / row.eligible) * 100) : 0;
                const todayCi = checkInsByMemberDate.get(`${row.member.id}|${todayIso}`);
                const photo = todayCi?.status === "done" ? todayCi.photo_url : null;
                const canShare = isMe && todayCi?.status === "done" && !todayCi.photo_url;
                return (
                  <li key={row.member.id} className={`flex items-center gap-3 py-2.5 ${isMe ? "-mx-2 rounded-lg bg-coral/[0.06] px-2" : ""}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${i === 0 ? "bg-coral text-ground" : i === 1 ? "border border-sage/50 text-sage" : i === 2 ? "border border-clay/50 text-clay" : "border border-line-strong text-faint"}`}>{i + 1}</span>
                    <Avatar name={row.member.name} size={30} src={row.member.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-ink">{row.member.name}{isMe ? " · you" : ""}</p>
                          {photo ? <MomentBadge photoUrl={photo} memberName={row.member.name} /> : canShare ? <ShareMomentButton sessionDate={todayIso} /> : null}
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">{row.completed}<span className="text-faint">/{row.eligible}</span></p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line-strong">
                          <div className="h-full rounded-full bg-coral/70" style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`w-14 shrink-0 text-right text-[10px] ${row.eligible === 0 ? "text-faint" : row.owed === 0 ? "text-sage" : "text-muted"}`}>{row.eligible === 0 ? "joined" : row.owed === 0 ? "spotless" : `$${row.owed} owed`}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </section>

      {/* Monthly calendar */}
      <section className="fade-up-3 mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="font-display text-2xl font-medium text-ink">{monthLabel}</h3>
            <p className="text-sm text-faint">Every required day&apos;s designated class. Tap to play.</p>
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="grid grid-cols-7 border-b border-line bg-raised">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-faint">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((d, i) => {
              const dIso = isoDate(d);
              const required = isRequiredDay(d, focus.required_dows);
              const inWindow = dIso >= focus.start_date && dIso <= focus.end_date;
              const inMonth = d.getMonth() === anchor.getMonth();
              const isToday = dIso === todayIso;
              const klass = sessionByDate.get(dIso) ?? null;
              const klassThumb = klass ? youtubeThumb(klass.youtube_url) : null;
              const doneCount = (doneByDate.get(dIso) ?? new Set()).size;
              const myCi = checkInsByMemberDate.get(`${me.id}|${dIso}`);
              const myDone = myCi?.status === "done";
              const past = dIso < todayIso;
              const rating = avgRatingFor(dIso);

              if (!inMonth) return <div key={i} className="min-h-32 border-b border-r border-line bg-black/20" />;

              if (!required || !inWindow) {
                return (
                  <div key={i} className={`min-h-32 border-b border-r border-line p-2 ${isToday ? "bg-raised" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isToday ? "font-semibold text-ink" : "text-faint"}`}>{d.getDate()}</span>
                      <Moon className="h-3 w-3 text-line-strong" />
                    </div>
                    <p className="mt-2 text-[11px] uppercase tracking-wider text-faint/70">{inWindow ? "Rest" : "—"}</p>
                  </div>
                );
              }

              return (
                <a key={i} href={klass?.youtube_url ?? "#"} target="_blank" rel="noreferrer" className={`group flex min-h-32 flex-col gap-2 border-b border-r border-line p-2 transition hover:bg-raised ${isToday ? "bg-coral/[0.08] ring-1 ring-inset ring-coral/40" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isToday ? "font-semibold text-coral" : past ? "text-muted" : "text-faint"}`}>{d.getDate()}</span>
                    {myDone ? <CheckCircle2 className="h-3.5 w-3.5 text-sage" /> : past ? <span className="text-[10px] font-medium text-coral-deep">missed</span> : null}
                  </div>
                  {klass && klassThumb ? (
                    <div className="relative aspect-video overflow-hidden rounded-md bg-black">
                      <Image src={klassThumb} alt={klass.title} fill className="object-cover transition group-hover:scale-105" sizes="160px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      {rating ? (
                        <div className="absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white" title={`Avg rating from ${rating.count} ${rating.count === 1 ? "person" : "people"}`}>
                          <Star className="h-2.5 w-2.5 fill-coral text-coral" /> {rating.avg}
                        </div>
                      ) : null}
                      <div className="absolute bottom-1 left-1 right-1"><p className="line-clamp-2 text-[10px] font-medium leading-tight text-white">{klass.title}</p></div>
                    </div>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between text-[10px] text-faint">
                    <span>{klass?.duration_minutes ?? "—"} min</span>
                    {past ? <span className="tabular-nums">{doneCount}/{roster.length}</span> : null}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Scoreboard */}
      {leaderboard.length > 0 ? (
        <section className="fade-up-3 mt-12">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="font-display text-2xl font-medium text-ink">Skin in the game</h3>
              <p className="text-sm text-faint">
                Each member, each missed session. Pay manually via Venmo to{" "}
                <a href={`https://venmo.com/${VENMO_HANDLE}`} target="_blank" rel="noreferrer" className="text-ink underline decoration-clay/60 underline-offset-2 hover:decoration-clay">@{VENMO_HANDLE}</a>.
              </p>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
            <ul>
              {leaderboard.map((row) => {
                const isMe = row.member.id === me.id;
                return (
                  <li key={row.member.id} className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-0 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-3 sm:w-64">
                      <Avatar name={row.member.name} size={38} src={row.member.avatar_url} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{row.member.name}{isMe ? " · you" : ""}</p>
                        <p className="text-xs tabular-nums text-faint">{row.completed}/{row.eligible} done</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      {row.eligible === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-raised px-2.5 py-1 text-xs text-muted">Just joined — no required days yet</span>
                      ) : row.missed.length === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sage/10 px-2.5 py-1 text-xs text-sage ring-1 ring-sage/25">Spotless — no missed sessions</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.missed.map((d) => (<span key={d} className="rounded-md bg-coral-deep/10 px-2 py-1 text-[11px] font-medium text-coral-deep ring-1 ring-coral-deep/25">{formatDate(d)}</span>))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-3 sm:w-56">
                      <span className={`text-lg font-semibold tabular-nums ${row.owed > 0 ? "text-ink" : "text-faint"}`}>${row.owed}</span>
                      {row.owed > 0 && isMe ? (
                        <a href={venmoUrl(row.owed, `Yoga Club ${focus.name} — ${row.missed.length} missed`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 text-xs font-semibold text-ground transition hover:bg-coral-deep">Pay ${row.owed}<ExternalLink className="h-3 w-3" /></a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function monthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const dow = first.getDay();
  const lead = (dow + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - lead);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function RestDayCard({ nextDate }: { nextDate: Date }) {
  const theme = dayTheme(nextDate);
  const Icon = theme.emoji === "sunrise" ? Sunrise : theme.emoji === "wave" ? Waves : theme.emoji === "leaf" ? Leaf : Moon;
  const dayName = nextDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = nextDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return (
    <section className="fade-up-3">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface p-8 sm:p-10">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-xl border border-sage/30 bg-sage/10">
            <Moon className="h-6 w-6 text-sage" />
          </div>
          <h3 className="font-display mt-5 text-2xl font-medium text-ink sm:text-3xl">No yoga scheduled today</h3>
          <p className="mt-3 text-base text-muted">Rest is part of the work — no penalty, nothing to log. Hydrate, walk, sleep well.</p>
          <div className="mt-7 inline-flex items-center gap-3 rounded-xl border border-line bg-raised px-5 py-3 text-left">
            <Icon className="h-5 w-5 shrink-0 text-clay" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-faint">Next session</p>
              <p className="text-sm font-semibold text-ink">{dayName}, {monthDay} · {theme.label}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
