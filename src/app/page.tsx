import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Heart, PlayCircle, ExternalLink, Trophy, Moon, CheckCircle2, Sunrise, Waves, Leaf, CalendarDays, Sparkles } from "lucide-react";
import { currentMember } from "../lib/session";
import { supabase, isSupabaseConfigured, Member, ClassItem, CheckIn, Challenge, ChallengeParticipant } from "../lib/supabase";
import { DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS, DEMO_CHALLENGES, DEMO_PARTICIPANTS } from "../lib/demo";
import { isoDate, isRequiredDay, VENMO_HANDLE, venmoUrl, nextRequiredDay, dayTheme, todayEastern } from "../lib/schedule";
import { currentChallenge, upcomingChallenge, lastEndedChallenge, revealedRecapChallenge, joinOpen, participantsFor, windowLabel, requiredDowsLabel } from "../lib/challenges";
import { requiredDatesBetween } from "../lib/recap";
import { pickClassForDate } from "../lib/picker";
import { youtubeEmbedUrl, youtubeThumb } from "../lib/youtube";
import { Avatar } from "../components/Avatar";
import { CheckInRoster } from "../components/CheckInRoster";
import { JoinChallengeCard } from "../components/JoinChallengeCard";

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
        <h1 className="text-3xl font-semibold text-white">No challenge yet</h1>
        <p className="mt-3 text-zinc-400">A new challenge hasn&apos;t been set up. Hang tight.</p>
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
  for (const c of checkIns) {
    if (!inFocus(c)) continue;
    checkInsByMemberDate.set(`${c.member_id}|${c.session_date}`, c);
    if (c.status === "done") {
      const set = doneByDate.get(c.session_date) ?? new Set<string>();
      set.add(c.member_id);
      doneByDate.set(c.session_date, set);
    }
  }

  const todayStatusByMember: Record<string, "done" | "skipped" | undefined> = {};
  for (const m of roster) todayStatusByMember[m.id] = checkInsByMemberDate.get(`${m.id}|${todayIso}`)?.status;

  const todaysClass = pickClassForDate(classes, today);
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
          className="fade-up mb-6 flex items-center justify-between gap-3 rounded-2xl border border-violet-400/30 bg-gradient-to-r from-violet-500/15 via-rose-500/10 to-amber-400/10 px-5 py-3 text-sm transition hover:brightness-110"
        >
          <span className="flex items-center gap-2 text-violet-100">
            <Sparkles className="h-4 w-4 text-violet-300" />
            <span className="font-semibold">{recapReady.name} recap is ready</span> — see how everyone did.
          </span>
          <span className="text-violet-300">View →</span>
        </Link>
      ) : null}

      {/* Hero header */}
      <div className="fade-up flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            <CalendarDays className="h-3.5 w-3.5" />
            {focus.name} · {windowLabel(focus)} · {statusPill}
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {joinable ? (
              <>Join the <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">{focus.name} challenge</span></>
            ) : requiredToday ? (
              <>Time to <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">step on the mat</span></>
            ) : isActive ? (
              <>Recovery day, <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">rest is the work</span></>
            ) : afterEnd ? (
              <><span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">{focus.name}</span> is a wrap</>
            ) : (
              <>The <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">{focus.name} challenge</span> is coming</>
            )}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-400">
            {dateLabel}. {requiredDowsLabel(focus)} each week · ${focus.penalty_usd}/missed session.
          </p>
        </div>
        <div className="relative shrink-0 overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/15 via-rose-500/10 to-violet-500/10 px-6 py-4 backdrop-blur">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 opacity-30 blur-2xl" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">{focus.name} Pot</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-white sm:text-5xl">${potTotal.toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">from {missedTotal} missed {missedTotal === 1 ? "session" : "sessions"}</p>
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
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl shadow-black/40">
                {todaysClass ? (
                  <>
                    <div className="relative aspect-video w-full bg-black">
                      {embed ? (
                        <iframe className="absolute inset-0 h-full w-full" src={embed} title={todaysClass.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                      ) : thumb ? (
                        <Image src={thumb} alt={todaysClass.title} fill className="object-cover" />
                      ) : null}
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1"><Clock3 className="h-3 w-3" /> {todaysClass.duration_minutes} min</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1"><Heart className="h-3 w-3" /> {todaysClass.instructor}</span>
                        {todaysClass.tags.slice(0, 3).map((t) => (<span key={t} className="rounded-full bg-white/5 px-2.5 py-1">{t}</span>))}
                      </div>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{todaysClass.title}</h2>
                      <p className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                        {requiredToday ? (<><CheckCircle2 className="h-4 w-4 text-amber-400" /> Press play, then tap your face below to check in.</>) : (<><PlayCircle className="h-4 w-4" /> Optional today — no penalty if you skip.</>)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-10 text-center text-zinc-400">No classes seeded yet.</div>
                )}
              </div>

              {requiredToday ? (
                <CheckInRoster members={roster} meId={me.id} sessionDate={todayIso} initialStatusByMember={todayStatusByMember} isRequiredDay={true} disabled={!enrolledMe || !isActive} disabledMessage={!enrolledMe ? "You're not in this challenge." : !isActive ? "This challenge isn't active." : undefined} />
              ) : (
                <RestDayCard nextDate={nextRequiredDay(today)} />
              )}
            </>
          )}
        </div>

        {/* Leaderboard sidebar */}
        <aside className="rounded-3xl border border-white/10 bg-zinc-950/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Leaderboard</h3>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">${focus.penalty_usd}/miss</span>
          </div>
          {leaderboard.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No one&apos;s joined yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {leaderboard.map((row, i) => {
                const isMe = row.member.id === me.id;
                return (
                  <li key={row.member.id} className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${isMe ? "border-amber-400/30 bg-amber-400/5" : "border-white/5 bg-white/[0.02]"}`}>
                    <span className={`w-5 text-center text-xs font-bold ${i === 0 ? "text-amber-300" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-700" : "text-zinc-600"}`}>{i + 1}</span>
                    <Avatar name={row.member.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{row.member.name}{isMe ? " · you" : ""}</p>
                      <p className={`text-[11px] ${row.eligible === 0 ? "text-zinc-500" : row.owed === 0 ? "text-emerald-400" : "text-zinc-500"}`}>{row.eligible === 0 ? "just joined" : row.owed === 0 ? "spotless" : `$${row.owed} owed`}</p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-base font-bold text-white">{row.completed}<span className="text-zinc-600">/{row.eligible}</span></p>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600">sessions</p>
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
            <h3 className="text-2xl font-semibold tracking-tight text-white">{monthLabel}</h3>
            <p className="text-sm text-zinc-500">Every required day&apos;s designated class. Tap to play.</p>
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur">
          <div className="grid grid-cols-7 border-b border-white/5 bg-white/5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-zinc-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((d, i) => {
              const dIso = isoDate(d);
              const required = isRequiredDay(d, focus.required_dows);
              const inWindow = dIso >= focus.start_date && dIso <= focus.end_date;
              const inMonth = d.getMonth() === anchor.getMonth();
              const isToday = dIso === todayIso;
              const klass = pickClassForDate(classes, d);
              const klassThumb = klass ? youtubeThumb(klass.youtube_url) : null;
              const doneCount = (doneByDate.get(dIso) ?? new Set()).size;
              const myCi = checkInsByMemberDate.get(`${me.id}|${dIso}`);
              const myDone = myCi?.status === "done";
              const past = dIso < todayIso;

              if (!inMonth) return <div key={i} className="min-h-32 border-b border-r border-white/5 bg-black/30" />;

              if (!required || !inWindow) {
                return (
                  <div key={i} className={`min-h-32 border-b border-r border-white/5 p-2 ${isToday ? "bg-white/[0.04]" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isToday ? "font-bold text-white" : "text-zinc-600"}`}>{d.getDate()}</span>
                      <Moon className="h-3 w-3 text-zinc-700" />
                    </div>
                    <p className="mt-2 text-[11px] uppercase tracking-wider text-zinc-700">{inWindow ? "Rest" : "—"}</p>
                  </div>
                );
              }

              return (
                <a key={i} href={klass?.youtube_url ?? "#"} target="_blank" rel="noreferrer" className={`group flex min-h-32 flex-col gap-2 border-b border-r border-white/5 p-2 transition hover:bg-white/[0.04] ${isToday ? "bg-amber-400/10 ring-1 ring-inset ring-amber-400/40" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isToday ? "font-bold text-amber-300" : past ? "text-zinc-300" : "text-zinc-400"}`}>{d.getDate()}</span>
                    {myDone ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : past ? <span className="text-[10px] font-medium text-rose-400">missed</span> : null}
                  </div>
                  {klass && klassThumb ? (
                    <div className="relative aspect-video overflow-hidden rounded-md bg-black">
                      <Image src={klassThumb} alt={klass.title} fill className="object-cover transition group-hover:scale-105" sizes="160px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-1 left-1 right-1"><p className="line-clamp-2 text-[10px] font-medium leading-tight text-white">{klass.title}</p></div>
                    </div>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{klass?.duration_minutes ?? "—"} min</span>
                    {past ? <span>{doneCount}/{roster.length}</span> : null}
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
              <h3 className="text-2xl font-semibold tracking-tight text-white">Skin in the game</h3>
              <p className="text-sm text-zinc-500">
                Each member, each missed session. Pay manually via Venmo to{" "}
                <a href={`https://venmo.com/${VENMO_HANDLE}`} target="_blank" rel="noreferrer" className="text-white underline decoration-amber-400/60 underline-offset-2 hover:decoration-amber-400">@{VENMO_HANDLE}</a>.
              </p>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur">
            <ul>
              {leaderboard.map((row) => {
                const isMe = row.member.id === me.id;
                return (
                  <li key={row.member.id} className="flex flex-col gap-3 border-b border-white/5 px-5 py-4 last:border-0 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-3 sm:w-64">
                      <Avatar name={row.member.name} size={40} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{row.member.name}{isMe ? " · you" : ""}</p>
                        <p className="text-xs text-zinc-500">{row.completed}/{row.eligible} done</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      {row.eligible === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-400 ring-1 ring-white/10">Just joined — no required days yet</span>
                      ) : row.missed.length === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300 ring-1 ring-emerald-400/20">Spotless — no missed sessions</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.missed.map((d) => (<span key={d} className="rounded-md bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-300 ring-1 ring-rose-500/20">{formatDate(d)}</span>))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-3 sm:w-56">
                      <span className={`text-lg font-semibold ${row.owed > 0 ? "text-white" : "text-zinc-500"}`}>${row.owed}</span>
                      {row.owed > 0 && isMe ? (
                        <a href={venmoUrl(row.owed, `Yoga Club ${focus.name} — ${row.missed.length} missed`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-3 py-1.5 text-xs font-semibold text-black shadow-lg shadow-rose-500/20 transition hover:brightness-110">Pay ${row.owed}<ExternalLink className="h-3 w-3" /></a>
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
      <div className="overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-zinc-950/60 to-zinc-950/60 p-8 backdrop-blur sm:p-10">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-500/20 ring-1 ring-violet-400/30">
            <Moon className="h-6 w-6 text-violet-200" />
          </div>
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">No yoga scheduled today</h3>
          <p className="mt-3 text-base text-zinc-400">Rest is part of the work — no penalty, nothing to log. Hydrate, walk, sleep well.</p>
          <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-left">
            <Icon className="h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-amber-300/80">Next session</p>
              <p className="text-sm font-semibold text-white">{dayName}, {monthDay} · {theme.label}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
