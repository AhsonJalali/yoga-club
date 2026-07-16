import { describe, it, expect } from "vitest";
import {
  todayEasternIso,
  dayKind,
  isRequiredDay,
  isoDate,
  startOfWeek,
  weekDays,
  dowName,
  venmoUrl,
  nextRequiredDay,
} from "../schedule";

// 2026-07-01 is a Wednesday.
const wed = new Date(2026, 6, 1);
const thu = new Date(2026, 6, 2);
const sat = new Date(2026, 6, 4);
const mon = new Date(2026, 6, 6);

describe("todayEasternIso", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayEasternIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("dayKind / isRequiredDay", () => {
  it("marks Mon/Wed/Fri as required by default", () => {
    expect(dayKind(mon)).toBe("required");
    expect(dayKind(wed)).toBe("required");
    expect(dayKind(thu)).toBe("rest");
    expect(dayKind(sat)).toBe("rest");
  });

  it("respects a challenge's own required day set", () => {
    expect(isRequiredDay(thu, [4])).toBe(true); // Thursday-only challenge
    expect(isRequiredDay(mon, [4])).toBe(false);
    expect(isRequiredDay(sat, [0, 6])).toBe(true); // weekend challenge
  });
});

describe("isoDate", () => {
  it("formats local dates without UTC drift", () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(isoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("startOfWeek / weekDays", () => {
  it("anchors weeks on Monday", () => {
    expect(isoDate(startOfWeek(wed))).toBe("2026-06-29");
    expect(isoDate(startOfWeek(mon))).toBe("2026-07-06"); // Monday maps to itself
    expect(isoDate(startOfWeek(new Date(2026, 6, 5)))).toBe("2026-06-29"); // Sunday belongs to prior week
  });

  it("returns 7 consecutive days starting Monday", () => {
    const days = weekDays(thu);
    expect(days).toHaveLength(7);
    expect(dowName(days[0])).toBe("Mon");
    expect(dowName(days[6])).toBe("Sun");
    expect(isoDate(days[0])).toBe("2026-06-29");
    expect(isoDate(days[6])).toBe("2026-07-05");
  });
});

describe("nextRequiredDay", () => {
  it("skips today and lands on the next default required day", () => {
    // From Wednesday → Friday
    expect(isoDate(nextRequiredDay(wed))).toBe("2026-07-03");
    // From Friday → Monday
    expect(isoDate(nextRequiredDay(new Date(2026, 6, 3)))).toBe("2026-07-06");
    // From Saturday → Monday
    expect(isoDate(nextRequiredDay(sat))).toBe("2026-07-06");
  });
});

describe("venmoUrl", () => {
  it("builds a pay link with amount and note", () => {
    const url = new URL(venmoUrl(25, "Yoga Club — missed session"));
    expect(url.hostname).toBe("venmo.com");
    expect(url.searchParams.get("txn")).toBe("pay");
    expect(url.searchParams.get("amount")).toBe("25.00");
    expect(url.searchParams.get("note")).toBe("Yoga Club — missed session");
    expect(url.searchParams.get("recipients")).toBe("AceJalali");
  });
});
