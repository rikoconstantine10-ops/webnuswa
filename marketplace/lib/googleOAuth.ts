// OAuth 2.0 "Continue with Google" — hand-rolled (bukan NextAuth) supaya konsisten
// dengan pola integrasi lain di app ini (mailer.ts, disbursement.ts, paymento.ts)
// dan tetap memakai session/cookie kustom yang sudah ada (lib/auth.ts).
//
// Aktif hanya bila GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET diset di env.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function googleOAuthEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri(): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return `${appUrl}/api/auth/google/callback`;
}

// URL untuk mengarahkan user ke consent screen Google. `state` dipakai untuk CSRF
// protection (dicocokkan dengan cookie saat callback) dan membawa info alur (seller).
export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
};

// Tukar authorization code → access token → profil user. Lempar error bila gagal.
export async function exchangeGoogleCode(code: string): Promise<GoogleUserInfo> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(),
    }),
  });
  if (!tokenRes.ok) throw new Error(`google token exchange gagal: ${tokenRes.status}`);
  const tokenData = await tokenRes.json();

  const infoRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!infoRes.ok) throw new Error(`google userinfo gagal: ${infoRes.status}`);
  return infoRes.json();
}
