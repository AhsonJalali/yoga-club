import { NextRequest, NextResponse } from "next/server";
import { clearMemberCookie } from "../../lib/session";

async function logout(req: NextRequest) {
  await clearMemberCookie();
  return NextResponse.redirect(new URL("/login", req.url));
}

export const GET = logout;
export const POST = logout;
