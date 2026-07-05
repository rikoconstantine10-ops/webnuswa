import { randomBytes } from "crypto";
import { db } from "./db";
import { getPlatformFeePercent, releaseOrderFunds } from "./ledger";
import { notifyOrderPaid } from "./notify";
import { trackEvent } from "./analytics";
import { capiPurchase } from "./capi";
import { createShipmentForOrder } from "./shipping";
import { finalizeOrderEarnings } from "./earnings";

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
  // Diskon voucher TOKO ditanggung penjual; voucher PLATFORM (storeId null) ditanggung platform.
  const voucher = order.voucherId ? await db.voucher.findUnique({ where: { id: order.voucherId } }) : null;
  const sellerBorneDiscount = voucher && voucher.storeId ? order.discountAmount : 0;
  const netSubtotal = Math.max(0, order.subtotal - sellerBorneDiscount);
  const fee = Math.round((netSubtotal * feePercent) / 100);
  const allDigital = order.items.every((i) => i.product.type === "DIGITAL");
  const now = new Date();
  // Produk digital dianggap langsung "diterima" → dana boleh langsung dirilis.
  // Produk fisik masuk ESCROW (HELD) sampai pesanan selesai/diterima.
  const escrowStatus = allDigital ? "AVAILABLE" : "HELD";

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: allDigital ? "COMPLETED" : "PAID",
        platformFee: fee,
        paidAt: now,
        completedAt: allDigital ? now : null,
        fundsReleased: allDigital,
      },
    });

    // Kredit penjualan ke saldo seller (subtotal + ongkir), lalu potong fee platform.
    await tx.ledgerEntry.create({
      data: {
        storeId: order.storeId,
        orderId: order.id,
        type: "SALE_CREDIT",
        amount: netSubtotal + order.shippingCost,
        status: escrowStatus,
        note: `Penjualan order ${order.code}${sellerBorneDiscount ? ` (diskon toko Rp${sellerBorneDiscount.toLocaleString("id-ID")})` : ""}`,
      },
    });
    if (order.voucherId) {
      await tx.voucher.update({ where: { id: order.voucherId }, data: { used: { increment: 1 } } });
    }
    await tx.ledgerEntry.create({
      data: {
        storeId: order.storeId,
        orderId: order.id,
        type: "PLATFORM_FEE",
        amount: -fee,
        status: escrowStatus,
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

  // Facebook Conversions API (server-side Purchase) jika toko mengaktifkan Pixel.
  const store = await db.store.findUnique({
    where: { id: order.storeId },
    select: { metaPixelId: true, metaCapiToken: true },
  });
  if (store?.metaPixelId && store.metaCapiToken) {
    capiPurchase(store, order, `purchase_${order.id}`);
  }

  // Produk fisik: coba buat order pengiriman di Biteship secara otomatis (best-effort).
  if (!allDigital) {
    createShipmentForOrder(order.id).catch(() => {});
  } else {
    // Digital langsung selesai → cairkan komisi afiliasi & poin loyalti.
    finalizeOrderEarnings(order.id).catch(() => {});
  }

  return db.order.findUnique({ where: { id: orderId } });
}

// Tandai order selesai & rilis dana escrow ke saldo seller. Idempotent.
// Dipanggil saat pembeli konfirmasi terima, kurir "delivered", atau auto-complete.
export async function completeOrder(orderId: string): Promise<void> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (["COMPLETED", "CANCELLED", "REFUNDED"].includes(order.status)) return;
  await db.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  if (!order.fundsReleased) await releaseOrderFunds(orderId);
  await finalizeOrderEarnings(orderId);
}

export function generateOrderCode(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `ORD-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}
