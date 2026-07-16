import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { googleAuthUrl, googleOAuthEnabled } from "@/lib/googleOAuth";

const STATE_COOKIE = "g_oauth_state";
const NEXT_COOKIE = "g_oauth_next";

// Mulai alur "Continue with Google" (login universal & buka toko).
// GET /api/auth/google?next=/path
export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL || "https://nuswamart.com";
  if (!googleOAuthEnabled()) {
    return NextResponse.redirect(new URL("/login?error=google_disabled", appUrl));
  }

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(googleAuthUrl(state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  const next = req.nextUrl.searchParams.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    res.cookies.set(NEXT_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/",
    });
  }
  return res;
}
