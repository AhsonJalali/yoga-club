import { ClassItem } from "./supabase";

// Picks the suggested class for a given date, deterministically. Same inputs
// always produce the same class so the calendar is stable across renders.
export function pickClassForDate(classes: ClassItem[], date: Date): ClassItem | null {
  if (classes.length === 0) return null;
  const dow = date.getDay();
  const wants =
    dow === 1
      ? ["foundation", "beginner", "gentle"]
      : dow === 3
      ? ["mobility", "balance", "core"]
      : dow === 5
      ? ["stretch", "restorative", "full-body"]
      : ["restorative", "gentle", "stretch"];
  const matched = classes.filter((c) => c.tags.some((t) => wants.includes(t)));
  const pool = matched.length > 0 ? matched : classes;
  const idx = (date.getFullYear() * 1000 + date.getMonth() * 31 + date.getDate()) % pool.length;
  return pool[idx];
}
