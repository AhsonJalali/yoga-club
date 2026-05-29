// May recap ("Wrapped") stats. Pure computation over members/classes/check-ins
// so it's easy to reason about and reuse. Two data realities shape this:
//
//   1. Check-ins don't store which class was done (the API writes class_id: null),
//      so "minutes on the mat" is derived from the *designated* class for each
//      date via pickClassForDate — deterministic, and the same video the
//      calendar already shows for that day.
//
//   2. There's no "time you practiced" field. The only per-session timestamp is
//      created_at (when you tapped check-in), so time-of-day buckets are based
//      on that. It's a proxy for practice time, not a guarantee.

import { CheckIn, ClassItem, Member } from "./supabase";
import { pickClassForDate } from "./picker";
import { APP_TZ, CLUB_START, dayKind, isoDate, PENALTY_USD } from "./schedule";

// The challenge runs through end of Friday May 29, 2026. The recap covers the
// whole month of May; the reveal unlocks at midnight ET on Saturday May 30.
export const MONTH_START = "2026-05-01";
export const MONTH_END = "2026-05-31";
export const CHALLENGE_END = "2026-05-29";
export const MONTH_LABEL = "May";
// Midnight ET on Sat May 30 (EDT = UTC-4 in May).
export const RECAP_REVEAL_ISO = "2026-05-30T00:00:00-04:00";

export function isRecapRevealed(now: Date = new Date()): boolean {
  return now.getTime() >= new Date(RECAP_REVEAL_ISO).getTime();
}

// ---------------------------------------------------------------------------
// Time-of-day buckets
// ---------------------------------------------------------------------------

export type BucketKey = "earlyMorning" | "morning" | "afternoon" | "evening" | "lateNight";

export type BucketMeta = {
  key: BucketKey;
  label: string;
  emoji: string;
  // Inclusive start hour, exclusive end hour (24h ET). lateNight wraps midnight.
  range: string;
};

// Order matters: this is the left-to-right order of the bar chart.
export const BUCKETS: BucketMeta[] = [
  { key: "earlyMorning", label: "Early morning", emoji: "🌅", range: "5–8am" },
  { key: "morning", label: "Morning", emoji: "☀️", range: "8am–12pm" },
  { key: "afternoon", label: "Afternoon", emoji: "🌤️", range: "12–5pm" },
  { key: "evening", label: "Evening", emoji: "🌆", range: "5–9pm" },
  { key: "lateNight", label: "Late night", emoji: "🌙", range: "9pm–5am" },
];

const ET_HOUR_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TZ,
  hour: "numeric",
  hour12: false,
});

// Hour (0–23) of an ISO timestamp, in Eastern time. Returns null if unparseable
// (e.g. demo rows with an empty created_at).
export function etHour(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // Intl can yield "24" for midnight; normalize to 0.
  const h = parseInt(ET_HOUR_FMT.format(d), 10) % 24;
  return Number.isNaN(h) ? null : h;
}

export function bucketForHour(hour: number): BucketKey {
  if (hour >= 5 && hour < 8) return "earlyMorning";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "lateNight"; // 21–24 and 0–5
}

export function bucketMeta(key: BucketKey): BucketMeta {
  return BUCKETS.find((b) => b.key === key)!;
}

// ---------------------------------------------------------------------------
// Stats shapes
// ---------------------------------------------------------------------------

export type BucketCount = { key: BucketKey; count: number };

export type MemberRecap = {
  member: Member;
  sessions: number;          // all "done" check-ins in May
  minutes: number;           // sum of designated-class duration for done dates
  hours: number;             // minutes / 60, one decimal
  buckets: BucketCount[];    // per time-of-day, in BUCKETS order
  timedSessions: number;     // sessions that had a usable created_at
  favorite: BucketKey | null;
  eligible: number;          // required days they were on the hook for
  completed: number;         // required days they did
  completionPct: number;     // 0–100
  missed: number;            // required days missed
  owed: number;              // missed * PENALTY_USD
  bestStreak: number;        // longest run of consecutive required days done
};

export type GroupRecap = {
  potTotal: number;
  missedTotal: number;
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  favorite: BucketKey | null;
  buckets: BucketCount[];
  memberCount: number;
  participants: number;       // members with >= 1 session in May
  // Honor roll: members with the most completed required sessions (ties broken
  // by completion %), top few. Spotless = missed 0 of a non-zero eligible set.
  honorRoll: { member: Member; completed: number; eligible: number; spotless: boolean }[];
};

export type Recap = {
  byMember: Map<string, MemberRecap>;
  group: GroupRecap;
};

// Required dates in [startIso, endIso], inclusive.
function requiredDatesBetween(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(endIso + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (dayKind(d) === "required") out.push(isoDate(d));
  }
  return out;
}

function inMay(dateIso: string): boolean {
  return dateIso >= MONTH_START && dateIso <= MONTH_END;
}

