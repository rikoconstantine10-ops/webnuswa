// Verifikasi Cloudflare Turnstile untuk alur login/register seller.
// Nonaktif (lolos otomatis) selama TURNSTILE_SECRET_KEY belum diset, sama seperti
// pola provider opsional lain di app ini (lihat disbursementProvider()).

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token: string | null, ip?: string | null): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (!token) return false;

  const body = new URLSearchParams();
  body.set("secret", process.env.TURNSTILE_SECRET_KEY!);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
