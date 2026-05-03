import { NextRequest, NextResponse } from "next/server";
import { clearMemberCookie } from "../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST only. A GET handler here was a critical bug: Next.js <Link> auto-prefetches
// in production, so a `<Link href="/logout">` would silently fire GET /logout the
// moment the dashboard rendered, wiping the cookie that signin had just set.
export async function POST(req: NextRequest) {
  await clearMemberCookie();
  return NextResponse.redirect(new URL("/login", req.url), 303);
}
