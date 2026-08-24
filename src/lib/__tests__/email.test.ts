import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sendEmail, appBaseUrl } from "../email";

const ENV_KEYS = ["RESEND_API_KEY", "RESEND_FROM", "NEXT_PUBLIC_APP_URL", "VERCEL_URL"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});
afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  vi.unstubAllGlobals();
});

describe("sendEmail", () => {
  it("logs to console and returns ok when RESEND_API_KEY is unset", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendEmail({ to: "a@x.com", subject: "Hi", html: "<p>hi</p>", text: "hi" });

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy.mock.calls[0][0]).toContain("a@x.com");
  });

  it("posts to the Resend API and returns ok on success", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await sendEmail({ to: "a@x.com", subject: "Hi", html: "<p>hi</p>", text: "hi" });

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      from: "Yoga Club <onboarding@resend.dev>",
      to: "a@x.com",
      subject: "Hi",
      html: "<p>hi</p>",
      text: "hi",
    });
  });

  it("uses RESEND_FROM when set", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM = "Custom <custom@example.com>";
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    await sendEmail({ to: "a@x.com", subject: "Hi", html: "<p>hi</p>" });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.from).toBe("Custom <custom@example.com>");
  });

  it("returns ok: false with the status and body when Resend responds non-ok", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => "invalid recipient",
    });
    vi.stubGlobal("fetch", fetchSpy);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendEmail({ to: "bad", subject: "Hi", html: "<p>hi</p>" });

    expect(result).toEqual({ ok: false, error: "422: invalid recipient" });
  });

  it("returns ok: false on a network error", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const fetchSpy = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchSpy);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendEmail({ to: "a@x.com", subject: "Hi", html: "<p>hi</p>" });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("network down");
  });
});

describe("appBaseUrl", () => {
  it("uses NEXT_PUBLIC_APP_URL when set, stripping a trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://yoga.club/";
    expect(appBaseUrl()).toBe("https://yoga.club");
  });

  it("falls back to VERCEL_URL when NEXT_PUBLIC_APP_URL is unset", () => {
    process.env.VERCEL_URL = "yoga-club-preview.vercel.app";
    expect(appBaseUrl()).toBe("https://yoga-club-preview.vercel.app");
  });

  it("prefers NEXT_PUBLIC_APP_URL over VERCEL_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://yoga.club";
    process.env.VERCEL_URL = "yoga-club-preview.vercel.app";
    expect(appBaseUrl()).toBe("https://yoga.club");
  });

  it("falls back to localhost when neither is set", () => {
    expect(appBaseUrl()).toBe("http://localhost:3000");
  });
});
