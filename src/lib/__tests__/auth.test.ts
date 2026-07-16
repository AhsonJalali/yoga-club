import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, escapeLike } from "../auth";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("om-shanti-6");
    expect(await verifyPassword("om-shanti-6", hash)).toBe(true);
    expect(await verifyPassword("om-shanti-7", hash)).toBe(false);
  });
});

describe("escapeLike", () => {
  it("escapes ILIKE wildcards so emails match literally", () => {
    expect(escapeLike("a%@x.com")).toBe("a\\%@x.com");
    expect(escapeLike("a_b@x.com")).toBe("a\\_b@x.com");
    expect(escapeLike("a\\b@x.com")).toBe("a\\\\b@x.com");
  });

  it("leaves normal emails untouched", () => {
    expect(escapeLike("ahson@example.com")).toBe("ahson@example.com");
  });
});
