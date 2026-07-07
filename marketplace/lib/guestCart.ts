import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const GUEST_COOKIE = "nm_guest";

// Baca guestId dari cookie tanpa menulis apa pun — aman dipanggil saat render (Server Component).
export async function getGuestId(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE)?.value ?? null;
}

// Ambil guestId, buat & simpan cookie baru bila belum ada. Hanya boleh dipanggil dari
// Server Action / Route Handler (butuh menulis cookie).
export async function getOrCreateGuestId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;

  const id = randomBytes(16).toString("hex");
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 180 * 24 * 60 * 60,
    path: "/",
  });
  return id;
}
