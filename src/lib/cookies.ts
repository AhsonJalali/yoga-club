// Shared cookie-header fallback used by Route Handlers on Next 16, where
// req.cookies.get() can return an empty jar (see fix history). Route
// handlers fall back to parsing the raw Cookie header when that happens.
export const COOKIE_NAME = "yc_member";

export function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (!k) continue;
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      // Malformed percent-encoding (e.g. a stray "%" not followed by two hex
      // digits) — decodeURIComponent throws URIError. Fall back to the raw
      // value instead of letting a bad Cookie header crash the route.
      out[k] = v;
    }
  }
  return out;
}
