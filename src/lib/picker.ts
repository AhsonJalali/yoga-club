import { ClassItem, Challenge } from "./supabase";
import { isoDate } from "./schedule";

// Assigns one class to each required day of a challenge, such that:
//   • every week gets one ~10-min, one ~15-min, and one ~20-min session
//     (order rotates week to week — "not necessarily in that order"),
//   • no video repeats within the challenge,
//   • the result is deterministic (seeded by the challenge slug) so everyone
//     sees the same plan.
// Returns a Map of YYYY-MM-DD → ClassItem for the challenge's required days.
export function assignChallengeClasses(classes: ClassItem[], challenge: Challenge): Map<string, ClassItem> {
  const out = new Map<string, ClassItem>();
  if (classes.length === 0) return out;

  // Required dates inside the window, in order.
  const dates: Date[] = [];
  const start = new Date(challenge.start_date + "T00:00:00");
  const end = new Date(challenge.end_date + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (challenge.required_dows.includes(d.getDay())) dates.push(new Date(d));
  }
  if (dates.length === 0) return out;

  // Duration buckets: ~10 (≤12), ~15 (13–17), ~20 (≥18).
  const bucketOf = (m: number) => (m <= 12 ? 0 : m <= 17 ? 1 : 2);
  const buckets: ClassItem[][] = [[], [], []];
  for (const c of classes) buckets[bucketOf(c.duration_minutes)].push(c);

  // Deterministic per-challenge shuffle of each bucket.
  const rng = mulberry32(hashString(challenge.slug));
  for (const b of buckets) {
    b.sort((a, z) => a.id.localeCompare(z.id));
    shuffleInPlace(b, rng);
  }
  const ptr = [0, 0, 0];
  const takeFrom = (bi: number): ClassItem | null => {
    for (let tries = 0; tries < 3; tries++) {
      const k = (bi + tries) % 3;
      const b = buckets[k];
      if (b.length > 0) {
        const c = b[ptr[k] % b.length];
        ptr[k]++;
        return c;
      }
    }
    return null;
  };

  // Group required dates into Monday-anchored weeks.
  const weeks = new Map<string, Date[]>();
  for (const d of dates) {
    const m = new Date(d);
    m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); // back to Monday
    const k = isoDate(m);
    const arr = weeks.get(k) ?? [];
    arr.push(d);
    weeks.set(k, arr);
  }

  [...weeks.keys()].sort().forEach((wk, wi) => {
    const wdates = weeks.get(wk)!.sort((a, b) => a.getTime() - b.getTime());
    const order = [0, 1, 2].map((i) => (i + wi) % 3); // rotate the 10/15/20 order each week
    wdates.forEach((d, di) => {
      const cls = takeFrom(order[di % 3]);
      if (cls) out.set(isoDate(d), cls);
    });
  });

  return out;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Picks the designated class for a given date. Strictly deterministic:
// same date + same library → same class, regardless of which user is viewing
// or what order Supabase returned the rows in. Everyone sees the same video
// for the same day.
export function pickClassForDate(classes: ClassItem[], date: Date): ClassItem | null {
  if (classes.length === 0) return null;
  const dow = date.getDay();
  const wants =
    dow === 1
      ? ["foundation", "beginner", "gentle", "morning"]
      : dow === 3
      ? ["mobility", "balance", "core", "hips", "back", "spine"]
      : dow === 5
      ? ["stretch", "restorative", "full-body", "flexibility"]
      : ["restorative", "gentle", "stretch"];

  const matched = classes.filter((c) => c.tags.some((t) => wants.includes(t)));
  const pool = matched.length > 0 ? matched : classes;

  // Stable sort by id so DB row order doesn't influence the pick.
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));

  const idx = dateHash(date) % sorted.length;
  return sorted[idx];
}

// Combines year/month/day into a single integer that's monotonic in time.
function dateHash(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}
