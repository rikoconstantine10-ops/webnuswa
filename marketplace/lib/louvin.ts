// Klien API Louvin.dev — Payment Gateway (QRIS + Virtual Account).
// Docs: https://louvin.dev/docs

export const PAYMENT_TYPES = [
  { id: "qris", label: "QRIS" },
  { id: "bni_va", label: "BNI Virtual Account" },
  { id: "bri_va", label: "BRI Virtual Account" },
  { id: "mandiri_va", label: "Mandiri Virtual Account" },
  { id: "permata_va", label: "Permata Virtual Account" },
  { id: "cimb_va", label: "CIMB Niaga Virtual Account" },
] as const;

// Fee VA dari gateway besar (± Rp6.500/transaksi), jadi VA hanya
// ditawarkan untuk order yang cukup besar. Di bawah ini: QRIS saja.
export const MIN_VA_AMOUNT = 50000;

export function isPaymentTypeAllowed(paymentType: string, amount: number): boolean {
  if (paymentType.endsWith("_va")) return amount >= MIN_VA_AMOUNT;
  return true;
}

export type LouvinTransaction = {
  success: boolean;
  error?: string;
  details?: string;
  [key: string]: unknown;
};

export async function createLouvinTransaction(input: {
  amount: number;
  payment_type: string;
  customer_name: string;
  customer_email?: string;
  description?: string;
}): Promise<LouvinTransaction> {
  const apiKey = process.env.LOUVIN_API_KEY;
  const baseUrl = process.env.LOUVIN_API_URL || "https://api.louvin.dev";

  if (!apiKey) {
    // Mode dev tanpa API key: simulasi transaksi agar alur bisa diuji lokal.
    return {
      success: true,
      simulated: true,
      transaction_id: `SIM-${Date.now()}`,
      payment: {
        type: input.payment_type,
        va_number: input.payment_type.endsWith("_va") ? "8888800012345678" : undefined,
        qris_string: input.payment_type === "qris" ? "00020101021226..." : undefined,
      },
    };
  }

  const res = await fetch(`${baseUrl}/create-transaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(input),
  });

  return (await res.json()) as LouvinTransaction;
}

// Saldo akun Louvin (untuk rekonsiliasi admin). Mengembalikan null jika
// endpoint tidak tersedia / key tidak berlaku untuk akun-level API.
export async function getLouvinBalance(): Promise<number | null> {
  const apiKey = process.env.LOUVIN_API_KEY;
  if (!apiKey) return null;
  const baseUrl = process.env.LOUVIN_API_URL || "https://api.louvin.dev";
  try {
    const res = await fetch(`${baseUrl}/api-balance`, {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    const data = (json.data ?? json) as Record<string, unknown>;
    const balance = data.balance ?? data.available_balance ?? json.balance;
    return typeof balance === "number" ? balance : null;
  } catch {
    return null;
  }
}

// Ekstrak ID transaksi dari respons Louvin.
// Respons asli: { success, transaction: { id, reference, ... }, payment: { order_id, ... } }
export function extractTrxId(trx: Record<string, unknown>): string | null {
  const transaction = (trx.transaction ?? {}) as Record<string, unknown>;
  const payment = (trx.payment ?? {}) as Record<string, unknown>;
  const data = (trx.data ?? {}) as Record<string, unknown>;
  const candidate =
    transaction.id ??
    trx.transaction_id ??
    trx.id ??
    data.transaction_id ??
    data.id ??
    payment.transaction_id ??
    payment.id;
  return candidate ? String(candidate) : null;
}
