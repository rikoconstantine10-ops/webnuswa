import { db } from "./db";
import { createBiteshipOrder, getBiteshipOrder, INSTANT_COURIER_CODES } from "./biteship";
import { waSend } from "./wa";
import { releaseOrderFunds, getStoreFeePercent } from "./ledger";
import { notifyOrderShipped } from "./notify";
import { finalizeOrderEarnings } from "./earnings";

// Hari sebelum order "delivered" otomatis diselesaikan (rilis dana) bila pembeli diam.
export const AUTO_COMPLETE_DAYS = 3;

// Peta status Biteship → status order internal.
function mapStatus(biteship: string): "PROCESSING" | "SHIPPED" | "DELIVERED" | null {
  const s = biteship.toLowerCase();
  if (["confirmed", "allocated", "picking_up", "scheduled"].includes(s)) return "PROCESSING";
  if (["picked", "dropping_off", "on_transit", "in_transit"].includes(s)) return "SHIPPED";
  if (["delivered"].includes(s)) return "DELIVERED";
  return null;
}

async function notifyBuyer(order: { storeId: string; buyerPhone: string | null; code: string }, msg: string) {
  if (!order.buyerPhone) return;
  await waSend(order.storeId, order.buyerPhone, msg).catch(() => {});
}

// Buat order pengiriman di Biteship untuk sebuah order fisik (best-effort, idempotent).
export async function createShipmentForOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { store: true, items: { include: { product: true } } },
  });
  if (!order) return { ok: false, error: "order tidak ditemukan" };
  if (order.biteshipOrderId) return { ok: true }; // sudah dibuat
  const physical = order.items.filter((i) => !i.isAddon && i.product.type === "PHYSICAL");
  if (physical.length === 0) return { ok: true }; // tidak ada barang fisik
  const store = order.store;
  if (!store.originAreaId || !order.destAreaId || !order.courierCompany || !order.courierType) {
    return { ok: false, error: "data pengiriman tidak lengkap" };
  }
  const isInstant = INSTANT_COURIER_CODES.has(order.courierCompany);

  const res = await createBiteshipOrder({
    origin: {
      contactName: store.originContactName || store.name,
      contactPhone: store.originContactPhone || "6280000000000",
      address: store.originAddress || store.name,
      areaId: store.originAreaId,
      postalCode: store.originPostalCode ?? undefined,
      lat: store.originLat ?? undefined,
      lng: store.originLng ?? undefined,
    },
    destination: {
      contactName: order.buyerName,
      contactPhone: order.buyerPhone || "6280000000000",
      address: order.shippingAddress || "-",
      areaId: order.destAreaId,
      postalCode: order.destPostalCode ?? undefined,
      lat: order.destLat ?? undefined,
      lng: order.destLng ?? undefined,
    },
    courierCompany: order.courierCompany,
    courierType: order.courierType,
    orderNote: `NuswaMart ${order.code}`,
    isInstant,
    codAmount: order.paymentType === "cod" ? order.total : undefined,
    items: physical.map((i) => ({
      name: i.name.slice(0, 40),
      value: i.price,
      weight: Math.max(100, i.product.weightGrams ?? 1000),
      quantity: i.qty,
    })),
  });

  if (!res.success) return { ok: false, error: res.error };

  await db.order.update({
    where: { id: order.id },
    data: {
      biteshipOrderId: res.orderId || null,
      trackingNumber: res.waybill || null,
      shipmentStatus: res.status || "confirmed",
      status: order.status === "PAID" ? "PROCESSING" : order.status,
    },
  });
  await notifyBuyer(
    order,
    `📦 Pesanan ${order.code} sedang disiapkan kurir ${order.courier ?? ""}.${res.waybill ? ` No. resi: ${res.waybill}` : ""}`
  );
  notifyOrderShipped(order.id);
  return { ok: true };
}

