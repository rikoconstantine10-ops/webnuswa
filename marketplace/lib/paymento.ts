import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";

// Klien Paymento (crypto payment gateway). Dokumentasi: docs.paymento.io
// Alur: create request → dapat token → redirect user ke gateway → IPN callback (HMAC) → verify → lunas.

const API_BASE = process.env.PAYMENTO_BASE_URL || "https://api.paymento.io/v1";
const GATEWAY_URL = process.env.PAYMENTO_GATEWAY_URL || "https://app.paymento.io/gateway";

// Status order Paymento. 7=Paid (terkonfirmasi on-chain), 8=Approve (disetujui merchant).
export const PAYMENTO_STATUS = {
  Initialize: 0,
  Pending: 1,
  PartialPaid: 2,
  WaitingToConfirm: 3,
  Timeout: 4,
  UserCanceled: 5,
  Paid: 7,
  Approve: 8,
  Reject: 9,
} as const;

export const PAYMENTO_PAID_STATUSES = [PAYMENTO_STATUS.Paid, PAYMENTO_STATUS.Approve];

export function isPaymentoConfigured(): boolean {
  return Boolean(process.env.PAYMENTO_API_KEY && process.env.PAYMENTO_SECRET_KEY);
}

async function settingNumber(key: string, fallback: number): Promise<number> {
  const s = await db.setting.findUnique({ where: { key } });
  const v = s ? parseFloat(s.value) : NaN;
  return Number.isFinite(v) ? v : fallback;
}

async function settingString(key: string, fallback: string): Promise<string> {
  const s = await db.setting.findUnique({ where: { key } });
  return s?.value?.trim() || fallback;
}

// Konversi total order (IDR) ke mata uang fiat Paymento (default USD) memakai kurs yang bisa diatur admin.
// Setting: crypto_fiat_currency (default USD), crypto_fiat_rate (IDR per 1 unit fiat, default 16300).
export async function idrToFiat(amountIdr: number): Promise<{ amount: number; currency: string; rate: number }> {
  const currency = (await settingString("crypto_fiat_currency", "USD")).toUpperCase();
  const rate = await settingNumber("crypto_fiat_rate", 16300);
  const amount = Math.max(0.01, Math.round((amountIdr / rate) * 100) / 100);
  return { amount, currency, rate };
}

type CreateResult = { ok: boolean; token?: string; gatewayUrl?: string; fiatAmount?: number; fiatCurrency?: string; error?: string };

// Ekstrak token dari berbagai kemungkinan bentuk respons (Paymento tak konsisten kapitalisasinya).
function extractToken(data: unknown): string | null {
  if (typeof data === "string" && data.length > 0) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const k of ["token", "Token", "body", "Body", "data", "Data", "result", "Result"]) {
      const v = o[k];
      if (typeof v === "string" && v.length > 0) return v;
      if (v && typeof v === "object") {
        const inner = extractToken(v);
        if (inner) return inner;
      }
    }
  }
  return null;
}

