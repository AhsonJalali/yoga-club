import { describe, it, expect } from "vitest";
import { parseCookieHeader, COOKIE_NAME } from "../cookies";

describe("parseCookieHeader", () => {
  it("returns an empty object for a null header", () => {
    expect(parseCookieHeader(null)).toEqual({});
  });

  it("returns an empty object for an empty header", () => {
    expect(parseCookieHeader("")).toEqual({});
  });

  it("parses a single cookie", () => {
    expect(parseCookieHeader("yc_member=abc123")).toEqual({ yc_member: "abc123" });
  });

  it("parses multiple `; `-separated cookies", () => {
    expect(parseCookieHeader("a=1; yc_member=abc123; b=2")).toEqual({
      a: "1",
      yc_member: "abc123",
      b: "2",
    });
  });

  it("ignores segments with no `=`", () => {
    expect(parseCookieHeader("garbage; yc_member=abc123")).toEqual({ yc_member: "abc123" });
  });

  it("ignores segments with an empty key", () => {
    expect(parseCookieHeader("=novalue; yc_member=abc123")).toEqual({ yc_member: "abc123" });
  });

  it("trims whitespace around keys and values", () => {
    expect(parseCookieHeader("  yc_member  =  abc123  ")).toEqual({ yc_member: "abc123" });
  });

  it("URI-decodes values", () => {
    expect(parseCookieHeader("yc_member=v1.abc%2Fdef")).toEqual({ yc_member: "v1.abc/def" });
  });

  it("falls back to the raw value on malformed percent-encoding instead of throwing", () => {
    expect(() => parseCookieHeader("yc_member=abc%")).not.toThrow();
    expect(parseCookieHeader("yc_member=abc%")).toEqual({ yc_member: "abc%" });
    expect(parseCookieHeader("a=%; yc_member=abc123")).toEqual({ a: "%", yc_member: "abc123" });
  });

  it("exposes the shared cookie name constant", () => {
    expect(COOKIE_NAME).toBe("yc_member");
  });
});
