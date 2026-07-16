import { describe, it, expect } from "vitest";
import { assignChallengeClasses, pickClassForDate } from "../picker";
import { DEMO_CLASSES, DEMO_CHALLENGES } from "../demo";
import { requiredDatesBetween } from "../recap";

const june = DEMO_CHALLENGES.find((c) => c.slug === "june-2026")!;

describe("assignChallengeClasses", () => {
  it("assigns a class to every required day of the challenge", () => {
    const plan = assignChallengeClasses(DEMO_CLASSES, june);
    const required = requiredDatesBetween(june.start_date, june.end_date, june.required_dows);
    expect(required.length).toBeGreaterThan(0);
    for (const d of required) expect(plan.get(d)).toBeDefined();
    expect(plan.size).toBe(required.length);
  });

  it("is deterministic for the same challenge slug", () => {
    const a = assignChallengeClasses(DEMO_CLASSES, june);
    const b = assignChallengeClasses(DEMO_CLASSES, june);
    for (const [date, cls] of a) expect(b.get(date)?.id).toBe(cls.id);
  });

  it("is independent of the order classes arrive from the DB", () => {
    const reversed = [...DEMO_CLASSES].reverse();
    const a = assignChallengeClasses(DEMO_CLASSES, june);
    const b = assignChallengeClasses(reversed, june);
    for (const [date, cls] of a) expect(b.get(date)?.id).toBe(cls.id);
  });

  it("never repeats a video when the library is big enough", () => {
    const plan = assignChallengeClasses(DEMO_CLASSES, june);
    const ids = [...plan.values()].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives each full week one short, one medium, one long session", () => {
    const plan = assignChallengeClasses(DEMO_CLASSES, june);
    // June 2026 challenge: full Mon/Wed/Fri weeks starting Jun 1.
    const bucketOf = (m: number) => (m <= 12 ? "short" : m <= 17 ? "medium" : "long");
    const week1 = ["2026-06-01", "2026-06-03", "2026-06-05"].map((d) => bucketOf(plan.get(d)!.duration_minutes));
    expect(new Set(week1).size).toBe(3);
  });

  it("returns an empty plan when there are no classes", () => {
    expect(assignChallengeClasses([], june).size).toBe(0);
  });
});

describe("pickClassForDate", () => {
  it("is deterministic for a given date", () => {
    const d = new Date(2026, 4, 6);
    expect(pickClassForDate(DEMO_CLASSES, d)?.id).toBe(pickClassForDate(DEMO_CLASSES, d)?.id);
    expect(pickClassForDate([...DEMO_CLASSES].reverse(), d)?.id).toBe(pickClassForDate(DEMO_CLASSES, d)?.id);
  });

  it("returns null with an empty library", () => {
    expect(pickClassForDate([], new Date())).toBeNull();
  });
});
