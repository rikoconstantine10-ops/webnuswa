import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exchangeGoogleCode, googleOAuthEnabled } from "@/lib/googleOAuth";
import { createSessionForUser } from "@/lib/auth";
import { logError } from "@/lib/errors";

const STATE_COOKIE = "g_oauth_state";

// GET /api/auth/google/callback?code=...&state=...
export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL || "https://nuswamart.com";
  const failUrl = new URL("/register-seller?error=google_failed", appUrl);
  if (!googleOAuthEnabled()) return NextResponse.redirect(failUrl);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(failUrl);
  }

  try {
    const profile = await exchangeGoogleCode(code);
    if (!profile.email || !profile.email_verified) return NextResponse.redirect(failUrl);

    const email = profile.email.toLowerCase();
    const isAdmin =
      process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase();

    let user = await db.user.findUnique({ where: { googleId: profile.sub }, include: { store: true } });
    if (!user) {
      user = await db.user.upsert({
        where: { email },
        create: { email, name: profile.name, googleId: profile.sub, role: isAdmin ? "ADMIN" : "BUYER" },
        update: { googleId: profile.sub, ...(isAdmin ? { role: "ADMIN" } : {}) },
        include: { store: true },
      });
    }

    await createSessionForUser(user.id);

    const dest = user.store ? "/dashboard" : "/register-seller";
    const res = NextResponse.redirect(new URL(dest, appUrl));
    res.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    logError("google_oauth.callback", e);
    return NextResponse.redirect(failUrl);
  }
}
