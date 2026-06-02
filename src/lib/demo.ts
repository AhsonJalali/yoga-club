// Mock data shown when Supabase isn't configured. Lets you click through the
// UI to see the visual vibe without standing up a backend.

import { Member, ClassItem, CheckIn, Challenge, ChallengeParticipant } from "./supabase";

export const DEMO_MEMBERS: Member[] = [
  { id: "m-amir", email: "amir@example.com", name: "Amir", venmo_handle: "AceJalali", created_at: "2026-04-01T00:00:00Z" },
  { id: "m-sara", email: "sara@example.com", name: "Sara", venmo_handle: null, created_at: "2026-04-01T00:00:00Z" },
  { id: "m-jordan", email: "jordan@example.com", name: "Jordan", venmo_handle: null, created_at: "2026-04-01T00:00:00Z" },
  { id: "m-priya", email: "priya@example.com", name: "Priya", venmo_handle: null, created_at: "2026-04-01T00:00:00Z" },
  { id: "m-leo", email: "leo@example.com", name: "Leo", venmo_handle: null, created_at: "2026-04-15T00:00:00Z" },
  { id: "m-maya", email: "maya@example.com", name: "Maya", venmo_handle: null, created_at: "2026-04-15T00:00:00Z" },
];

export const DEMO_CLASSES: ClassItem[] = [
  { id: "c-1", title: "Yoga For Complete Beginners", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=v7AYKMP6rOE", duration_minutes: 24, tags: ["foundation", "beginner"] },
  { id: "c-2", title: "15 Min Gentle Morning Yoga for Beginners", instructor: "Yoga With Kassandra", youtube_url: "https://www.youtube.com/watch?v=QyHO_BkBUp8", duration_minutes: 15, tags: ["foundation", "beginner", "gentle", "morning"] },
  { id: "c-3", title: "Foundations of Flow", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=1p-ayBIRRHs", duration_minutes: 20, tags: ["foundation", "beginner"] },
  { id: "c-4", title: "20 Min Morning Yoga for Energy", instructor: "Travis Eliot", youtube_url: "https://www.youtube.com/watch?v=q-BkzP-AXRo", duration_minutes: 20, tags: ["morning", "foundation"] },
  { id: "c-5", title: "10 Min Yoga Stretch for Neck & Upper Back", instructor: "SarahBeth Yoga", youtube_url: "https://www.youtube.com/watch?v=fDzJbizG0cQ", duration_minutes: 10, tags: ["back", "mobility"] },
  { id: "c-6", title: "20 Min Yoga For Hips - Feel Good Flow", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=zwoVcrdmLOE", duration_minutes: 24, tags: ["hips", "mobility"] },
  { id: "c-7", title: "Fine Tune Your Balance - 30 Min", instructor: "Five Parks Yoga", youtube_url: "https://www.youtube.com/watch?v=QF05F54ltzk", duration_minutes: 30, tags: ["balance", "mobility"] },
  { id: "c-8", title: "20 Min Daily Yoga Flow - Full Body", instructor: "Charlie Follows", youtube_url: "https://www.youtube.com/watch?v=AkVJtluZLTo", duration_minutes: 20, tags: ["full-body", "flexibility"] },
  { id: "c-9", title: "20 Min Yoga for Flexibility & Relaxation", instructor: "Yoga With Kassandra", youtube_url: "https://www.youtube.com/watch?v=4Lq5Sf9FDpY", duration_minutes: 20, tags: ["stretch", "flexibility", "restorative"] },
  { id: "c-10", title: "20 Min Full Body Yoga to Recharge", instructor: "Yoga With Bird", youtube_url: "https://www.youtube.com/watch?v=lT_dNUpDvUE", duration_minutes: 20, tags: ["full-body", "stretch"] },
];

// Two challenges: May (completed, recap revealed) and June (current, opt-in open).
export const DEMO_CHALLENGES: Challenge[] = [
  { id: "ch-may", slug: "may-2026", name: "May 2026", start_date: "2026-05-06", end_date: "2026-05-29", join_closes_at: "2026-05-06", required_dows: [1, 3, 5], penalty_usd: 25, reveal_at: "2026-05-30T00:00:00-04:00", created_at: "2026-05-01T00:00:00Z" },
  { id: "ch-june", slug: "june-2026", name: "June 2026", start_date: "2026-06-01", end_date: "2026-06-26", join_closes_at: "2026-06-07", required_dows: [1, 3, 5], penalty_usd: 25, reveal_at: "2026-06-27T00:00:00-04:00", created_at: "2026-05-25T00:00:00Z" },
];

// May: everyone. June: Sara, Priya, Jordan are in — Amir (the demo "me") is NOT,
// so the opt-in flow is visible.
const enroll = (challenge_id: string, ids: string[], joined_at: string): ChallengeParticipant[] =>
  ids.map((member_id, i) => ({ id: `${challenge_id}-p${i}`, challenge_id, member_id, joined_at }));

export const DEMO_PARTICIPANTS: ChallengeParticipant[] = [
  ...enroll("ch-may", ["m-amir", "m-sara", "m-jordan", "m-priya", "m-leo", "m-maya"], "2026-05-06T00:00:00Z"),
  ...enroll("ch-june", ["m-sara", "m-priya", "m-jordan"], "2026-06-01T00:00:00Z"),
];

function ci(member_id: string, session_date: string, opts: { hour?: number; challenge_id?: string | null } = {}): CheckIn {
  const created_at = opts.hour != null ? `${session_date}T${String(opts.hour).padStart(2, "0")}:00:00-04:00` : "";
  return { id: `${member_id}-${session_date}`, member_id, class_id: null, session_date, status: "done", note: null, created_at, challenge_id: opts.challenge_id ?? null };
}

// Pre-club April practice (untagged — belongs to no challenge).
const APRIL: Record<string, string[]> = {
  "m-amir": ["2026-04-01", "2026-04-06", "2026-04-13", "2026-04-22", "2026-04-29"],
  "m-priya": ["2026-04-03", "2026-04-10", "2026-04-17", "2026-04-24"],
};

// May challenge sessions with check-in times [date, ET hour].
const MAY: Record<string, [string, number][]> = {
  "m-amir": [["2026-05-06", 19], ["2026-05-08", 20], ["2026-05-10", 9], ["2026-05-11", 18], ["2026-05-13", 22], ["2026-05-15", 19], ["2026-05-18", 7], ["2026-05-20", 20], ["2026-05-22", 21], ["2026-05-27", 19]],
  "m-sara": [["2026-05-06", 14], ["2026-05-11", 13], ["2026-05-15", 16], ["2026-05-20", 15], ["2026-05-22", 12], ["2026-05-27", 14]],
  "m-jordan": [["2026-05-08", 23], ["2026-05-15", 22], ["2026-05-22", 21], ["2026-05-29", 23]],
  "m-priya": [["2026-05-06", 8], ["2026-05-08", 9], ["2026-05-11", 7], ["2026-05-13", 8], ["2026-05-15", 9], ["2026-05-18", 7], ["2026-05-20", 8], ["2026-05-22", 9], ["2026-05-25", 7], ["2026-05-27", 8], ["2026-05-29", 9]],
  "m-leo": [["2026-05-06", 22], ["2026-05-13", 23], ["2026-05-20", 22], ["2026-05-27", 21], ["2026-05-29", 23]],
  "m-maya": [["2026-05-06", 13], ["2026-05-08", 15], ["2026-05-13", 14], ["2026-05-15", 16], ["2026-05-20", 13], ["2026-05-22", 15], ["2026-05-27", 14]],
};

// June challenge — a little activity on day one (Mon Jun 1).
const JUNE: Record<string, [string, number][]> = {
  "m-priya": [["2026-06-01", 8]],
  "m-sara": [["2026-06-01", 13]],
};

export const DEMO_CHECK_INS: CheckIn[] = [
  ...Object.entries(APRIL).flatMap(([mid, dates]) => dates.map((d) => ci(mid, d))),
  ...Object.entries(MAY).flatMap(([mid, entries]) => entries.map(([d, h]) => ci(mid, d, { hour: h, challenge_id: "ch-may" }))),
  ...Object.entries(JUNE).flatMap(([mid, entries]) => entries.map(([d, h]) => ci(mid, d, { hour: h, challenge_id: "ch-june" }))),
];

// "Logged-in" demo user.
export const DEMO_ME: Member = DEMO_MEMBERS[0];
