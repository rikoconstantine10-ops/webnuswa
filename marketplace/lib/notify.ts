import { db } from "./db";
import { sendMail, MAILBOX } from "./mailer";
import { formatRupiah } from "./money";
import { waSend, waSendToSelf } from "./wa";
import {
  orderPaidBuyerEmail,
  orderPaidSellerEmail,
  orderNewCodEmail,
  orderShippedEmail,
  disputeOpenedEmail,
  disputeResolvedEmail,
  withdrawalPaidEmail,
  newSellerAlertEmail,
} from "./emailTemplates";

// Alamat penerima alert internal (admin@nuswamart.com + ADMIN_EMAIL personal bila diset & beda).
function adminRecipients(): string[] {
  const set = new Set<string>([MAILBOX.admin]);
  if (process.env.ADMIN_EMAIL) set.add(process.env.ADMIN_EMAIL);
  return [...set];
}

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

    const appUrl = process.env.APP_URL || "https://nuswamart.com";
    const itemLines = order.items.map(
      (i) => `${i.name}${i.variantName ? ` (${i.variantName})` : ""} x${i.qty} = ${formatRupiah(i.price * i.qty)}`
    );
    const isDigital = !order.shippingAddress;

    const sellerMail = orderPaidSellerEmail({
      code: order.code,
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      itemLines,
      totalText: formatRupiah(order.total),
      shippingAddress: order.shippingAddress,
      isDigital,
      appUrl,
    });
    const buyerMail = orderPaidBuyerEmail({
      code: order.code,
      storeName: order.store.name,
      itemLines,
      totalText: formatRupiah(order.total),
      appUrl,
    });

    await Promise.allSettled([
      sendMail(order.store.owner.email, sellerMail.subject, sellerMail.text, { html: sellerMail.html, replyTo: MAILBOX.seller }),
      sendMail(order.buyerEmail, buyerMail.subject, buyerMail.text, { html: buyerMail.html, replyTo: MAILBOX.support }),
      // WA dari nomor toko (jika seller sudah menghubungkan WA-nya)
      waSendToSelf(order.storeId, sellerMail.text),
      order.buyerPhone ? waSend(order.storeId, order.buyerPhone, buyerMail.text) : Promise.resolve(false),
    ]);
  })().catch((e) => console.error("[NOTIFY] gagal:", e));
}

// Notifikasi ke seller saat ada order COD baru (belum lunas — dibayar tunai saat barang
// sampai). Order COD dibuat langsung dengan status PROCESSING, tak lewat markOrderPaid,
// jadi butuh notifikasi terpisah supaya seller tetap tahu ada pesanan masuk.
export function notifyNewCodOrder(orderId: string) {
  (async () => {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { store: { include: { owner: { select: { email: true } } } }, items: true },
    });
    if (!order) return;

    const appUrl = process.env.APP_URL || "https://nuswamart.com";
    const itemLines = order.items.map(
      (i) => `${i.name}${i.variantName ? ` (${i.variantName})` : ""} x${i.qty} = ${formatRupiah(i.price * i.qty)}`
    );
    const mail = orderNewCodEmail({
      code: order.code,
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      itemLines,
      totalText: formatRupiah(order.total),
      shippingAddress: order.shippingAddress,
      appUrl,
    });

    await Promise.allSettled([
      sendMail(order.store.owner.email, mail.subject, mail.text, { html: mail.html, replyTo: MAILBOX.seller }),
      waSendToSelf(order.storeId, mail.text),
    ]);
  })().catch((e) => console.error("[NOTIFY cod] gagal:", e));
}

