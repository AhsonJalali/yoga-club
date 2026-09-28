import { describe, it, expect } from "vitest";
import { isRateLimited, recordFailure, clearFailures, _bucketCount } from "../rate-limit";

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

  it("sweeps expired buckets on a later hit so the map doesn't grow unbounded", () => {
    // `buckets` and `lastSweepAt` are module-level singletons shared with the
    // other tests above, so anchor this test far in the future: the first
    // call below is guaranteed to be more than one window past whatever
    // `lastSweepAt` those tests left behind, which triggers a sweep that
    // clears everything they left in `buckets` too.
    const base = Date.now() + 365 * 24 * 60 * 60 * 1000;
    recordFailure("sweep:prime@x.com", base);
    for (let i = 0; i < 5; i++) recordFailure(`sweep:${i}@x.com`, base);
    const peak = _bucketCount();
    expect(peak).toBeGreaterThanOrEqual(5);

    // Past the 15-minute window relative to `base`: this call should trigger
    // another sweep that drops every bucket set above, leaving only the
    // fresh key just touched.
    const t1 = base + 20 * 60 * 1000;
    recordFailure("sweep:trigger@x.com", t1);
    expect(_bucketCount()).toBeLessThan(peak);
  });
});
