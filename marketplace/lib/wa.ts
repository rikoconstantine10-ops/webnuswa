// Klien internal ke nuswa-wa-service (Baileys multi-sesi, satu sesi per toko).
// Seller menghubungkan nomor WA-nya sendiri; semua pengiriman bersifat
// best-effort — kegagalan WA tidak boleh mengganggu alur utama.

const BASE = process.env.WA_SERVICE_URL || "http://127.0.0.1:3006";
const KEY = process.env.WA_SERVICE_KEY || "";

type WaStatus = {
  status: "disconnected" | "qr" | "connecting" | "connected";
  qr?: string;
  phone?: string;
};

async function call(path: string, init?: RequestInit): Promise<Response | null> {
  if (!KEY) return null;
  try {
    return await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", "x-api-key": KEY, ...init?.headers },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return null;
  }
}

export async function waStatus(storeId: string): Promise<WaStatus> {
  const res = await call(`/sessions/${storeId}/status`);
  if (!res?.ok) return { status: "disconnected" };
  return (await res.json()) as WaStatus;
}

export async function waStart(storeId: string): Promise<boolean> {
  const res = await call(`/sessions/${storeId}/start`, { method: "POST" });
  return Boolean(res?.ok);
}

export async function waLogout(storeId: string): Promise<boolean> {
  const res = await call(`/sessions/${storeId}/logout`, { method: "POST" });
  return Boolean(res?.ok);
}

export async function waSend(
  storeId: string,
  to: string,
  message: string,
  imageUrl?: string
): Promise<boolean> {
  const res = await call(`/sessions/${storeId}/send`, {
    method: "POST",
    body: JSON.stringify({ to, message, imageUrl }),
  });
  return Boolean(res?.ok);
}

// Kirim WA dari nomor toko ke nomor toko itu sendiri (notifikasi ke seller).
export async function waSendToSelf(storeId: string, message: string): Promise<boolean> {
  const status = await waStatus(storeId);
  if (status.status !== "connected" || !status.phone) return false;
  return waSend(storeId, status.phone, message);
}
