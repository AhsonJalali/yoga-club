// Challenge selection + enrollment helpers. Pure functions over rows fetched
// from Supabase (or demo data). A "challenge" owns its own window, rules,
// penalty, pot, participants, and recap reveal time.

import { Challenge, ChallengeParticipant } from "./supabase";

// The challenge whose [start_date, end_date] window contains `todayIso`. If
// more than one overlaps, the latest-starting wins. null if none active today.
export function currentChallenge(challenges: Challenge[], todayIso: string): Challenge | null {
  const active = challenges
    .filter((c) => c.start_date <= todayIso && todayIso <= c.end_date)
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  return active[0] ?? null;
}

// The soonest challenge that starts strictly in the future.
export function upcomingChallenge(challenges: Challenge[], todayIso: string): Challenge | null {
  const future = challenges
    .filter((c) => c.start_date > todayIso)
    .sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
  return future[0] ?? null;
}

// The most recently-ended challenge (end_date strictly before today).
export function lastEndedChallenge(challenges: Challenge[], todayIso: string): Challenge | null {
  const ended = challenges
    .filter((c) => c.end_date < todayIso)
    .sort((a, b) => (a.end_date < b.end_date ? 1 : -1));
  return ended[0] ?? null;
}

// Is the opt-in (grace) window still open for this challenge as of `todayIso`?
// join_closes_at null means it stays open through the end.
export function joinOpen(c: Challenge, todayIso: string): boolean {
  return todayIso <= (c.join_closes_at ?? c.end_date);
}

export function isRevealed(c: Challenge, now: Date = new Date()): boolean {
  return new Date(c.reveal_at).getTime() <= now.getTime();
}

// The recap to surface now: the most recently-ended challenge whose reveal time
// has passed. null if no challenge has revealed yet.
export function revealedRecapChallenge(challenges: Challenge[], now: Date = new Date()): Challenge | null {
  const revealed = challenges
    .filter((c) => isRevealed(c, now))
    .sort((a, b) => (a.end_date < b.end_date ? 1 : -1));
  return revealed[0] ?? null;
}

// --- enrollment ---------------------------------------------------------

export function participantsFor(participants: ChallengeParticipant[], challengeId: string): ChallengeParticipant[] {
  return participants.filter((p) => p.challenge_id === challengeId);
}

export function isEnrolled(participants: ChallengeParticipant[], challengeId: string, memberId: string): boolean {
  return participants.some((p) => p.challenge_id === challengeId && p.member_id === memberId);
}

// Set of challenge ids a member has joined (for all-time / profile views).
export function challengeIdsForMember(participants: ChallengeParticipant[], memberId: string): Set<string> {
  return new Set(participants.filter((p) => p.member_id === memberId).map((p) => p.challenge_id));
}

// Human label like "May 6 – 29" for a challenge window.
export function windowLabel(c: Challenge): string {
  const s = new Date(c.start_date + "T00:00:00");
  const e = new Date(c.end_date + "T00:00:00");
  const sM = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const eM =
    s.getMonth() === e.getMonth()
      ? e.toLocaleDateString("en-US", { day: "numeric" })
      : e.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${sM} – ${eM}`;
}

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function requiredDowsLabel(c: Challenge): string {
  return c.required_dows.map((d) => DOW_NAMES[d]).join(" · ");
}
