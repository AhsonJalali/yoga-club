import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { signSession, verifySession, isSessionSecretConfigured } from "../session-token";

const MEMBER = "1cbe9a59-4f1f-4e6b-9a2e-0d5a1f2b3c4d";

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret";
});
afterEach(() => {
  delete process.env.SESSION_SECRET;
});

describe("signSession / verifySession", () => {
  it("round-trips a member id", () => {
    expect(verifySession(signSession(MEMBER))).toBe(MEMBER);
  });

  it("rejects a legacy raw-UUID cookie", () => {
    expect(verifySession(MEMBER)).toBeNull();
  });

  it("rejects missing or garbage tokens", () => {
    expect(verifySession(null)).toBeNull();
    expect(verifySession(undefined)).toBeNull();
    expect(verifySession("")).toBeNull();
    expect(verifySession("v1.a.b")).toBeNull();
    expect(verifySession("v2.a.1.c")).toBeNull();
  });

  it("rejects a tampered member id", () => {
    const token = signSession(MEMBER);
    const other = "2cbe9a59-4f1f-4e6b-9a2e-0d5a1f2b3c4d";
    const [v, , exp, mac] = token.split(".");
    expect(verifySession(`${v}.${other}.${exp}.${mac}`)).toBeNull();
  });

  it("rejects a tampered expiry", () => {
    const token = signSession(MEMBER);
    const [v, id, exp, mac] = token.split(".");
    expect(verifySession(`${v}.${id}.${Number(exp) + 9999}.${mac}`)).toBeNull();
  });

  it("rejects an expired token", () => {
    expect(verifySession(signSession(MEMBER, -60))).toBeNull();
  });

  it("rejects tokens signed with a different secret", () => {
    const token = signSession(MEMBER);
    process.env.SESSION_SECRET = "rotated-secret";
    expect(verifySession(token)).toBeNull();
  });

  it("rejects everything when the secret is unset", () => {
    const token = signSession(MEMBER);
    delete process.env.SESSION_SECRET;
    expect(isSessionSecretConfigured()).toBe(false);
    expect(verifySession(token)).toBeNull();
  });
});
