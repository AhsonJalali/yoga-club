import { describe, it, expect } from "vitest";
import {
  currentChallenge,
  upcomingChallenge,
  lastEndedChallenge,
  joinOpen,
  isRevealed,
  revealedRecapChallenge,
  participantsFor,
  isEnrolled,
  challengeIdsForMember,
  windowLabel,
  requiredDowsLabel,
} from "../challenges";
import { Challenge, ChallengeParticipant } from "../supabase";

function ch(overrides: Partial<Challenge> & Pick<Challenge, "id" | "start_date" | "end_date">): Challenge {
  return {
    slug: overrides.id,
    name: overrides.id,
    join_closes_at: null,
    required_dows: [1, 3, 5],
    penalty_usd: 25,
    reveal_at: `${overrides.end_date}T23:59:59-04:00`,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const may = ch({ id: "may", start_date: "2026-05-06", end_date: "2026-05-29", join_closes_at: "2026-05-06", reveal_at: "2026-05-30T00:00:00-04:00" });
const june = ch({ id: "june", start_date: "2026-06-01", end_date: "2026-06-26", join_closes_at: "2026-06-07", reveal_at: "2026-06-27T00:00:00-04:00" });
const july = ch({ id: "july", start_date: "2026-07-06", end_date: "2026-07-31" });
const all = [may, june, july];

describe("currentChallenge", () => {
  it("finds the challenge whose window contains today", () => {
    expect(currentChallenge(all, "2026-05-10")?.id).toBe("may");
    expect(currentChallenge(all, "2026-06-26")?.id).toBe("june"); // end date inclusive
    expect(currentChallenge(all, "2026-06-01")?.id).toBe("june"); // start date inclusive
  });

  it("returns null between challenges", () => {
    expect(currentChallenge(all, "2026-07-02")).toBeNull();
    expect(currentChallenge(all, "2026-05-30")).toBeNull();
  });

  it("prefers the latest-starting challenge when windows overlap", () => {
    const long = ch({ id: "long", start_date: "2026-05-01", end_date: "2026-08-31" });
    expect(currentChallenge([long, june], "2026-06-10")?.id).toBe("june");
  });
});

describe("upcomingChallenge", () => {
  it("returns the soonest strictly-future challenge", () => {
    expect(upcomingChallenge(all, "2026-07-02")?.id).toBe("july");
    expect(upcomingChallenge(all, "2026-05-01")?.id).toBe("may");
  });

  it("excludes a challenge that starts today", () => {
    expect(upcomingChallenge(all, "2026-07-06")).toBeNull();
  });
});

describe("lastEndedChallenge", () => {
  it("returns the most recently ended challenge", () => {
    expect(lastEndedChallenge(all, "2026-07-02")?.id).toBe("june");
    expect(lastEndedChallenge(all, "2026-05-31")?.id).toBe("may");
    expect(lastEndedChallenge(all, "2026-05-01")).toBeNull();
  });

  it("does not count a challenge ending today as ended", () => {
    expect(lastEndedChallenge(all, "2026-06-26")?.id).toBe("may");
  });
});

describe("joinOpen", () => {
  it("closes after join_closes_at", () => {
    expect(joinOpen(june, "2026-06-07")).toBe(true); // last day inclusive
    expect(joinOpen(june, "2026-06-08")).toBe(false);
  });

  it("stays open through end_date when join_closes_at is null", () => {
    expect(joinOpen(july, "2026-07-31")).toBe(true);
    expect(joinOpen(july, "2026-08-01")).toBe(false);
  });
});

describe("isRevealed / revealedRecapChallenge", () => {
  it("reveals only after reveal_at has passed", () => {
    expect(isRevealed(june, new Date("2026-06-26T12:00:00-04:00"))).toBe(false);
    expect(isRevealed(june, new Date("2026-06-27T00:00:01-04:00"))).toBe(true);
  });

  it("surfaces the most recently ended revealed challenge", () => {
    expect(revealedRecapChallenge(all, new Date("2026-07-02T12:00:00-04:00"))?.id).toBe("june");
    expect(revealedRecapChallenge(all, new Date("2026-06-01T12:00:00-04:00"))?.id).toBe("may");
    expect(revealedRecapChallenge(all, new Date("2026-05-01T12:00:00-04:00"))).toBeNull();
  });
});

describe("enrollment helpers", () => {
  const parts: ChallengeParticipant[] = [
    { id: "p1", challenge_id: "may", member_id: "amir", joined_at: "2026-05-06T00:00:00Z" },
    { id: "p2", challenge_id: "may", member_id: "sara", joined_at: "2026-05-06T00:00:00Z" },
    { id: "p3", challenge_id: "june", member_id: "sara", joined_at: "2026-06-01T00:00:00Z" },
  ];

  it("filters participants per challenge", () => {
    expect(participantsFor(parts, "may")).toHaveLength(2);
    expect(participantsFor(parts, "june")).toHaveLength(1);
  });

  it("checks enrollment", () => {
    expect(isEnrolled(parts, "june", "sara")).toBe(true);
    expect(isEnrolled(parts, "june", "amir")).toBe(false);
  });

  it("collects a member's challenge ids", () => {
    expect(challengeIdsForMember(parts, "sara")).toEqual(new Set(["may", "june"]));
    expect(challengeIdsForMember(parts, "amir")).toEqual(new Set(["may"]));
  });
});

describe("labels", () => {
  it("windowLabel collapses same-month ranges", () => {
    expect(windowLabel(may)).toBe("May 6 – 29");
  });

  it("windowLabel spells out cross-month ranges", () => {
    const cross = ch({ id: "x", start_date: "2026-06-29", end_date: "2026-07-24" });
    expect(windowLabel(cross)).toBe("Jun 29 – Jul 24");
  });

  it("requiredDowsLabel names the days", () => {
    expect(requiredDowsLabel(may)).toBe("Mon · Wed · Fri");
    expect(requiredDowsLabel(ch({ id: "y", start_date: "2026-01-01", end_date: "2026-01-31", required_dows: [0, 6] }))).toBe("Sun · Sat");
  });
});
