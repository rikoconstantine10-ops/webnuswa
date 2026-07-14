// Template email transaksional NuswaMart — HTML sederhana (inline style, aman untuk klien email)
// + versi teks polos sebagai fallback. Satu wrapper visual dipakai semua jenis email.

const BRAND_TEAL = "#0d9488";
const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG = "#f8fafc";

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="border-radius:10px;background:${BRAND_TEAL}">
    <a href="${url}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px">${label}</a>
  </td></tr></table>`;
}

function wrapEmail(opts: { title: string; bodyHtml: string; footerNote?: string }): string {
  const appUrl = process.env.APP_URL || "https://nuswamart.com";
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid ${BORDER};overflow:hidden">
        <tr><td style="padding:24px 28px;border-bottom:1px solid ${BORDER}">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:8px"><img src="${appUrl}/nuswamart-icon.png" alt="" width="22" height="auto" style="display:block"/></td>
            <td style="vertical-align:middle"><span style="font-size:18px;font-weight:800;color:${BRAND_TEAL}">Nuswa<span style="color:${TEXT_DARK}">Mart</span></span></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:${TEXT_DARK}">${opts.title}</h1>
          <div style="font-size:14px;line-height:1.6;color:${TEXT_DARK}">${opts.bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:20px 28px;background:${BG};border-top:1px solid ${BORDER}">
          <p style="margin:0 0 6px;font-size:12px;color:${TEXT_MUTED}">${opts.footerNote || "Email ini dikirim otomatis oleh sistem NuswaMart."}</p>
          <p style="margin:0;font-size:12px;color:${TEXT_MUTED}">
            <a href="${appUrl}/bantuan" style="color:${TEXT_MUTED}">Pusat Bantuan</a> ·
            <a href="${appUrl}/privacy" style="color:${TEXT_MUTED}">Kebijakan Privasi</a> ·
            <a href="${appUrl}" style="color:${TEXT_MUTED}">NuswaMart</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

type EmailPayload = { subject: string; html: string; text: string };

export function otpEmail(code: string, minutes: number): EmailPayload {
  const subject = "Kode Login NuswaMart Anda";
  const text = `Kode OTP Anda: ${code}\nBerlaku ${minutes} menit. Jangan bagikan kode ini kepada siapa pun.`;
  const html = wrapEmail({
    title: "Kode Login Anda",
    bodyHtml: `
      <p>Gunakan kode berikut untuk masuk ke akun NuswaMart:</p>
      <div style="margin:20px 0;padding:16px;text-align:center;background:${BG};border:1px dashed ${BORDER};border-radius:12px;font-size:32px;font-weight:800;letter-spacing:8px;color:${TEXT_DARK}">${code}</div>
      <p>Kode berlaku selama <b>${minutes} menit</b>. Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari NuswaMart.</p>
    `,
  });
  return { subject, html, text };
}

export function orderPaidBuyerEmail(input: {
  code: string; storeName: string; itemLines: string[]; totalText: string; appUrl: string;
}): EmailPayload {
  const subject = `Pembayaran diterima — ${input.code}`;
  const text = `Terima kasih!\n\nPembayaran pesanan ${input.code} di ${input.storeName} sudah kami terima.\n${input.itemLines.join("\n")}\nTotal: ${input.totalText}\n\nLihat status pesanan & download produk digital:\n${input.appUrl}/order/${input.code}`;
  const html = wrapEmail({
    title: "Pembayaran Diterima 🎉",
    bodyHtml: `
      <p>Terima kasih! Pembayaran pesanan <b>${input.code}</b> di <b>${input.storeName}</b> sudah kami terima.</p>
      <ul style="padding-left:18px;margin:12px 0">${input.itemLines.map((l) => `<li>${l}</li>`).join("")}</ul>
      <p><b>Total: ${input.totalText}</b></p>
      ${ctaButton("Lihat Pesanan", `${input.appUrl}/order/${input.code}`)}
    `,
  });
  return { subject, html, text };
}

export function orderPaidSellerEmail(input: {
  code: string; buyerName: string; buyerPhone?: string | null; itemLines: string[]; totalText: string;
  shippingAddress?: string | null; isDigital: boolean; appUrl: string;
}): EmailPayload {
  const subject = `Pesanan baru LUNAS — ${input.code}`;
  const text = `Pesanan baru LUNAS!\n\nKode: ${input.code}\nPembeli: ${input.buyerName}${input.buyerPhone ? ` (${input.buyerPhone})` : ""}\n${input.itemLines.join("\n")}\nTotal: ${input.totalText}\n${input.shippingAddress ? `\nAlamat kirim:\n${input.shippingAddress}\n\nSegera proses & input resi di dashboard.` : "\nProduk digital — terkirim otomatis ke pembeli."}\n\nKelola: ${input.appUrl}/dashboard/orders`;
  const html = wrapEmail({
    title: "🛍️ Pesanan Baru LUNAS",
    bodyHtml: `
      <p>Pembeli: <b>${input.buyerName}</b>${input.buyerPhone ? ` (${input.buyerPhone})` : ""}</p>
      <ul style="padding-left:18px;margin:12px 0">${input.itemLines.map((l) => `<li>${l}</li>`).join("")}</ul>
      <p><b>Total: ${input.totalText}</b></p>
      ${input.shippingAddress
        ? `<p>Alamat kirim:<br/>${input.shippingAddress}</p><p>Segera proses &amp; input resi di dashboard.</p>`
        : `<p>Produk digital — terkirim otomatis ke pembeli.</p>`}
      ${ctaButton("Kelola Pesanan", `${input.appUrl}/dashboard/orders`)}
    `,
  });
  return { subject, html, text };
}

// Beda dari orderPaidSellerEmail: order COD belum lunas (dibayar tunai saat barang sampai),
// jadi wordingnya tidak boleh bilang "LUNAS" — supaya seller tak salah kira dana sudah cair.
export function orderNewCodEmail(input: {
  code: string; buyerName: string; buyerPhone?: string | null; itemLines: string[]; totalText: string;
  shippingAddress?: string | null; appUrl: string;
}): EmailPayload {
  const subject = `Pesanan baru (COD) — ${input.code}`;
  const text = `Pesanan baru masuk (bayar di tempat)!\n\nKode: ${input.code}\nPembeli: ${input.buyerName}${input.buyerPhone ? ` (${input.buyerPhone})` : ""}\n${input.itemLines.join("\n")}\nTotal (tunai saat barang sampai): ${input.totalText}\n\nAlamat kirim:\n${input.shippingAddress ?? "-"}\n\nSegera proses & input resi di dashboard.\n\nKelola: ${input.appUrl}/dashboard/orders`;
  const html = wrapEmail({
    title: "📦 Pesanan Baru (COD)",
    bodyHtml: `
      <p>Pembeli: <b>${input.buyerName}</b>${input.buyerPhone ? ` (${input.buyerPhone})` : ""}</p>
      <ul style="padding-left:18px;margin:12px 0">${input.itemLines.map((l) => `<li>${l}</li>`).join("")}</ul>
      <p><b>Total (tunai saat barang sampai): ${input.totalText}</b></p>
      <p>Alamat kirim:<br/>${input.shippingAddress ?? "-"}</p>
      <p>Segera proses &amp; input resi di dashboard.</p>
      ${ctaButton("Kelola Pesanan", `${input.appUrl}/dashboard/orders`)}
    `,
  });
  return { subject, html, text };
}

export function orderShippedEmail(input: { code: string; storeName: string; courier?: string | null; tracking?: string | null; appUrl: string }): EmailPayload {
  const subject = `Pesanan dikirim — ${input.code}`;
  const text = `Pesanan ${input.code} di ${input.storeName} sudah dikirim!\n\nKurir: ${input.courier ?? "-"}\nNo. resi: ${input.tracking ?? "-"}\n\nLacak & konfirmasi penerimaan di:\n${input.appUrl}/order/${input.code}`;
  const html = wrapEmail({
    title: "📦 Pesanan Dikirim",
    bodyHtml: `
      <p>Pesanan <b>${input.code}</b> di <b>${input.storeName}</b> sudah dikirim!</p>
      <p>Kurir: <b>${input.courier ?? "-"}</b><br/>No. resi: <b>${input.tracking ?? "-"}</b></p>
      ${ctaButton("Lacak Pesanan", `${input.appUrl}/order/${input.code}`)}
    `,
  });
  return { subject, html, text };
}

export function disputeOpenedEmail(input: { code: string; storeName: string; reason: string; appUrl: string; forAdmin: boolean }): EmailPayload {
  const subject = input.forAdmin ? `[Admin] Komplain ${input.code}` : `Komplain pesanan ${input.code}`;
  const text = `⚠️ Komplain baru untuk pesanan ${input.code} (${input.storeName}).\n\nAlasan: ${input.reason}\n\nTinjau: ${input.appUrl}/admin/disputes`;
  const html = wrapEmail({
    title: "⚠️ Komplain Baru",
    bodyHtml: `
      <p>Ada komplain baru untuk pesanan <b>${input.code}</b> (${input.storeName}).</p>
      <p>Alasan: ${input.reason}</p>
      ${ctaButton("Tinjau Komplain", `${input.appUrl}/admin/disputes`)}
    `,
  });
  return { subject, html, text };
}

export function disputeResolvedEmail(input: { code: string; refunded: boolean; totalText: string; appUrl: string }): EmailPayload {
  const subject = `Hasil komplain — ${input.code}`;
  const text = input.refunded
    ? `Komplain pesanan ${input.code} telah diputus: DANA DIKEMBALIKAN.\n\nTim kami akan memproses pengembalian dana ${input.totalText} ke kamu. Detail: ${input.appUrl}/order/${input.code}`
    : `Komplain pesanan ${input.code} telah diputus: pesanan diselesaikan & dana diteruskan ke penjual.\n\nDetail: ${input.appUrl}/order/${input.code}`;
  const html = wrapEmail({
    title: "Hasil Komplain",
    bodyHtml: input.refunded
      ? `<p>Komplain pesanan <b>${input.code}</b> telah diputus: <b>dana dikembalikan</b>.</p><p>Tim kami akan memproses pengembalian dana <b>${input.totalText}</b> ke kamu.</p>${ctaButton("Lihat Detail", `${input.appUrl}/order/${input.code}`)}`
      : `<p>Komplain pesanan <b>${input.code}</b> telah diputus: pesanan diselesaikan &amp; dana diteruskan ke penjual.</p>${ctaButton("Lihat Detail", `${input.appUrl}/order/${input.code}`)}`,
  });
  return { subject, html, text };
}

export function cartRecoveryEmail(input: { name: string; lines: string[]; appUrl: string }): EmailPayload {
  const subject = "Keranjangmu menunggu di NuswaMart 🛒";
  const text = `Halo ${input.name},\n\nKamu masih punya produk di keranjang:\n\n${input.lines.join("\n")}\n\nSelesaikan belanjamu sebelum kehabisan:\n${input.appUrl}/cart\n\nSampai jumpa!\nNuswaMart`;
  const html = wrapEmail({
    title: "Keranjangmu Menunggu 🛒",
    bodyHtml: `
      <p>Halo ${input.name}, kamu masih punya produk di keranjang:</p>
      <ul style="padding-left:18px;margin:12px 0">${input.lines.map((l) => `<li>${l}</li>`).join("")}</ul>
      <p>Selesaikan belanjamu sebelum kehabisan stok!</p>
      ${ctaButton("Buka Keranjang", `${input.appUrl}/cart`)}
    `,
  });
  return { subject, html, text };
}

export function withdrawalPaidEmail(input: { amountText: string; bankName: string; bankAccountNumber: string; appUrl: string }): EmailPayload {
  const subject = `Penarikan dana berhasil — ${input.amountText}`;
  const text = `Penarikan dana kamu sebesar ${input.amountText} telah ditransfer ke ${input.bankName} ${input.bankAccountNumber}.\n\nCek riwayat: ${input.appUrl}/dashboard/withdrawals`;
  const html = wrapEmail({
    title: "💸 Penarikan Dana Berhasil",
    bodyHtml: `
      <p>Penarikan dana kamu sebesar <b>${input.amountText}</b> telah ditransfer ke:</p>
      <p><b>${input.bankName}</b> — ${input.bankAccountNumber}</p>
      ${ctaButton("Lihat Riwayat", `${input.appUrl}/dashboard/withdrawals`)}
    `,
  });
  return { subject, html, text };
}

export function newSellerAlertEmail(input: { storeName: string; storeSlug: string; ownerEmail: string; appUrl: string }): EmailPayload {
  const subject = `[Admin] Toko baru dibuka — ${input.storeName}`;
  const text = `Toko baru dibuka di NuswaMart.\n\nNama: ${input.storeName}\nSlug: ${input.storeSlug}\nEmail pemilik: ${input.ownerEmail}\n\nDetail: ${input.appUrl}/admin/sellers`;
  const html = wrapEmail({
    title: "🏪 Toko Baru Dibuka",
    bodyHtml: `
      <p>Toko baru dibuka di NuswaMart:</p>
      <p><b>${input.storeName}</b> (${input.storeSlug})<br/>Email pemilik: ${input.ownerEmail}</p>
      ${ctaButton("Lihat Daftar Seller", `${input.appUrl}/admin/sellers`)}
    `,
  });
  return { subject, html, text };
}
