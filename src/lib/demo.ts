// Mock data shown when Supabase isn't configured. Lets you click through the
// UI to see the visual vibe without standing up a backend.

import { Member, ClassItem, CheckIn } from "./supabase";

export const DEMO_MEMBERS: Member[] = [
  { id: "m-amir", name: "Amir", venmo_handle: "AceJalali", created_at: "2026-04-01T00:00:00Z" },
  { id: "m-sara", name: "Sara", venmo_handle: null, created_at: "2026-04-01T00:00:00Z" },
  { id: "m-jordan", name: "Jordan", venmo_handle: null, created_at: "2026-04-01T00:00:00Z" },
  { id: "m-priya", name: "Priya", venmo_handle: null, created_at: "2026-04-01T00:00:00Z" },
  { id: "m-leo", name: "Leo", venmo_handle: null, created_at: "2026-04-15T00:00:00Z" },
  { id: "m-maya", name: "Maya", venmo_handle: null, created_at: "2026-04-15T00:00:00Z" },
];

export const DEMO_CLASSES: ClassItem[] = [
  { id: "c-1", title: "Yoga For Complete Beginners", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=v7AYKMP6rOE", duration_minutes: 20, tags: ["beginner", "foundation"] },
  { id: "c-2", title: "20 Minute Morning Yoga", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=4pKly2JojMw", duration_minutes: 20, tags: ["beginner", "morning"] },
  { id: "c-3", title: "Gentle Yoga Flow", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=oX6I1HHDgFI", duration_minutes: 20, tags: ["gentle", "flow"] },
  { id: "c-4", title: "Yoga For Hips and Lower Back", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=hJbRpHZr_d0", duration_minutes: 25, tags: ["mobility", "hips", "back"] },
  { id: "c-5", title: "Yoga For Flexibility", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=L_xrDAtykMI", duration_minutes: 20, tags: ["flexibility", "stretch"] },
  { id: "c-6", title: "Yoga For Balance", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=M-8FvC3GD8c", duration_minutes: 20, tags: ["balance", "beginner"] },
  { id: "c-7", title: "Beginner Full Body Flow", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=149LrbqKEbk", duration_minutes: 30, tags: ["beginner", "full-body"] },
  { id: "c-8", title: "Restorative Yoga", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=BiWnAOs6e_E", duration_minutes: 35, tags: ["restorative", "gentle"] },
  { id: "c-9", title: "Slow Stretch Flow", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=sTANio_2E0Q", duration_minutes: 30, tags: ["stretch", "restorative"] },
  { id: "c-10", title: "Light Core Yoga", instructor: "Yoga With Adriene", youtube_url: "https://www.youtube.com/watch?v=MZCXf9Wngc4", duration_minutes: 20, tags: ["core", "beginner"] },
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
