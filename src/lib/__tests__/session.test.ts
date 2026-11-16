import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockJar = {
  set: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockJar)),
}));

vi.mock("../supabase", () => ({
  isSupabaseConfigured: vi.fn(),
  supabase: vi.fn(),
}));

vi.mock("../session-token", () => ({
  signSession: vi.fn((memberId: string) => `signed.${memberId}`),
  verifySession: vi.fn(),
  SESSION_TTL_S: 31536000,
}));

vi.mock("../demo", () => ({
  DEMO_ME: {
    id: "demo-id",
    email: "demo@example.com",
    name: "Demo Member",
    venmo_handle: null,
    created_at: "2026-01-01T00:00:00Z",
    avatar_url: null,
  },
}));

import { setMemberCookie, clearMemberCookie, currentMember } from "../session";
import { isSupabaseConfigured, supabase } from "../supabase";
import { verifySession } from "../session-token";

function mockSupabaseResult(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  (supabase as ReturnType<typeof vi.fn>).mockReturnValue({ from });
  return { from, select, eq, maybeSingle };
}

describe("setMemberCookie", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("signs the member id and sets it as an httpOnly, lax, path-/ cookie", async () => {
    await setMemberCookie("member-123");
    expect(mockJar.set).toHaveBeenCalledWith(
      "yc_member",
      "signed.member-123",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 31536000,
      })
    );
  });

  it("marks the cookie secure only in production", async () => {
    process.env.NODE_ENV = "production";
    await setMemberCookie("member-123");
    expect(mockJar.set).toHaveBeenCalledWith("yc_member", expect.any(String), expect.objectContaining({ secure: true }));

    process.env.NODE_ENV = "test";
    await setMemberCookie("member-123");
    expect(mockJar.set).toHaveBeenCalledWith("yc_member", expect.any(String), expect.objectContaining({ secure: false }));
  });
});

describe("clearMemberCookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the session cookie", async () => {
    await clearMemberCookie();
    expect(mockJar.delete).toHaveBeenCalledWith("yc_member");
  });
});

describe("currentMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJar.get.mockReturnValue(undefined);
  });

  it("returns the demo member when Supabase isn't configured, without reading the cookie", async () => {
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const member = await currentMember();
    expect(member).toEqual(
      expect.objectContaining({ id: "demo-id", email: "demo@example.com" })
    );
    expect(mockJar.get).not.toHaveBeenCalled();
  });

  it("returns null when there is no session cookie", async () => {
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    mockJar.get.mockReturnValue(undefined);
    const member = await currentMember();
    expect(member).toBeNull();
  });

  it("returns null when the cookie fails verification (missing, malformed, tampered, or expired)", async () => {
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    mockJar.get.mockReturnValue({ value: "bogus-token" });
    (verifySession as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const member = await currentMember();
    expect(member).toBeNull();
    expect(verifySession).toHaveBeenCalledWith("bogus-token");
  });

  it("looks up the verified member id in Supabase and returns the row", async () => {
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    mockJar.get.mockReturnValue({ value: "v1.member-123.123.sig" });
    (verifySession as ReturnType<typeof vi.fn>).mockReturnValue("member-123");
    const row = { id: "member-123", email: "a@b.com", name: "A", venmo_handle: null, created_at: "x", avatar_url: null };
    const { from, select, eq } = mockSupabaseResult({ data: row, error: null });

    const member = await currentMember();

    expect(from).toHaveBeenCalledWith("members");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("id", "member-123");
    expect(member).toEqual(row);
  });

  it("returns null when Supabase errors", async () => {
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    mockJar.get.mockReturnValue({ value: "v1.member-123.123.sig" });
    (verifySession as ReturnType<typeof vi.fn>).mockReturnValue("member-123");
    mockSupabaseResult({ data: null, error: { message: "boom" } });

    const member = await currentMember();
    expect(member).toBeNull();
  });

  it("returns null when the member row doesn't exist", async () => {
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    mockJar.get.mockReturnValue({ value: "v1.member-123.123.sig" });
    (verifySession as ReturnType<typeof vi.fn>).mockReturnValue("member-123");
    mockSupabaseResult({ data: null, error: null });

    const member = await currentMember();
    expect(member).toBeNull();
  });
});
