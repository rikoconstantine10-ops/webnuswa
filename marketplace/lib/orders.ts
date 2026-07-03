import { randomBytes } from "crypto";
import { db } from "./db";
import { getPlatformFeePercent } from "./ledger";
import { notifyOrderPaid } from "./notify";
import { trackEvent } from "./analytics";

const DOWNLOAD_DAYS = 7;

// Idempotent: hanya memproses order berstatus PENDING_PAYMENT.
// Mencatat ledger (kredit penjualan − platform fee), mengurangi stok,
// dan menerbitkan token download untuk item digital.
export async function markOrderPaid(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { include: { digitalAsset: true } } } } },
  });
  if (!order || order.status !== "PENDING_PAYMENT") return order;

  const feePercent = await getPlatformFeePercent();
  const fee = Math.round((order.subtotal * feePercent) / 100);
  const allDigital = order.items.every((i) => i.product.type === "DIGITAL");
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: allDigital ? "COMPLETED" : "PAID",
        platformFee: fee,
        paidAt: now,
        completedAt: allDigital ? now : null,
      },
    });

    // Kredit penjualan ke saldo seller (subtotal + ongkir), lalu potong fee platform.
    await tx.ledgerEntry.create({
      data: {
        storeId: order.storeId,
        orderId: order.id,
        type: "SALE_CREDIT",
        amount: order.subtotal + order.shippingCost,
        note: `Penjualan order ${order.code}`,
      },
    });
    await tx.ledgerEntry.create({
      data: {
        storeId: order.storeId,
        orderId: order.id,
        type: "PLATFORM_FEE",
        amount: -fee,
        note: `Platform fee ${feePercent}% order ${order.code}`,
      },
    });

    for (const item of order.items) {
      if (item.product.type === "PHYSICAL") {
        if (item.variantName) {
          await tx.productVariant.updateMany({
            where: { productId: item.productId, name: item.variantName, stock: { not: null } },
            data: { stock: { decrement: item.qty } },
          });
        } else if (item.product.stock !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.qty } },
          });
        }
      }
      if (item.product.type === "DIGITAL" && item.product.digitalAsset) {
        await tx.downloadToken.create({
          data: {
            orderItemId: item.id,
            token: randomBytes(24).toString("hex"),
            maxDownloads: item.product.digitalAsset.maxDownloads,
            expiresAt: new Date(Date.now() + DOWNLOAD_DAYS * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  });

  notifyOrderPaid(order.id);
  for (const item of order.items) {
    trackEvent({ type: "PURCHASE", storeId: order.storeId, productId: item.productId });
  }

  return db.order.findUnique({ where: { id: orderId } });
}

export function generateOrderCode(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `ORD-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}
