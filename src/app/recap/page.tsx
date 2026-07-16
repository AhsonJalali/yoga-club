import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock3, Flame, Sparkles, Users, Star } from "lucide-react";
import { currentMember } from "../../lib/session";
import { supabase, isSupabaseConfigured, Member, ClassItem, CheckIn, Challenge, ChallengeParticipant } from "../../lib/supabase";
import { DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS, DEMO_CHALLENGES, DEMO_PARTICIPANTS } from "../../lib/demo";
import { VENMO_HANDLE } from "../../lib/schedule";
import { revealedRecapChallenge } from "../../lib/challenges";
import { CountUp, ConfettiBurst } from "../../components/RecapAnimations";
import { ShareRecapButton } from "../../components/ShareRecapButton";
import {
  BUCKETS,
  BucketCount,
  bucketMeta,
  computeRecap,
} from "../../lib/recap";

export const dynamic = "force-dynamic";

export default async function RecapPage() {
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

  // The recap always shows the most recent challenge whose reveal time has
  // passed. If nothing has revealed yet, there's no recap to see.
  const challenge = revealedRecapChallenge(challenges);
  if (!challenge) redirect("/?view=club");

  const { byMember, group } = computeRecap(members, classes, checkIns, challenge, participants);
  const mine = byMember.get(me.id);

  const fav = mine?.favorite ? bucketMeta(mine.favorite) : null;
  const clubFav = group.favorite ? bucketMeta(group.favorite) : null;
  const clubFavCount = group.favorite
    ? group.buckets.find((b) => b.key === group.favorite)?.count ?? 0
    : 0;
  const clubFavPct =
    group.totalSessions > 0 ? Math.round((clubFavCount / group.totalSessions) * 100) : 0;

  return (
    <main className="relative mx-auto max-w-5xl px-6 pb-24 pt-10">
      <ConfettiBurst />

      {/* ---- Hero ---- */}
      <section className="fade-up overflow-hidden rounded-2xl border border-line bg-surface px-6 py-12 text-center sm:px-10 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-clay">
          {challenge.name} · Yoga Club
        </p>
        {mine ? (
          <>
            <h1 className="font-display mx-auto mt-4 max-w-2xl text-4xl font-medium tracking-tight text-ink sm:text-6xl">
              Congratulations, <span className="italic text-clay">{me.name}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
              You showed up. Here&apos;s everything you did on the mat in {challenge.name}.
            </p>

            <div className="mt-10 flex flex-col items-center">
              <CountUp
                value={mine.sessions}
                className="font-display text-7xl font-medium tabular-nums text-coral sm:text-8xl"
              />
              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-faint">
                yoga sessions
              </p>
            </div>

            <div className="mt-9 flex justify-center">
              <ShareRecapButton challengeName={challenge.name} challengeSlug={challenge.slug} />
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display mx-auto mt-4 max-w-2xl text-4xl font-medium tracking-tight text-ink sm:text-6xl">
              The <span className="italic text-clay">{challenge.name}</span> recap
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
              You sat this one out, {me.name} — here&apos;s how the club did.
            </p>
          </>
        )}
      </section>

      {/* ---- Personal stat grid (participants only) ---- */}
      {mine ? (
      <>
      <section className="fade-up-2 mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Time on the mat"
          accent="clay"
        >
          <div className="font-display text-3xl font-medium tabular-nums text-ink">
            <CountUp value={mine.minutes} suffix=" min" />
          </div>
          <p className="mt-1 text-sm text-muted">
            ≈ <CountUp value={mine.hours} decimals={1} /> hours of yoga
          </p>
        </StatCard>

        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Your favorite time"
          accent="sage"
        >
          {fav ? (
            <>
              <div className="font-display text-3xl font-medium text-ink">
                {fav.emoji} {fav.label}
              </div>
              <p className="mt-1 text-sm text-muted">most of your sessions, {fav.range}</p>
            </>
          ) : (
            <>
              <div className="font-display text-2xl font-medium text-ink">—</div>
              <p className="mt-1 text-sm text-muted">no check-in times recorded</p>
            </>
          )}
        </StatCard>

        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Consistency"
          accent="coral"
        >
          <div className="font-display text-3xl font-medium tabular-nums text-ink">
            {mine.completed}
            <span className="text-faint">/{mine.eligible}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {mine.completionPct}% of required days
            {mine.bestStreak > 1 ? ` · ${mine.bestStreak} in a row` : ""}
          </p>
        </StatCard>

        <StatCard icon={<Star className="h-4 w-4" />} label="How it felt" accent="clay">
          {mine.ratedCount > 0 ? (
            <>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-5 w-5 ${Math.round(mine.avgRating ?? 0) >= n ? "fill-coral text-coral" : "fill-transparent text-line-strong"}`} />
                ))}
              </div>
              <p className="mt-1 text-sm text-muted">{mine.avgRating} avg · {mine.ratedCount} rated</p>
            </>
          ) : (
            <>
              <div className="font-display text-2xl font-medium text-ink">—</div>
              <p className="mt-1 text-sm text-muted">no ratings logged</p>
            </>
          )}
        </StatCard>
      </section>

      {/* ---- Time-of-day bar chart ---- */}
      <section className="fade-up-2 mt-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-medium text-ink">When you did yoga</h2>
        </div>
        <p className="mt-1 text-sm text-faint">
          Sessions by time of day{" "}
          {mine.timedSessions < mine.sessions
            ? `(${mine.timedSessions} of ${mine.sessions} sessions had a logged time)`
            : ""}
        </p>
        <BarChart buckets={mine.buckets} highlight={mine.favorite} />
      </section>
      </>
      ) : null}

      {/* ---- Your moments ---- */}
      {mine && mine.photos.length > 0 ? (
        <section className="fade-up-2 mt-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h2 className="font-display text-lg font-medium text-ink">Your moments</h2>
          <p className="mt-1 text-sm text-faint">Snapshots you shared this challenge.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {mine.photos.map((url, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-black">
                <Image src={url} alt="Your moment" fill sizes="200px" className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---- Group section ---- */}
      <section className="fade-up-3 mt-10">
        <div className="flex items-center justify-center gap-2 text-center">
          <Users className="h-4 w-4 text-faint" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-faint">
            The whole club
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-coral/25 bg-surface p-6 text-center sm:col-span-1">
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" />The pot
            </p>
            <div className="font-display mt-2 text-5xl font-medium tabular-nums text-ink">
              <CountUp value={group.potTotal} prefix="$" />
            </div>
            <p className="mt-1 text-xs text-faint">
              from {group.missedTotal} missed {group.missedTotal === 1 ? "session" : "sessions"} · ${challenge.penalty_usd}/miss
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">
              Together we did
            </p>
            <div className="font-display mt-2 text-5xl font-medium tabular-nums text-ink">
              <CountUp value={group.totalSessions} />
            </div>
            <p className="mt-1 text-xs text-faint">
              sessions · <CountUp value={group.totalHours} decimals={1} /> hours of yoga in {challenge.name}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">
              Club&apos;s favorite time
            </p>
            <div className="font-display mt-2 text-3xl font-medium text-ink">
              {clubFav ? `${clubFav.emoji} ${clubFav.label}` : "—"}
            </div>
            <p className="mt-1 text-xs text-faint">
              {clubFavCount} {clubFavCount === 1 ? "session" : "sessions"} · {clubFavPct}% of all
            </p>
          </div>
        </div>

        {group.photos.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-line bg-surface p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">Moments from the club</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.photos.slice(0, 14).map((p, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border border-line bg-black" title={p.memberName}>
                  <Image src={p.url} alt={`${p.memberName}'s moment`} fill sizes="64px" className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ---- Footer ---- */}
      <div className="fade-up-3 mt-10 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted">
          Owe something? Settle up on Venmo to{" "}
          <a
            href={`https://venmo.com/${VENMO_HANDLE}`}
            target="_blank"
            rel="noreferrer"
            className="text-ink underline decoration-clay/60 underline-offset-2 hover:decoration-clay"
          >
            @{VENMO_HANDLE}
          </a>
          . Same time next month? 🧘
        </p>
        <Link
          href="/?view=club"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-raised px-4 py-2 text-sm font-medium text-ink transition hover:border-coral/40"
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
  accent: "clay" | "sage" | "coral";
  children: React.ReactNode;
}) {
  const ring =
    accent === "clay" ? "text-clay" : accent === "sage" ? "text-sage" : "text-coral";
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
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
              <span className={`mb-2 text-xs font-semibold tabular-nums ${isFav ? "text-ink" : "text-faint"}`}>
                {count}
              </span>
              <div
                className={`w-full rounded-t-md ${isFav ? "bg-coral" : "bg-line-strong"}`}
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
              <div className={`text-[10px] leading-tight ${isFav ? "text-ink" : "text-faint"}`}>
                {meta.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
