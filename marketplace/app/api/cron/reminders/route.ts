import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { waSend, waSendToSelf } from "@/lib/wa";
import { autoResolveOverdueReturns } from "@/lib/orders";

// Reminder otomatis via WA (dipanggil crontab tiap 15 menit):
// - Order menunggu bayar 1–24 jam → ingatkan pembeli dari WA toko ybs.
// - Order menggantung > 2 jam → beri tahu seller.
// Panggil: GET /api/cron/reminders?key={CRON_SECRET}
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.nextUrl.searchParams.get("key") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const appUrl = process.env.APP_URL || "";

  const pending = await db.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      waReminderSent: false,
      buyerPhone: { not: null },
      createdAt: {
        lt: new Date(now - 60 * 60 * 1000), // > 1 jam
        gt: new Date(now - 24 * 60 * 60 * 1000), // < 24 jam (VA expired setelahnya)
      },
    },
    include: { store: { select: { name: true } } },
    take: 50,
  });

  let buyerReminded = 0;
  let sellerNotified = 0;

  for (const order of pending) {
    const sent = await waSend(
      order.storeId,
      order.buyerPhone!,
      `Halo ${order.buyerName} 👋\n\nPesananmu *${order.code}* di ${order.store.name} senilai ${formatRupiah(order.total)} masih menunggu pembayaran.\n\nSelesaikan di sini sebelum kedaluwarsa:\n${appUrl}/order/${order.code}\n\nAbaikan pesan ini jika sudah membayar.`
    );
    if (sent) {
      await db.order.update({ where: { id: order.id }, data: { waReminderSent: true } });
      buyerReminded++;

      // Order menggantung > 2 jam: sekalian beri tahu seller.
      if (order.createdAt.getTime() < now - 2 * 60 * 60 * 1000) {
        const ok = await waSendToSelf(
          order.storeId,
          `⏳ Order ${order.code} (${order.buyerName}, ${formatRupiah(order.total)}) belum dibayar sejak ${order.createdAt.toLocaleTimeString("id-ID")}. Pembeli sudah di-follow-up otomatis.`
        );
        if (ok) sellerNotified++;
      }
    }
  }

  const returnsAutoResolved = await autoResolveOverdueReturns();

  return NextResponse.json({ checked: pending.length, buyerReminded, sellerNotified, returnsAutoResolved });
}
