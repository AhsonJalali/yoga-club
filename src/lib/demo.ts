// Mock data shown when Supabase isn't configured. Lets you click through the
// UI to see the visual vibe without standing up a backend.

import { Member, ClassItem, CheckIn } from "./supabase";

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
  { id: "c-2", title: "20 Min Yoga For Beginners - Start Here", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=vNyJuQuuMC8", duration_minutes: 22, tags: ["foundation", "beginner"] },
  { id: "c-3", title: "Foundations of Flow", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=1p-ayBIRRHs", duration_minutes: 20, tags: ["foundation", "beginner"] },
  { id: "c-4", title: "Morning Yoga Flow - 20 Min", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=LqXZ628YNj4", duration_minutes: 22, tags: ["morning", "beginner", "gentle"] },
  { id: "c-5", title: "Yoga For Neck, Shoulders, Upper Back", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=X3-gKPNyrTA", duration_minutes: 11, tags: ["mobility", "back", "spine"] },
  { id: "c-6", title: "20 Min Yoga For Hips - Feel Good Flow", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=zwoVcrdmLOE", duration_minutes: 24, tags: ["hips", "mobility"] },
  { id: "c-7", title: "Brain + Body Balance - 22 Min", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=XN3JB67-a_k", duration_minutes: 23, tags: ["balance", "mobility"] },
  { id: "c-8", title: "Yoga Stretch", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=AF9d2Icl4fA", duration_minutes: 21, tags: ["stretch", "flexibility", "full-body"] },
  { id: "c-9", title: "Yoga For Heavy Hearts", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=2akHh5GgzvM", duration_minutes: 19, tags: ["gentle", "restorative"] },
  { id: "c-10", title: "Yoga Flow - 20 Min Vinyasa", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=xmeNZI8inWI", duration_minutes: 19, tags: ["full-body", "flexibility"] },
];

// April 2026 + early May required dates: realistic-looking attendance.
function ci(member_id: string, session_date: string): CheckIn {
  return { id: `${member_id}-${session_date}`, member_id, class_id: null, session_date, status: "done", note: null, created_at: "" };
}

const DATES = {
  amir: ["2026-04-01", "2026-04-03", "2026-04-06", "2026-04-10", "2026-04-13", "2026-04-17", "2026-04-22", "2026-04-24", "2026-04-27", "2026-04-29", "2026-05-01"],
  sara: ["2026-04-01", "2026-04-06", "2026-04-10", "2026-04-17", "2026-04-24", "2026-04-27"],
  jordan: ["2026-04-06", "2026-04-13", "2026-04-20", "2026-04-27"],
  priya: ["2026-04-01", "2026-04-03", "2026-04-06", "2026-04-08", "2026-04-10", "2026-04-13", "2026-04-15", "2026-04-17", "2026-04-20", "2026-04-22", "2026-04-24", "2026-04-27", "2026-04-29", "2026-05-01"],
  leo: ["2026-04-17", "2026-04-24", "2026-05-01"],
  maya: ["2026-04-22", "2026-04-27", "2026-05-01"],
};

export const DEMO_CHECK_INS: CheckIn[] = [
  ...DATES.amir.map((d) => ci("m-amir", d)),
  ...DATES.sara.map((d) => ci("m-sara", d)),
  ...DATES.jordan.map((d) => ci("m-jordan", d)),
  ...DATES.priya.map((d) => ci("m-priya", d)),
  ...DATES.leo.map((d) => ci("m-leo", d)),
  ...DATES.maya.map((d) => ci("m-maya", d)),
];

// "Logged-in" demo user.
export const DEMO_ME: Member = DEMO_MEMBERS[0];
