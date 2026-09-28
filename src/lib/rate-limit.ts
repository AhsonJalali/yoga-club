// Tiny in-memory failure limiter for auth endpoints. On Vercel each warm
// lambda instance has its own map, so this is a speed bump for casual
// brute-forcing rather than a hard guarantee — good enough for a small club
// without adding a DB table. State resets on cold start.

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

// Buckets for keys that stop being touched (e.g. one-off bogus emails from a
// scripted /forgot or /signin probe) would otherwise sit in the map forever —
// nothing ever deletes them apart from a success on that exact key. Sweep
// expired entries at most once per window so a long-lived instance (a dev
// server, or a warm lambda under sustained probing) doesn't grow unbounded.
let lastSweepAt = 0;

function sweep(now: number): void {
  if (now - lastSweepAt < WINDOW_MS) return;
  lastSweepAt = now;
  for (const [key, e] of buckets) {
    if (e.resetAt <= now) buckets.delete(key);
  }
}

function entry(key: string, now: number): Entry {
  sweep(now);
  const e = buckets.get(key);
  if (e && e.resetAt > now) return e;
  const fresh = { count: 0, resetAt: now + WINDOW_MS };
  buckets.set(key, fresh);
  return fresh;
}

// Number of tracked keys — exposed only so tests can verify the sweep keeps
// the map bounded; not used by the rate-limit checks themselves.
export function _bucketCount(): number {
  return buckets.size;
}

// True if this key has failed too many times recently and should be blocked.
export function isRateLimited(key: string, now: number = Date.now()): boolean {
  return entry(key, now).count >= MAX_FAILURES;
}

// Record a failed attempt (call only on failure — successful logins are free).
export function recordFailure(key: string, now: number = Date.now()): void {
  entry(key, now).count += 1;
}

// Clear a key after a successful attempt so a legit user isn't stuck behind
// their own typos.
export function clearFailures(key: string): void {
  buckets.delete(key);
}
