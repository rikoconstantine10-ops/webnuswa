import { createHash } from "crypto";

// Klien API Bayarin (payment gateway aggregator Indonesia — QRIS, e-wallet, VA bank, retail).
// Docs: dashboard Bayarin → Dokumentasi API. Auth: api_id + api_key + signature MD5 per endpoint.

const BASE_URL = process.env.BAYARIN_BASE_URL || "https://bayarin.cekstore.com/api";

export function isBayarinConfigured(): boolean {
  return Boolean(process.env.BAYARIN_API_ID && process.env.BAYARIN_API_KEY);
}

function credentials(): { apiId: string; apiKey: string } | null {
  const apiId = process.env.BAYARIN_API_ID;
  const apiKey = process.env.BAYARIN_API_KEY;
  if (!apiId || !apiKey) return null;
  return { apiId, apiKey };
}

function md5(v: string): string {
  return createHash("md5").update(v).digest("hex");
}

// Kode metode pembayaran Bayarin (bank_code) → label tampil.
export const BAYARIN_BANK_CODES = {
  SP: "QRIS",
  NQ: "QRIS (alt.)",
  DA: "DANA",
  OV: "OVO",
  LA: "LinkAja",
  SA: "ShopeePay",
  SHOPEEPAY: "ShopeePay (alt.)",
  GOPAY: "GoPay",
  VIRGO: "Virgo",
  BR: "BRI Virtual Account",
  BCAVA: "BCA Virtual Account",
  I1: "BNI Virtual Account",
  M2: "Mandiri Virtual Account",
  BT: "Permata Virtual Account",
  VA: "Maybank Virtual Account",
  DM: "Danamon Virtual Account",
  B1: "CIMB Niaga Virtual Account",
  NC: "NeoBank Virtual Account",
  A1: "ATM Bersama Virtual Account",
  BV: "BSI Virtual Account",
  FT: "Pegadaian / Alfamart / Kantor Pos",
  INDOMARET: "Indomaret",
} as const;

export type BayarinBankCode = keyof typeof BAYARIN_BANK_CODES;

type BayarinResponse<T> = { status: boolean; msg?: string; data?: T };

export async function getBayarinMerchantInfo(): Promise<BayarinResponse<{ username: string; balance: string }> | null> {
  const creds = credentials();
  if (!creds) return null;
  const signature = md5(creds.apiId + creds.apiKey);
  const res = await fetch(`${BASE_URL}/merchant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_id: creds.apiId, api_key: creds.apiKey, signature }),
  });
  return res.json();
}

export type CreateBayarinPaymentResult =
  | { ok: true; transactionId?: string; paymentUrl?: string; qrString?: string; raw: Record<string, unknown> }
  | { ok: false; error: string };

// referenceId sebaiknya = kode order kita (Order.code) supaya webhook bisa langsung dicocokkan.
export async function createBayarinPayment(input: {
  referenceId: string;
  bankCode: BayarinBankCode | string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  itemDetails?: string;
}): Promise<CreateBayarinPaymentResult> {
  const creds = credentials();
  if (!creds) return { ok: false, error: "BAYARIN_API_ID/BAYARIN_API_KEY belum diset" };
  const signature = md5(creds.apiId + creds.apiKey + input.referenceId);

  try {
    const res = await fetch(`${BASE_URL}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_id: creds.apiId,
        api_key: creds.apiKey,
        signature,
        reference_id: input.referenceId,
        bank_code: input.bankCode,
        amount: String(input.amount),
        customer_name: input.customerName,
        customer_email: input.customerEmail || "",
        customer_phone: input.customerPhone || "",
        payment_guide: "true",
        item_details: input.itemDetails || "",
      }),
    });
    const raw = (await res.json()) as Record<string, unknown>;
    if (!res.ok || raw.status === false) {
      return { ok: false, error: String(raw.msg ?? `HTTP ${res.status}`) };
    }
    const data = (raw.data ?? {}) as Record<string, unknown>;
    return {
      ok: true,
      transactionId: data.transaction_id ? String(data.transaction_id) : undefined,
      paymentUrl: data.payment_url || data.checkout_url ? String(data.payment_url ?? data.checkout_url) : undefined,
      qrString: data.qr_string || data.qris_string ? String(data.qr_string ?? data.qris_string) : undefined,
      raw,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

export type BayarinStatus = "paid" | "pending" | "expired" | "failed" | string;

export async function checkBayarinStatus(referenceId: string): Promise<{ ok: boolean; status?: BayarinStatus; error?: string }> {
  const creds = credentials();
  if (!creds) return { ok: false, error: "BAYARIN_API_ID/BAYARIN_API_KEY belum diset" };
  const signature = md5(creds.apiId + creds.apiKey + referenceId);

  try {
    const res = await fetch(`${BASE_URL}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_id: creds.apiId, api_key: creds.apiKey, signature, reference_id: referenceId }),
    });
    const raw = (await res.json()) as Record<string, unknown>;
    if (!res.ok || raw.status === false) return { ok: false, error: String(raw.msg ?? `HTTP ${res.status}`) };
    const data = (raw.data ?? {}) as Record<string, unknown>;
    return { ok: true, status: data.status ? String(data.status) : undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

// Verifikasi signature webhook: md5(api_id + api_key + reference_id) harus cocok.
export function verifyBayarinSignature(referenceId: string, signature: string | null | undefined): boolean {
  const creds = credentials();
  if (!creds || !signature) return false;
  return md5(creds.apiId + creds.apiKey + referenceId) === signature;
}
