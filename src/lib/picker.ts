import { ClassItem } from "./supabase";

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
