import { describe, it, expect } from "vitest";
import { isRateLimited, recordFailure, clearFailures } from "../rate-limit";

describe("rate limiter", () => {
  it("blocks after 10 failures and unblocks when the window expires", () => {
    const key = "signin:block@x.com";
    const t0 = Date.now();
    for (let i = 0; i < 10; i++) {
      expect(isRateLimited(key, t0)).toBe(false);
      recordFailure(key, t0);
    }
    expect(isRateLimited(key, t0)).toBe(true);
    // 15-minute window has passed → fresh bucket.
    expect(isRateLimited(key, t0 + 16 * 60 * 1000)).toBe(false);
  });

  it("clears on success", () => {
    const key = "signin:clear@x.com";
    const t0 = Date.now();
    for (let i = 0; i < 10; i++) recordFailure(key, t0);
    expect(isRateLimited(key, t0)).toBe(true);
    clearFailures(key);
    expect(isRateLimited(key, t0)).toBe(false);
  });

  it("tracks keys independently", () => {
    const t0 = Date.now();
    for (let i = 0; i < 10; i++) recordFailure("signin:a@x.com", t0);
    expect(isRateLimited("signin:a@x.com", t0)).toBe(true);
    expect(isRateLimited("signin:b@x.com", t0)).toBe(false);
  });
});
