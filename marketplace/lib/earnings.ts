import { db } from "./db";

// Persen poin loyalti yang didapat dari nilai belanja (bisa diubah via Setting).
async function loyaltyEarnPercent(): Promise<number> {
  const s = await db.setting.findUnique({ where: { key: "loyalty_earn_percent" } });
  const v = s ? parseFloat(s.value) : NaN;
  return Number.isFinite(v) ? v : 0.5;
}

// Dipanggil sekali saat order SELESAI (prabayar/COD): cairkan komisi afiliasi &
// beri poin loyalti ke pembeli. Idempotent (aman dipanggil berulang).
export async function finalizeOrderEarnings(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;
  const netSubtotal = Math.max(0, order.subtotal - order.discountAmount);

  // --- Komisi afiliasi ---
  if (order.affiliateUserId) {
    const exists = await db.affiliateCommission.findUnique({ where: { orderId } });
    if (!exists) {
      const productIds = order.items.filter((i) => !i.isAddon).map((i) => i.productId);
      const products = await db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, affiliatePct: true },
      });
      const pctById = new Map(products.map((p) => [p.id, p.affiliatePct]));
      let commission = 0;
      for (const it of order.items) {
        if (it.isAddon) continue;
        const pct = pctById.get(it.productId) ?? 0;
        if (pct > 0) commission += Math.round((it.price * it.qty * pct) / 100);
      }
      if (commission > 0) {
        await db.affiliateCommission.create({
          data: { affiliateUserId: order.affiliateUserId, orderId, amount: commission, status: "AVAILABLE" },
        });
      }
    }
  }

  // --- Poin loyalti pembeli ---
  if (order.buyerId) {
    const already = await db.pointEntry.findFirst({ where: { orderId, amount: { gt: 0 } } });
    if (!already) {
      const pct = await loyaltyEarnPercent();
      const earned = Math.round((netSubtotal * pct) / 100);
      if (earned > 0) {
        await db.$transaction([
          db.user.update({ where: { id: order.buyerId }, data: { points: { increment: earned } } }),
          db.pointEntry.create({ data: { userId: order.buyerId, orderId, amount: earned, note: `Poin dari order ${order.code}` } }),
        ]);
      }
    }
  }
}

// Saldo komisi afiliasi yang bisa ditarik (status AVAILABLE).
export async function affiliateBalance(userId: string): Promise<number> {
  const agg = await db.affiliateCommission.aggregate({
    where: { affiliateUserId: userId, status: "AVAILABLE" },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}
