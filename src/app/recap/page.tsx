import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3, Flame, Sparkles, Trophy, Users } from "lucide-react";
import { currentMember } from "../../lib/session";
import { supabase, isSupabaseConfigured, Member, ClassItem, CheckIn } from "../../lib/supabase";
import { DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS } from "../../lib/demo";
import { PENALTY_USD, VENMO_HANDLE } from "../../lib/schedule";
import { Avatar } from "../../components/Avatar";
import { CountUp, ConfettiBurst } from "../../components/RecapAnimations";
import { ShareRecapButton } from "../../components/ShareRecapButton";
import {
  BUCKETS,
  BucketCount,
  bucketMeta,
  computeRecap,
  isRecapRevealed,
  MONTH_LABEL,
} from "../../lib/recap";

export const dynamic = "force-dynamic";

export default async function RecapPage() {
  const me = await currentMember();
  if (!me) redirect("/login");

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

  const { byMember, group } = computeRecap(members, classes, checkIns);
  const mine = byMember.get(me.id);
  const revealed = isRecapRevealed();

  const fav = mine?.favorite ? bucketMeta(mine.favorite) : null;
  const clubFav = group.favorite ? bucketMeta(group.favorite) : null;

  return (
    <main className="relative mx-auto max-w-5xl px-6 pb-24 pt-10">
      <ConfettiBurst />

      {!revealed ? (
        <div className="fade-up mb-6 flex items-center justify-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-center text-xs text-violet-200">
          <Sparkles className="h-3.5 w-3.5" />
          Preview — the recap unlocks for everyone Saturday, May 30.
        </div>
      ) : null}

      {/* ---- Hero ---- */}
      <section className="fade-up relative overflow-hidden rounded-[2rem] border border-amber-400/25 bg-gradient-to-br from-amber-400/15 via-rose-500/10 to-violet-500/15 px-6 py-12 text-center backdrop-blur sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300">
          {MONTH_LABEL} 2026 · Yoga Club
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Congratulations,{" "}
          <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">
            {me.name}
          </span>
          ! 🎉
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-300 sm:text-lg">
          You showed up this month. Here&apos;s everything you did on the mat in {MONTH_LABEL}.
        </p>

        <div className="mt-10 flex flex-col items-center">
          <CountUp
            value={mine?.sessions ?? 0}
            className="text-7xl font-bold tabular-nums text-white sm:text-8xl"
          />
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-amber-300/90">
            yoga sessions
          </p>
        </div>

        <div className="mt-9 flex justify-center">
          <ShareRecapButton />
        </div>
      </section>

      {/* ---- Personal stat grid ---- */}
      <section className="fade-up-2 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Time on the mat"
          accent="amber"
        >
          <div className="text-3xl font-bold tabular-nums text-white">
            <CountUp value={mine?.minutes ?? 0} suffix=" min" />
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            ≈ <CountUp value={mine?.hours ?? 0} decimals={1} /> hours of yoga
          </p>
        </StatCard>

        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Your favorite time"
          accent="violet"
        >
          {fav ? (
            <>
              <div className="text-3xl font-bold text-white">
                {fav.emoji} {fav.label}
              </div>
              <p className="mt-1 text-sm text-zinc-400">most of your sessions, {fav.range}</p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-white">—</div>
              <p className="mt-1 text-sm text-zinc-400">no check-in times recorded</p>
            </>
          )}
        </StatCard>

        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Consistency"
          accent="rose"
        >
          <div className="text-3xl font-bold tabular-nums text-white">
            {mine?.completed ?? 0}
            <span className="text-zinc-600">/{mine?.eligible ?? 0}</span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {mine?.completionPct ?? 0}% of required days
            {mine && mine.bestStreak > 1 ? ` · ${mine.bestStreak} in a row` : ""}
          </p>
        </StatCard>
      </section>

      {/* ---- Time-of-day bar chart ---- */}
      <section className="fade-up-2 mt-6 rounded-3xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur sm:p-8">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">When you did yoga</h2>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Sessions by time of day{" "}
          {mine && mine.timedSessions < mine.sessions
            ? `(${mine.timedSessions} of ${mine.sessions} sessions had a logged time)`
            : ""}
        </p>
        <BarChart buckets={mine?.buckets ?? []} highlight={mine?.favorite ?? null} />
      </section>

      {/* ---- Group section ---- */}
      <section className="fade-up-3 mt-10">
        <div className="flex items-center justify-center gap-2 text-center">
          <Users className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            The whole club
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/15 via-rose-500/10 to-violet-500/10 p-6 text-center sm:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              The pot
            </p>
            <div className="mt-2 text-5xl font-bold tabular-nums text-white">
              <CountUp value={group.potTotal} prefix="$" />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              from {group.missedTotal} missed {group.missedTotal === 1 ? "session" : "sessions"} · ${PENALTY_USD}/miss
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 text-center backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Together we did
            </p>
            <div className="mt-2 text-5xl font-bold tabular-nums text-white">
              <CountUp value={group.totalSessions} />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              sessions · <CountUp value={group.totalHours} decimals={1} /> hours of yoga in {MONTH_LABEL}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 text-center backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Club&apos;s favorite time
            </p>
            <div className="mt-2 text-3xl font-bold text-white">
              {clubFav ? `${clubFav.emoji} ${clubFav.label}` : "—"}
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {group.participants} of {group.memberCount} members practiced
            </p>
          </div>
        </div>

        {/* Honor roll */}
        {group.honorRoll.length > 0 ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Most consistent
              </h3>
            </div>
            <ul className="mt-4 space-y-2">
              {group.honorRoll.map((row, i) => {
                const isMe = row.member.id === me.id;
                return (
                  <li
                    key={row.member.id}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                      isMe ? "border-amber-400/30 bg-amber-400/5" : "border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <span
                      className={`w-5 text-center text-xs font-bold ${
                        i === 0 ? "text-amber-300" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-700" : "text-zinc-600"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Avatar name={row.member.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {row.member.name}
                        {isMe ? " · you" : ""}
                      </p>
                      {row.spotless ? (
                        <p className="text-[11px] text-emerald-400">spotless — never missed</p>
                      ) : null}
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-base font-bold text-white">
                        {row.completed}
                        <span className="text-zinc-600">/{row.eligible}</span>
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600">done</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      {/* ---- Footer ---- */}
      <div className="fade-up-3 mt-10 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-zinc-400">
          Owe something? Settle up on Venmo to{" "}
          <a
            href={`https://venmo.com/${VENMO_HANDLE}`}
            target="_blank"
            rel="noreferrer"
            className="text-white underline decoration-amber-400/60 underline-offset-2 hover:decoration-amber-400"
          >
            @{VENMO_HANDLE}
          </a>
          . Same time next month? 🧘
        </p>
        <Link
          href="/?view=club"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Yoga Club
        </Link>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  accent,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  accent: "amber" | "violet" | "rose";
  children: React.ReactNode;
}) {
  const ring =
    accent === "amber"
      ? "text-amber-300"
      : accent === "violet"
      ? "text-violet-300"
      : "text-rose-300";
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur">
      <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] ${ring}`}>
        {icon}
        {label}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BarChart({
  buckets,
  highlight,
}: {
  buckets: BucketCount[];
  highlight: string | null;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const PLOT = 168; // px height of the tallest bar; bars use fixed px so their
  // baselines always align regardless of how the labels below wrap.
  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-2 sm:gap-4" style={{ height: PLOT + 28 }}>
        {BUCKETS.map((meta) => {
          const count = buckets.find((b) => b.key === meta.key)?.count ?? 0;
          const isFav = highlight === meta.key;
          const barPx = count > 0 ? Math.max(8, Math.round((count / max) * PLOT)) : 3;
          return (
            <div key={meta.key} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className={`mb-2 text-xs font-bold tabular-nums ${isFav ? "text-white" : "text-zinc-500"}`}>
                {count}
              </span>
              <div
                className={`w-full rounded-t-lg ${
                  isFav ? "bg-gradient-to-t from-amber-400 to-rose-400" : "bg-white/10"
                }`}
                style={{ height: barPx }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between gap-2 sm:gap-4">
        {BUCKETS.map((meta) => {
          const isFav = highlight === meta.key;
          return (
            <div key={meta.key} className="flex flex-1 flex-col items-center text-center">
              <div className="text-base">{meta.emoji}</div>
              <div className={`text-[10px] leading-tight ${isFav ? "text-white" : "text-zinc-500"}`}>
                {meta.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
