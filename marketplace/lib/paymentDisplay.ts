// Parsing tampilan pembayaran Louvin (QRIS/VA) dari kolom paymentInfo (JSON stringified
// respons Louvin) — dipakai halaman order pembeli & halaman pembelian kredit AI seller.
export type PaymentDisplay = {
  vaNumber: string | null;
  bank: string | null;
  qrImageUrl: string | null;
  qrString: string | null;
  expiredAt: string | null;
  totalPayment: number | null;
  simulated: boolean;
};

export function extractPaymentDisplay(paymentInfo: string | null): PaymentDisplay | null {
  if (!paymentInfo) return null;
  try {
    const trx = JSON.parse(paymentInfo);
    const p = trx.payment ?? trx.data ?? trx;
    // URL gambar QR dari acquirer (mis. Midtrans "generate-qr-code" action)
    const actions: { name?: string; url?: string }[] = p.raw_response?.actions ?? [];
    const qrImageUrl =
      p.qris_url ??
      p.qris_image ??
      actions.find((a) => a.name?.startsWith("generate-qr-code"))?.url ??
      null;
    return {
      vaNumber: p.va_number ?? p.vaNumber ?? null,
      bank: p.bank ?? null,
      qrImageUrl,
      qrString: p.qr_string ?? p.qris_string ?? null,
      expiredAt: p.expired_at ?? null,
      totalPayment: typeof p.total_payment === "number" ? p.total_payment : null,
      simulated: Boolean(trx.simulated),
    };
  } catch {
    return null;
  }
}