// Terapkan update status pengiriman (dipanggil dari webhook Biteship atau sinkron cron).
export async function applyShipmentStatus(orderId: string, biteshipStatus: string, waybill?: string): Promise<void> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const mapped = mapStatus(biteshipStatus);
  const data: Record<string, unknown> = { shipmentStatus: biteshipStatus };
  if (waybill && !order.trackingNumber) data.trackingNumber = waybill;

  if (mapped === "DELIVERED") {
    // COD: barang sampai = uang tunai tertagih → langsung selesaikan & kredit penjual.
    if (order.paymentType === "cod" && order.status !== "COMPLETED") {
      await db.order.update({ where: { id: order.id }, data });
      await settleCodOrder(order.id);
      return;
    }
    // Prabayar: mulai hitung mundur auto-selesai; pembeli boleh konfirmasi lebih cepat.
    if (order.status !== "COMPLETED") {
      data.status = "SHIPPED";
      if (!order.autoCompleteAt) {
        data.autoCompleteAt = new Date(Date.now() + AUTO_COMPLETE_DAYS * 24 * 60 * 60 * 1000);
      }
    }
  } else if (mapped === "SHIPPED" && order.status === "PROCESSING") {
    data.status = "SHIPPED";
  } else if (mapped === "PROCESSING" && order.status === "PAID") {
    data.status = "PROCESSING";
  }
  await db.order.update({ where: { id: order.id }, data });

  if (mapped === "DELIVERED") {
    await notifyBuyer(
      order,
      `✅ Pesanan ${order.code} sudah SAMPAI. Cek barangnya ya. Jika sudah sesuai, konfirmasi "Pesanan Diterima" di halaman pesanan. Dana akan otomatis diteruskan ke penjual dalam ${AUTO_COMPLETE_DAYS} hari.`
    );
  }
}

// Selesaikan order COD saat barang sampai: uang tunai tertagih kurir → kredit penjual.
async function settleCodOrder(orderId: string): Promise<void> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === "COMPLETED" || order.paymentType !== "cod") return;
  const feePercent = await getStoreFeePercent(order.storeId);
  // Diskon voucher TOKO ditanggung penjual; voucher PLATFORM (storeId null) ditanggung platform
  // (sama seperti markOrderPaid — seller tetap dapat subtotal penuh bila diskon disubsidi platform).
  const voucher = order.voucherId ? await db.voucher.findUnique({ where: { id: order.voucherId } }) : null;
  const sellerBorneDiscount = voucher && voucher.storeId ? order.discountAmount : 0;
  const netSubtotal = Math.max(0, order.subtotal - sellerBorneDiscount);
  const fee = Math.round((netSubtotal * feePercent) / 100);
  const now = new Date();
  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED", paidAt: order.paidAt ?? now, completedAt: now, platformFee: fee, fundsReleased: true },
    }),
    db.ledgerEntry.create({
      data: {
        storeId: order.storeId,
        orderId: order.id,
        type: "SALE_CREDIT",
        amount: netSubtotal + order.shippingCost,
        status: "AVAILABLE",
        note: `COD ${order.code}${sellerBorneDiscount ? ` (diskon toko Rp${sellerBorneDiscount.toLocaleString("id-ID")})` : ""}`,
      },
    }),
    db.ledgerEntry.create({
      data: { storeId: order.storeId, orderId: order.id, type: "PLATFORM_FEE", amount: -fee, status: "AVAILABLE", note: `Fee ${feePercent}% COD ${order.code}` },
    }),
  ]);
  await finalizeOrderEarnings(order.id);
}

// Sinkronkan status dari Biteship untuk satu order (fallback bila webhook tidak jalan).
export async function syncShipmentStatus(orderId: string): Promise<void> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order?.biteshipOrderId) return;
  const res = await getBiteshipOrder(order.biteshipOrderId);
  if (res.success && res.status) await applyShipmentStatus(orderId, res.status, res.waybill);
}

// Auto-selesaikan order yang sudah "delivered" & lewat tenggat konfirmasi (dipanggil cron).
export async function autoCompleteDeliveredOrders(): Promise<number> {
  const due = await db.order.findMany({
    where: { status: "SHIPPED", fundsReleased: false, autoCompleteAt: { lte: new Date() } },
    select: { id: true },
  });
  for (const o of due) {
    await db.order.update({
      where: { id: o.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await releaseOrderFunds(o.id);
    await finalizeOrderEarnings(o.id);
  }
  return due.length;
}
