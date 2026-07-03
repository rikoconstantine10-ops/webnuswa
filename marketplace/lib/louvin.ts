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
