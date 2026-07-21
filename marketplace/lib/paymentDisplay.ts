// Parsing tampilan pembayaran dari kolom paymentInfo (JSON stringified) — dipakai halaman
// order pembeli & halaman pembelian kredit AI seller. Dua bentuk didukung:
// - Bayarin: dibangun sendiri saat create (provider:"bayarin", bentuk sudah kita kontrol penuh)
// - Louvin (legacy, masih dipakai topup kredit AI): passthrough respons asli mereka
export type PaymentDisplay = {
  vaNumber: string | null;
  bank: string | null;
  qrImageUrl: string | null;
  qrString: string | null;
  redirectUrl: string | null; // link checkout e-wallet (DANA/OVO/dll) yang perlu diklik buyer
  payCode: string | null; // kode bayar retail (Indomaret/Alfamart/Pegadaian)
  guide: string | null; // panduan langkah pembayaran (teks biasa, sudah dibersihkan dari HTML)
  expiredAt: string | null;
  totalPayment: number | null;
  simulated: boolean;
};

// QR API publik untuk merender string QRIS mentah jadi gambar scannable — tanpa perlu
// dependency baru (proyek ini sengaja minim dependency, lihat package.json).
function qrisImageUrl(qrString: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrString)}`;
}

export function extractPaymentDisplay(paymentInfo: string | null): PaymentDisplay | null {
  if (!paymentInfo) return null;
  try {
    const trx = JSON.parse(paymentInfo);

    if (trx.provider === "bayarin") {
      const category = trx.category as string;
      const code: string | undefined = trx.paymentCode;
      return {
        vaNumber: category === "va" && code ? code : null,
        bank: null,
        qrImageUrl: category === "qris" && code ? qrisImageUrl(code) : null,
        qrString: category === "qris" && code ? code : null,
        redirectUrl: category === "ewallet" && code ? code : null,
        payCode: category === "retail" && code ? code : null,
        guide: trx.paymentGuide ?? null,
        expiredAt: null,
        totalPayment: typeof trx.totalPayment === "number" ? trx.totalPayment : null,
        simulated: false,
      };
    }

    // Legacy Louvin passthrough (dipakai topup kredit AI — lihat lib/louvin.ts).
    const p = trx.payment ?? trx.data ?? trx;
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
      redirectUrl: null,
      payCode: null,
      guide: null,
      expiredAt: p.expired_at ?? null,
      totalPayment: typeof p.total_payment === "number" ? p.total_payment : null,
      simulated: Boolean(trx.simulated),
    };
  } catch {
    return null;
  }
}
