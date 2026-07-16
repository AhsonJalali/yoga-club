import { describe, it, expect } from "vitest";
import { bucketForHour, etHour, requiredDatesBetween, computeRecap } from "../recap";
import { DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS, DEMO_CHALLENGES, DEMO_PARTICIPANTS } from "../demo";

const may = DEMO_CHALLENGES.find((c) => c.slug === "may-2026")!;
const june = DEMO_CHALLENGES.find((c) => c.slug === "june-2026")!;

describe("bucketForHour", () => {
  it("maps hours to the right buckets, including boundaries", () => {
    expect(bucketForHour(5)).toBe("earlyMorning");
    expect(bucketForHour(7)).toBe("earlyMorning");
    expect(bucketForHour(8)).toBe("morning");
    expect(bucketForHour(11)).toBe("morning");
    expect(bucketForHour(12)).toBe("afternoon");
    expect(bucketForHour(16)).toBe("afternoon");
    expect(bucketForHour(17)).toBe("evening");
    expect(bucketForHour(20)).toBe("evening");
    expect(bucketForHour(21)).toBe("lateNight");
    expect(bucketForHour(0)).toBe("lateNight");
    expect(bucketForHour(4)).toBe("lateNight");
  });
});

describe("etHour", () => {
  it("converts ISO timestamps to Eastern hours", () => {
    expect(etHour("2026-05-06T19:00:00-04:00")).toBe(19);
    expect(etHour("2026-05-06T23:00:00Z")).toBe(19); // UTC 23:00 = 19:00 EDT
  });

  it("returns null for missing or invalid input", () => {
    expect(etHour("")).toBeNull();
    expect(etHour(null)).toBeNull();
    expect(etHour(undefined)).toBeNull();
    expect(etHour("not-a-date")).toBeNull();
  });
});

describe("requiredDatesBetween", () => {
  it("lists the required dates inclusive of both ends", () => {
    // May 2026: M/W/F between May 6 and May 29.
    const dates = requiredDatesBetween("2026-05-06", "2026-05-29", [1, 3, 5]);
    expect(dates).toHaveLength(11);
    expect(dates[0]).toBe("2026-05-06");
    expect(dates[dates.length - 1]).toBe("2026-05-29");
  });

  it("handles day-of-week sets other than M/W/F", () => {
    const weekends = requiredDatesBetween("2026-07-01", "2026-07-14", [0, 6]);
    expect(weekends).toEqual(["2026-07-04", "2026-07-05", "2026-07-11", "2026-07-12"]);
  });

  it("returns empty when the window is inverted", () => {
    expect(requiredDatesBetween("2026-07-10", "2026-07-01", [1, 3, 5])).toEqual([]);
  });
});

describe("computeRecap (May demo data)", () => {
  const { byMember, group } = computeRecap(DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS, may, DEMO_PARTICIPANTS);
  const amir = byMember.get("m-amir")!;
  const priya = byMember.get("m-priya")!;

  it("counts sessions, required-day completion, and money for a member", () => {
    // Amir did 10 May sessions; 9 landed on the 11 required days.
    expect(amir.sessions).toBe(10);
    expect(amir.eligible).toBe(11);
    expect(amir.completed).toBe(9);
    expect(amir.missed).toBe(2);
    expect(amir.owed).toBe(2 * may.penalty_usd);
    expect(amir.completionPct).toBe(82);
  });

  it("computes the longest streak over required days only", () => {
    // Amir hit every required day May 6–22 (8 in a row), then missed the 25th.
    expect(amir.bestStreak).toBe(8);
  });

  it("marks a spotless member as owing nothing", () => {
    expect(priya.completed).toBe(11);
    expect(priya.missed).toBe(0);
    expect(priya.owed).toBe(0);
  });

  it("averages the ratings a member gave", () => {
    // Amir's May ratings: 5,4,5,3,4,5,4,5 → 4.4 avg over 8 rated.
    expect(amir.ratedCount).toBe(8);
    expect(amir.avgRating).toBe(4.4);
  });

  it("aggregates the group pot from everyone's misses", () => {
    const owedSum = [...byMember.values()].reduce((s, r) => s + r.owed, 0);
    expect(group.potTotal).toBe(owedSum);
    expect(group.missedTotal).toBe(owedSum / may.penalty_usd);
    expect(group.memberCount).toBe(6); // all six demo members joined May
  });
});

describe("computeRecap scoping", () => {
  const { byMember, group } = computeRecap(DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS, june, DEMO_PARTICIPANTS);

  it("excludes members who never joined the challenge", () => {
    expect(byMember.has("m-amir")).toBe(false); // Amir sat out June
    expect(byMember.size).toBe(3); // Sara, Priya, Jordan
  });

  it("scopes the pot to the challenge's own rules and window", () => {
    // 3 enrolled × 12 required days − 2 sessions done = 34 misses × $25.
    expect(group.missedTotal).toBe(34);
    expect(group.potTotal).toBe(850);
    expect(group.totalSessions).toBe(2);
  });

  it("only starts charging a late joiner from their join date", () => {
    const lateParts = [{ id: "p", challenge_id: june.id, member_id: "m-leo", joined_at: "2026-06-08T12:00:00Z" }];
    const { byMember: late } = computeRecap(DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS, june, lateParts);
    const leo = late.get("m-leo")!;
    // Required days on/after Jun 8: 8,10,12,15,17,19,22,24,26 → 9, not 12.
    expect(leo.eligible).toBe(9);
  });
});
