// Signed session tokens. The cookie used to hold the raw member UUID, which
// anyone could forge if they learned an id. Now it holds
//
//   v1.<memberId>.<expiresEpochSeconds>.<hmac-sha256 base64url>
//
// signed with SESSION_SECRET, so a cookie is only valid if this server minted
// it. Rotating SESSION_SECRET invalidates every session at once.
// Member ids are UUIDs (no dots), so "." is a safe separator.

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_TTL_S = 365 * 24 * 60 * 60;

export function isSessionSecretConfigured(): boolean {
  return Boolean(process.env.SESSION_SECRET);
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Missing SESSION_SECRET env var — set it in .env.local / Vercel.");
  return s;
}

function mac(payload: string): Buffer {
  return createHmac("sha256", secret()).update(payload).digest();
}

export function signSession(memberId: string, ttlSeconds: number = SESSION_TTL_S): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${memberId}.${exp}`;
  return `v1.${payload}.${mac(payload).toString("base64url")}`;
}

// The member id inside a valid, unexpired token; null for anything else
// (missing, malformed, tampered, expired, or a legacy raw-UUID cookie).
export function verifySession(token: string | null | undefined): string | null {
  if (!token) return null;
  if (!isSessionSecretConfigured()) {
    console.error("[session] SESSION_SECRET not set — rejecting all sessions");
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;
  const [, memberId, expStr, sig] = parts;
  if (!memberId) return null;
  const exp = Number(expStr);
  if (!Number.isInteger(exp) || exp * 1000 < Date.now()) return null;
  const expected = mac(`${memberId}.${expStr}`);
  let got: Buffer;
  try {
    got = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  return memberId;
}