// Email pembeli saat pesanan dikirim (resi tersedia).
export function notifyOrderShipped(orderId: string) {
  (async () => {
    const order = await db.order.findUnique({ where: { id: orderId }, include: { store: { select: { name: true } } } });
    if (!order) return;
    const appUrl = process.env.APP_URL || "https://nuswamart.com";
    const mail = orderShippedEmail({ code: order.code, storeName: order.store.name, courier: order.courier, tracking: order.trackingNumber, appUrl });
    await Promise.allSettled([sendMail(order.buyerEmail, mail.subject, mail.text, { html: mail.html, replyTo: MAILBOX.support })]);
  })().catch((e) => console.error("[NOTIFY shipped] gagal:", e));
}

// Email saat sengketa dibuka (ke penjual + admin).
export function notifyDisputeOpened(orderId: string) {
  (async () => {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { store: { include: { owner: { select: { email: true } } } }, dispute: true },
    });
    if (!order || !order.dispute) return;
    const appUrl = process.env.APP_URL || "https://nuswamart.com";
    const sellerMail = disputeOpenedEmail({ code: order.code, storeName: order.store.name, reason: order.dispute.reason, appUrl, forAdmin: false });
    const adminMail = disputeOpenedEmail({ code: order.code, storeName: order.store.name, reason: order.dispute.reason, appUrl, forAdmin: true });
    await Promise.allSettled([
      sendMail(order.store.owner.email, sellerMail.subject, sellerMail.text, { html: sellerMail.html, replyTo: MAILBOX.support }),
      ...adminRecipients().map((to) => sendMail(to, adminMail.subject, adminMail.text, { html: adminMail.html, replyTo: MAILBOX.support })),
      waSendToSelf(order.storeId, sellerMail.text),
    ]);
  })().catch((e) => console.error("[NOTIFY dispute] gagal:", e));
}

// Email pembeli saat sengketa diputus.
export function notifyDisputeResolved(orderId: string, refunded: boolean) {
  (async () => {
    const order = await db.order.findUnique({ where: { id: orderId }, include: { store: { select: { name: true } } } });
    if (!order) return;
    const appUrl = process.env.APP_URL || "https://nuswamart.com";
    const mail = disputeResolvedEmail({ code: order.code, refunded, totalText: formatRupiah(order.total), appUrl });
    await Promise.allSettled([
      sendMail(order.buyerEmail, mail.subject, mail.text, { html: mail.html, replyTo: MAILBOX.support }),
      order.buyerPhone ? waSend(order.storeId, order.buyerPhone, mail.text) : Promise.resolve(false),
    ]);
  })().catch((e) => console.error("[NOTIFY dispute resolved] gagal:", e));
}

// Email penjual saat penarikan dana selesai ditransfer admin.
export function notifyWithdrawalPaid(withdrawalId: string) {
  (async () => {
    const w = await db.withdrawal.findUnique({ where: { id: withdrawalId }, include: { store: { include: { owner: { select: { email: true } } } } } });
    if (!w) return;
    const appUrl = process.env.APP_URL || "https://nuswamart.com";
    const mail = withdrawalPaidEmail({ amountText: formatRupiah(w.amount), bankName: w.bankName, bankAccountNumber: w.bankAccountNumber, appUrl });
    await sendMail(w.store.owner.email, mail.subject, mail.text, { html: mail.html, replyTo: MAILBOX.billing });
  })().catch((e) => console.error("[NOTIFY withdrawal paid] gagal:", e));
}

// Alert admin saat toko baru dibuka (pengganti alur approval KYC yang sudah dihapus).
export function notifyAdminNewSeller(storeId: string) {
  (async () => {
    const store = await db.store.findUnique({ where: { id: storeId }, include: { owner: { select: { email: true } } } });
    if (!store) return;
    const appUrl = process.env.APP_URL || "https://nuswamart.com";
    const mail = newSellerAlertEmail({ storeName: store.name, storeSlug: store.slug, ownerEmail: store.owner.email, appUrl });
    await Promise.allSettled(adminRecipients().map((to) => sendMail(to, mail.subject, mail.text, { html: mail.html, replyTo: MAILBOX.seller })));
  })().catch((e) => console.error("[NOTIFY new seller] gagal:", e));
}