export function computeRecap(
  members: Member[],
  classes: ClassItem[],
  checkIns: CheckIn[]
): Recap {
  // Designated-class duration for a date, cached so we don't re-pick per member.
  const durationCache = new Map<string, number>();
  const durationForDate = (dateIso: string): number => {
    const hit = durationCache.get(dateIso);
    if (hit !== undefined) return hit;
    const klass = pickClassForDate(classes, new Date(dateIso + "T00:00:00"));
    const mins = klass?.duration_minutes ?? 20; // fallback if library empty
    durationCache.set(dateIso, mins);
    return mins;
  };

  // Index done check-ins by member, only within May.
  const doneByMember = new Map<string, CheckIn[]>();
  for (const ci of checkIns) {
    if (ci.status !== "done" || !inMay(ci.session_date)) continue;
    const arr = doneByMember.get(ci.member_id) ?? [];
    arr.push(ci);
    doneByMember.set(ci.member_id, arr);
  }

  const allRequired = requiredDatesBetween(CLUB_START, CHALLENGE_END);

  const byMember = new Map<string, MemberRecap>();
  const groupBucketCounts: Record<BucketKey, number> = {
    earlyMorning: 0, morning: 0, afternoon: 0, evening: 0, lateNight: 0,
  };

  for (const m of members) {
    const done = doneByMember.get(m.id) ?? [];
    const doneDates = new Set(done.map((c) => c.session_date));

    // Minutes from designated class per done date.
    let minutes = 0;
    for (const dateIso of doneDates) minutes += durationForDate(dateIso);

    // Time-of-day buckets.
    const counts: Record<BucketKey, number> = {
      earlyMorning: 0, morning: 0, afternoon: 0, evening: 0, lateNight: 0,
    };
    let timedSessions = 0;
    for (const ci of done) {
      const h = etHour(ci.created_at);
      if (h === null) continue;
      const b = bucketForHour(h);
      counts[b] += 1;
      groupBucketCounts[b] += 1;
      timedSessions += 1;
    }
    const buckets: BucketCount[] = BUCKETS.map((b) => ({ key: b.key, count: counts[b.key] }));
    const favorite = pickFavorite(buckets);

    // Required-day accounting, bounded by when they joined.
    const memberSince = m.created_at.slice(0, 10);
    const since = memberSince > CLUB_START ? memberSince : CLUB_START;
    const eligibleDates = allRequired.filter((d) => d >= since);
    let completed = 0;
    for (const d of eligibleDates) if (doneDates.has(d)) completed += 1;
    const eligible = eligibleDates.length;
    const missed = eligible - completed;

    byMember.set(m.id, {
      member: m,
      sessions: done.length,
      minutes,
      hours: Math.round((minutes / 60) * 10) / 10,
      buckets,
      timedSessions,
      favorite,
      eligible,
      completed,
      completionPct: eligible === 0 ? 0 : Math.round((completed / eligible) * 100),
      missed,
      owed: missed * PENALTY_USD,
      bestStreak: longestStreak(eligibleDates, doneDates),
    });
  }

  const recaps = [...byMember.values()];
  const groupBuckets: BucketCount[] = BUCKETS.map((b) => ({ key: b.key, count: groupBucketCounts[b.key] }));

  const honorRoll = recaps
    .filter((r) => r.eligible > 0)
    .map((r) => ({
      member: r.member,
      completed: r.completed,
      eligible: r.eligible,
      spotless: r.missed === 0,
    }))
    .sort((a, b) => b.completed - a.completed || (b.completed / b.eligible) - (a.completed / a.eligible))
    .slice(0, 5);

  const totalMinutes = recaps.reduce((s, r) => s + r.minutes, 0);
  const group: GroupRecap = {
    potTotal: recaps.reduce((s, r) => s + r.owed, 0),
    missedTotal: recaps.reduce((s, r) => s + r.missed, 0),
    totalSessions: recaps.reduce((s, r) => s + r.sessions, 0),
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    favorite: pickFavorite(groupBuckets),
    buckets: groupBuckets,
    memberCount: members.length,
    participants: recaps.filter((r) => r.sessions > 0).length,
    honorRoll,
  };

  return { byMember, group };
}

// Highest-count bucket; ties broken by BUCKETS order. null if no timed sessions.
function pickFavorite(buckets: BucketCount[]): BucketKey | null {
  let best: BucketCount | null = null;
  for (const b of buckets) {
    if (b.count === 0) continue;
    if (!best || b.count > best.count) best = b;
  }
  return best?.key ?? null;
}

// Longest run of consecutive *eligible required* dates that were all done.
function longestStreak(eligibleDates: string[], doneDates: Set<string>): number {
  let best = 0;
  let run = 0;
  for (const d of eligibleDates) {
    if (doneDates.has(d)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}
