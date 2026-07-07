import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { googleAuthUrl, googleOAuthEnabled } from "@/lib/googleOAuth";

const STATE_COOKIE = "g_oauth_state";

// Mulai alur "Continue with Google" khusus login/register seller.
// GET /api/auth/google
export async function GET(_req: NextRequest) {
  const appUrl = process.env.APP_URL || "https://nuswamart.com";
  if (!googleOAuthEnabled()) {
    return NextResponse.redirect(new URL("/register-seller?error=google_disabled", appUrl));
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
  return res;
}
