import { redirect } from "next/navigation";
import Image from "next/image";
import { Clock3, Heart, PlayCircle, ExternalLink, Trophy, Moon, CheckCircle2, Sunrise, Waves, Leaf } from "lucide-react";
import { currentMember } from "../lib/session";
import { supabase, isSupabaseConfigured, Member, ClassItem, CheckIn } from "../lib/supabase";
import { DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS } from "../lib/demo";
import { dayKind, isoDate, dowName, PENALTY_USD, VENMO_HANDLE, venmoUrl, CLUB_START, nextRequiredDay, dayTheme } from "../lib/schedule";
import { pickClassForDate } from "../lib/picker";
import { youtubeEmbedUrl, youtubeThumb } from "../lib/youtube";
import { Avatar } from "../components/Avatar";
import { CheckInRoster } from "../components/CheckInRoster";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const me = await currentMember();
  if (!me) redirect("/login");

  const today = new Date();
  const todayIso = isoDate(today);
  const kind = dayKind(today);

  let members: Member[];
  let classes: ClassItem[];
  let checkIns: CheckIn[];

  if (isSupabaseConfigured()) {
    const sb = supabase();
    const [a, b, c] = await Promise.all([
      sb.from("members").select("*").order("name"),
      sb.from("classes").select("*"),
      sb.from("check_ins").select("*"),
    ]);
    members = (a.data ?? []) as Member[];
    classes = (b.data ?? []) as ClassItem[];
    checkIns = (c.data ?? []) as CheckIn[];
  } else {
    members = DEMO_MEMBERS;
    classes = DEMO_CLASSES;
    checkIns = DEMO_CHECK_INS;
  }

  // Indexes
  const checkInsByMemberDate = new Map<string, CheckIn>();
  const doneByDate = new Map<string, Set<string>>();
  for (const c of checkIns) {
    checkInsByMemberDate.set(`${c.member_id}|${c.session_date}`, c);
    if (c.status === "done") {
      const set = doneByDate.get(c.session_date) ?? new Set<string>();
      set.add(c.member_id);
      doneByDate.set(c.session_date, set);
    }
  }

  const todayStatusByMember: Record<string, "done" | "skipped" | undefined> = {};
  for (const m of members) {
    const ci = checkInsByMemberDate.get(`${m.id}|${todayIso}`);
    todayStatusByMember[m.id] = ci?.status;
  }
  const todaysClass = pickClassForDate(classes, today);
  const embed = todaysClass ? youtubeEmbedUrl(todaysClass.youtube_url) : null;
  const thumb = todaysClass ? youtubeThumb(todaysClass.youtube_url) : null;

  // Leaderboard rows (sorted by missed asc, owed asc)
  const earliestOverall = checkIns.reduce<string | null>((acc, c) => {
    return !acc || c.session_date < acc ? c.session_date : acc;
  }, null);
  const allRequiredDates = enumerateRequiredDates(earliestOverall, todayIso);

  const leaderboard = members
    .map((m) => {
      const memberSince = m.created_at.slice(0, 10);
      const since = memberSince > CLUB_START ? memberSince : CLUB_START;
      const eligible = allRequiredDates.filter((d) => d >= since && d <= todayIso);
      const did: string[] = [];
      const missed: string[] = [];
      for (const d of eligible) {
        const ci = checkInsByMemberDate.get(`${m.id}|${d}`);
        if (ci?.status === "done") did.push(d);
        else if (ci?.status === "skipped") missed.push(d);
        else if (d < todayIso) missed.push(d); // past, no record = missed
      }
      return {
        member: m,
        completed: did.length,
        eligible: eligible.length,
        missed,
        owed: missed.length * PENALTY_USD,
      };
    })
    .sort((a, b) => a.missed.length - b.missed.length || b.completed - a.completed);

  const potTotal = leaderboard.reduce((sum, r) => sum + r.owed, 0);

  const monthDays = monthGrid(today);
  const monthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const beforeKickoff = todayIso < CLUB_START;
  const kickoffDate = new Date(CLUB_START + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {beforeKickoff ? (
        <div className="fade-up mb-6 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-400/15 via-rose-500/10 to-violet-500/10 px-5 py-3 text-sm">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <p className="text-amber-100">
            <span className="font-semibold">Yoga Club kicks off {kickoffDate}.</span>{" "}
            <span className="text-amber-200/70">Practice now if you want — nothing counts toward the pot until then.</span>
          </p>
        </div>
      ) : null}

      {/* Hero header */}
      <div className="fade-up flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300/80">
            {dowName(today)} · {todayIso}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {kind === "required" ? (
              <>Time to <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">step on the mat</span></>
            ) : (
              <>Recovery day, <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">rest is the work</span></>
            )}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-400">
            {dateLabel}.{" "}
            {kind === "required"
              ? "Your session is queued up — about 20 minutes. Press play, then check in when you're done."
              : "No required session today. Roll out the mat anyway if you want — here's a soft option."}
          </p>
        </div>
        <div className="relative shrink-0 overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/15 via-rose-500/10 to-violet-500/10 px-6 py-4 backdrop-blur">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 opacity-30 blur-2xl" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            Group Pot
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-white sm:text-5xl">
            ${potTotal.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            from {leaderboard.reduce((s, r) => s + r.missed.length, 0)} missed sessions
          </p>
        </div>
      </div>

      {/* Hero video + leaderboard */}
      <section className="fade-up-2 mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl shadow-black/40">
          {todaysClass ? (
            <>
              <div className="relative aspect-video w-full bg-black">
                {embed ? (
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={embed}
                    title={todaysClass.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : thumb ? (
                  <Image src={thumb} alt={todaysClass.title} fill className="object-cover" />
                ) : null}
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
                    <Clock3 className="h-3 w-3" /> {todaysClass.duration_minutes} min
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
                    <Heart className="h-3 w-3" /> {todaysClass.instructor}
                  </span>
                  {todaysClass.tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full bg-white/5 px-2.5 py-1">{t}</span>
                  ))}
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{todaysClass.title}</h2>
                <p className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                  {kind === "required" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-amber-400" />
                      Press play, then tap your face below to check in.
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      Optional today — no penalty if you skip.
                    </>
                  )}
                </p>
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-zinc-400">
              No classes seeded yet. Add some in Supabase.
            </div>
          )}
        </div>

        {/* Leaderboard sidebar */}
        <aside className="rounded-3xl border border-white/10 bg-zinc-950/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Leaderboard</h3>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">${PENALTY_USD}/miss</span>
          </div>
          <ul className="mt-4 space-y-2">
            {leaderboard.map((row, i) => {
              const isMe = row.member.id === me.id;
              return (
                <li
                  key={row.member.id}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                    isMe ? "border-amber-400/30 bg-amber-400/5" : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <span className={`w-5 text-center text-xs font-bold ${i === 0 ? "text-amber-300" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-700" : "text-zinc-600"}`}>
                    {i + 1}
                  </span>
                  <Avatar name={row.member.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {row.member.name}{isMe ? " · you" : ""}
                    </p>
                    <p className={`text-[11px] ${row.owed === 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                      {row.owed === 0 ? "spotless" : `$${row.owed} owed`}
                    </p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="text-base font-bold text-white">
                      {row.completed}<span className="text-zinc-600">/{row.eligible}</span>
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">sessions</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </section>

      {/* Honor-system check-in roster (required days only, post-kickoff) */}
      {beforeKickoff ? null : kind === "required" ? (
        <CheckInRoster
          members={members}
          meId={me.id}
          sessionDate={todayIso}
          initialStatusByMember={todayStatusByMember}
          isRequiredDay={true}
        />
      ) : (
        <RestDayCard nextDate={nextRequiredDay(today)} />
      )}

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
              <div key={d} className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((d, i) => {
              const dIso = isoDate(d);
              const k = dayKind(d);
              const inMonth = d.getMonth() === today.getMonth();
              const isToday = dIso === todayIso;
              const klass = pickClassForDate(classes, d);
              const klassThumb = klass ? youtubeThumb(klass.youtube_url) : null;
              const doneCount = (doneByDate.get(dIso) ?? new Set()).size;
              const myCi = checkInsByMemberDate.get(`${me.id}|${dIso}`);
              const myDone = myCi?.status === "done";
              const mySkip = myCi?.status === "skipped";
              const past = dIso < todayIso;
              const beforeKickoff = dIso < CLUB_START;

              if (!inMonth) {
                return <div key={i} className="min-h-32 border-b border-r border-white/5 bg-black/30" />;
              }

              if (k === "rest") {
                return (
                  <div
                    key={i}
                    className={`min-h-32 border-b border-r border-white/5 p-2 ${isToday ? "bg-white/[0.04]" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isToday ? "font-bold text-white" : "text-zinc-600"}`}>{d.getDate()}</span>
                      <Moon className="h-3 w-3 text-zinc-700" />
                    </div>
                    <p className="mt-2 text-[11px] uppercase tracking-wider text-zinc-700">Rest</p>
                  </div>
                );
              }

              return (
                <a
                  key={i}
                  href={klass?.youtube_url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex min-h-32 flex-col gap-2 border-b border-r border-white/5 p-2 transition hover:bg-white/[0.04] ${
                    isToday ? "bg-amber-400/10 ring-1 ring-inset ring-amber-400/40" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isToday ? "font-bold text-amber-300" : past ? "text-zinc-300" : "text-zinc-400"}`}>
                      {d.getDate()}
                    </span>
                    {myDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (mySkip || past) && !beforeKickoff ? (
                      <span className="text-[10px] font-medium text-rose-400">missed</span>
                    ) : beforeKickoff ? (
                      <span className="text-[10px] font-medium text-zinc-600">pre-kickoff</span>
                    ) : null}
                  </div>
                  {klass && klassThumb ? (
                    <div className="relative aspect-video overflow-hidden rounded-md bg-black">
                      <Image src={klassThumb} alt={klass.title} fill className="object-cover transition group-hover:scale-105" sizes="160px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="line-clamp-2 text-[10px] font-medium leading-tight text-white">{klass.title}</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{klass?.duration_minutes ?? "—"} min</span>
                    {past ? <span>{doneCount}/{members.length}</span> : null}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed scoreboard with missed dates */}
      <section className="fade-up-3 mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-white">Skin in the game</h3>
            <p className="text-sm text-zinc-500">
              Each member, each missed session. Pay manually via Venmo to{" "}
              <a href={`https://venmo.com/${VENMO_HANDLE}`} target="_blank" rel="noreferrer" className="text-white underline decoration-amber-400/60 underline-offset-2 hover:decoration-amber-400">
                @{VENMO_HANDLE}
              </a>.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur">
          <ul>
            {leaderboard.map((row) => {
              const isMe = row.member.id === me.id;
              return (
                <li
                  key={row.member.id}
                  className="flex flex-col gap-3 border-b border-white/5 px-5 py-4 last:border-0 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:w-64">
                    <Avatar name={row.member.name} size={40} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {row.member.name}{isMe ? " · you" : ""}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {row.completed}/{row.eligible} done since{" "}
                        {new Date(row.member.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1">
                    {row.missed.length === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300 ring-1 ring-emerald-400/20">
                        Spotless — no missed sessions
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {row.missed.map((d) => (
                          <span
                            key={d}
                            className="rounded-md bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-300 ring-1 ring-rose-500/20"
                          >
                            {formatDate(d)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 sm:w-56">
                    <span className={`text-lg font-semibold ${row.owed > 0 ? "text-white" : "text-zinc-500"}`}>
                      ${row.owed}
                    </span>
                    {row.owed > 0 && isMe ? (
                      <a
                        href={venmoUrl(row.owed, `Yoga Club — ${row.missed.length} missed`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-3 py-1.5 text-xs font-semibold text-black shadow-lg shadow-rose-500/20 transition hover:brightness-110"
                      >
                        Pay ${row.owed}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </main>
  );
}

function enumerateRequiredDates(startIso: string | null, endIso: string): string[] {
  if (!startIso) return [];
  const out: string[] = [];
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(endIso + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (dayKind(d) === "required") out.push(isoDate(d));
  }
  return out;
}

// 6-week month grid starting Monday, includes leading/trailing days from neighboring months as placeholders.
function monthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const dow = first.getDay(); // 0=Sun
  const lead = (dow + 6) % 7; // days before first (Monday-start)
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
    <section className="fade-up-3 mt-12">
      <div className="overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-zinc-950/60 to-zinc-950/60 p-8 backdrop-blur sm:p-10">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-500/20 ring-1 ring-violet-400/30">
            <Moon className="h-6 w-6 text-violet-200" />
          </div>
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            No yoga scheduled today
          </h3>
          <p className="mt-3 text-base text-zinc-400">
            Rest is part of the work — no penalty, nothing to log. Hydrate, walk, sleep well.
          </p>
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
