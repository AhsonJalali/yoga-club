// Weekly schedule rules. Required sessions: Mon, Wed, Fri.
// Penalty per missed required session: $25, payable to @AceJalali on Venmo.

export const REQUIRED_DOWS = [1, 3, 5] as const; // Mon, Wed, Fri (Sunday=0)
export const PENALTY_USD = 25;
export const VENMO_HANDLE = "AceJalali";
// Yoga Club officially kicks off this date. Earlier required days don't
// count toward the leaderboard or the pot, even if a member exists then.
export const CLUB_START = "2026-05-06";

export type DayKind = "required" | "rest";

export function dayKind(date: Date): DayKind {
  return REQUIRED_DOWS.includes(date.getDay() as 1 | 3 | 5) ? "required" : "rest";
}

export function dayLabel(date: Date): string {
  const dow = date.getDay();
  if (dow === 1) return "Monday — beginner foundation or gentle flow (~20 min)";
  if (dow === 3) return "Wednesday — mobility, balance, or light core (~20 min)";
  if (dow === 5) return "Friday — stretch, restorative, or full-body beginner (20–40 min)";
  return "Recovery day — rest, walk, or breathe. No penalty.";
}

export function isoDate(date: Date): string {
  // Local-time YYYY-MM-DD; avoids UTC drift for "today".
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfWeek(date: Date): Date {
  // Week starts Monday.
  const d = new Date(date);
  const dow = d.getDay();
  const diff = (dow + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function dowName(date: Date): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

export function venmoUrl(amount: number, note: string): string {
  const params = new URLSearchParams({
    txn: "pay",
    audience: "private",
    recipients: VENMO_HANDLE,
    amount: amount.toFixed(2),
    note,
  });
  return `https://venmo.com/?${params.toString()}`;
}

export type DayTheme = {
  label: string;
  sub: string;
  emoji: "sunrise" | "wave" | "leaf" | "moon";
};

export function dayTheme(date: Date): DayTheme {
  const dow = date.getDay();
  if (dow === 1) return { label: "Foundation Day", sub: "set the tone for the week", emoji: "sunrise" };
  if (dow === 3) return { label: "Mobility Day", sub: "loosen up the middle", emoji: "wave" };
  if (dow === 5) return { label: "Stretch Day", sub: "ease into the weekend", emoji: "leaf" };
  return { label: "Recovery Day", sub: "rest is part of the work", emoji: "moon" };
}

// Returns the next required day strictly after `from` (skipping today).
export function nextRequiredDay(from: Date): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 7; i++) {
    const cand = new Date(d);
    cand.setDate(d.getDate() + i);
    if (REQUIRED_DOWS.includes(cand.getDay() as 1 | 3 | 5)) return cand;
  }
  return d;
}
