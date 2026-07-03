import { db } from "./db";
import { sendMail } from "./mailer";
import { formatRupiah } from "./money";
import { waSend, waSendToSelf } from "./wa";

// Notifikasi email saat order lunas: ke seller (ada pesanan baru) dan pembeli (bukti + link).
// Fire-and-forget — kegagalan kirim email tidak boleh menggagalkan webhook pembayaran.
export function notifyOrderPaid(orderId: string) {
  (async () => {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        store: { include: { owner: { select: { email: true } } } },
        items: true,
      },
    });
    if (!order) return;

    const appUrl = process.env.APP_URL || "";
    const itemLines = order.items
      .map((i) => `- ${i.name}${i.variantName ? ` (${i.variantName})` : ""} x${i.qty} = ${formatRupiah(i.price * i.qty)}`)
      .join("\n");

    const sellerText = `🛍️ Pesanan baru LUNAS!\n\nKode: ${order.code}\nPembeli: ${order.buyerName}${order.buyerPhone ? ` (${order.buyerPhone})` : ""}\n${itemLines}\nTotal: ${formatRupiah(order.total)}\n${order.shippingAddress ? `\nAlamat kirim:\n${order.shippingAddress}\n\nSegera proses & input resi di dashboard.` : "\nProduk digital — terkirim otomatis ke pembeli."}\n\nKelola: ${appUrl}/dashboard/orders`;
    const buyerText = `Terima kasih, ${order.buyerName}! 🙏\n\nPembayaran pesanan *${order.code}* di ${order.store.name} sudah kami terima.\n${itemLines}\nTotal: ${formatRupiah(order.total)}\n\nLihat status pesanan & download produk digital:\n${appUrl}/order/${order.code}`;

    await Promise.allSettled([
      sendMail(order.store.owner.email, `[${order.store.name}] Pesanan baru LUNAS — ${order.code}`, sellerText),
      sendMail(order.buyerEmail, `Pembayaran diterima — ${order.code}`, buyerText),
      // WA dari nomor toko (jika seller sudah menghubungkan WA-nya)
      waSendToSelf(order.storeId, sellerText),
      order.buyerPhone ? waSend(order.storeId, order.buyerPhone, buyerText) : Promise.resolve(false),
    ]);
  })().catch((e) => console.error("[NOTIFY] gagal:", e));
}