export async function createPaymentRequest(input: {
  orderId: string; // kode order kita
  amountIdr: number;
  returnUrl: string;
  email?: string;
}): Promise<CreateResult> {
  const apiKey = process.env.PAYMENTO_API_KEY;
  if (!apiKey) return { ok: false, error: "PAYMENTO_API_KEY belum diset" };
  const { amount, currency } = await idrToFiat(input.amountIdr);

  try {
    const res = await fetch(`${API_BASE}/payment/request`, {
      method: "POST",
      headers: { "Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        fiatAmount: amount,
        fiatCurrency: currency,
        returnUrl: input.returnUrl,
        orderId: input.orderId,
        speed: 1, // Low: tunggu konfirmasi blok (lebih aman dari mempool)
        ...(input.email ? { emailAddress: input.email } : {}),
      }),
    });
    const raw = await res.text();
    let data: unknown = raw;
    try { data = JSON.parse(raw); } catch { /* biarkan string */ }
    if (!res.ok) {
      return { ok: false, error: `Paymento HTTP ${res.status}: ${raw.slice(0, 200)}` };
    }
    const token = extractToken(data);
    if (!token) return { ok: false, error: `Token tidak ditemukan di respons Paymento: ${raw.slice(0, 200)}` };
    return { ok: true, token, gatewayUrl: `${GATEWAY_URL}?token=${encodeURIComponent(token)}`, fiatAmount: amount, fiatCurrency: currency };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

type VerifyResult = { ok: boolean; orderId?: string; orderStatus?: number; paid?: boolean; error?: string };

export async function verifyPayment(token: string): Promise<VerifyResult> {
  const apiKey = process.env.PAYMENTO_API_KEY;
  if (!apiKey) return { ok: false, error: "PAYMENTO_API_KEY belum diset" };
  try {
    const res = await fetch(`${API_BASE}/payment/verify`, {
      method: "POST",
      headers: { "Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(raw); } catch { /* noop */ }
    if (!res.ok) return { ok: false, error: `Paymento verify HTTP ${res.status}` };
    // Cari orderId & orderStatus di berbagai bentuk (termasuk terbungkus di body/data).
    const flat = { ...data, ...(data.body as object), ...(data.Body as object), ...(data.data as object) } as Record<string, unknown>;
    const orderId = String(flat.orderId ?? flat.OrderId ?? "");
    const statusRaw = flat.orderStatus ?? flat.OrderStatus;
    const orderStatus = typeof statusRaw === "number" ? statusRaw : parseInt(String(statusRaw ?? ""), 10);
    const paid = Number.isFinite(orderStatus) && PAYMENTO_PAID_STATUSES.includes(orderStatus as (typeof PAYMENTO_PAID_STATUSES)[number]);
    return { ok: true, orderId: orderId || undefined, orderStatus: Number.isFinite(orderStatus) ? orderStatus : undefined, paid };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

// Daftarkan URL IPN (callback) ke Paymento via API — karena Paymento tidak punya
// pengaturan webhook di dashboard. Panggil sekali saat setup.
export async function setPaymentoIpnUrl(ipnUrl: string, method: "POST" | "GET" = "POST"): Promise<{ ok: boolean; response?: string; error?: string }> {
  const apiKey = process.env.PAYMENTO_API_KEY;
  if (!apiKey) return { ok: false, error: "PAYMENTO_API_KEY belum diset" };
  try {
    const res = await fetch(`${API_BASE}/payment/settings`, {
      method: "POST",
      headers: { "Api-Key": apiKey, "Content-Type": "application/json" },
      // Skema pasti tak terdokumentasi — kirim beberapa kemungkinan nama field sekaligus.
      body: JSON.stringify({
        ipnUrl, IpnUrl: ipnUrl, callbackUrl: ipnUrl,
        ipnMethod: method, IpnHttpMethod: method, httpMethod: method,
      }),
    });
    const text = await res.text();
    return { ok: res.ok, response: text.slice(0, 500), error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

export async function getPaymentoSettings(): Promise<{ ok: boolean; response?: string; error?: string }> {
  const apiKey = process.env.PAYMENTO_API_KEY;
  if (!apiKey) return { ok: false, error: "PAYMENTO_API_KEY belum diset" };
  try {
    const res = await fetch(`${API_BASE}/payment/settings`, { method: "GET", headers: { "Api-Key": apiKey } });
    const text = await res.text();
    return { ok: res.ok, response: text.slice(0, 500), error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

// Verifikasi tanda tangan IPN: HMAC-SHA256(rawBody, secret) → uppercase hex, bandingkan dgn header.
export function verifyCallbackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYMENTO_SECRET_KEY;
  if (!secret || !signature) return false;
  const computed = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex").toUpperCase();
  const a = Buffer.from(computed);
  const b = Buffer.from(signature.trim().toUpperCase());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
