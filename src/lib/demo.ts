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
  { id: "c-1", title: "Yoga For Complete Beginners", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=v7AYKMP6rOE", duration_minutes: 20, tags: ["beginner", "foundation"] },
  { id: "c-2", title: "Day 1 - Ease Into It (30 Days of Yoga)", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=oBu-pQG6sTY", duration_minutes: 20, tags: ["beginner", "foundation"] },
  { id: "c-3", title: "Full Body Flow", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=b1H3xO3x_Js", duration_minutes: 20, tags: ["beginner", "full-body"] },
  { id: "c-4", title: "Yoga For Anxiety and Stress", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=hJbRpHZr_d0", duration_minutes: 25, tags: ["gentle", "stress"] },
  { id: "c-5", title: "Total Body Yoga - Deep Stretch", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=GLy2rYHwUqY", duration_minutes: 30, tags: ["stretch", "restorative", "full-body"] },
  { id: "c-6", title: "Yoga For Neck, Shoulders, Upper Back", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=X3-gKPNyrTA", duration_minutes: 10, tags: ["mobility", "back", "spine"] },
  { id: "c-7", title: "Yoga At Your Desk", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=tAUf7aajBWE", duration_minutes: 15, tags: ["mobility", "gentle"] },
  { id: "c-8", title: "Yoga For People Who Sit All Day", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=a-sZbOfau6c", duration_minutes: 25, tags: ["mobility", "hips", "back"] },
  { id: "c-9", title: "Yoga For Heavy Hearts", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=2akHh5GgzvM", duration_minutes: 30, tags: ["gentle", "restorative"] },
  { id: "c-10", title: "Mountain Flow - Hands Free Yoga", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=arydjHTU0iE", duration_minutes: 30, tags: ["balance", "full-body"] },
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
