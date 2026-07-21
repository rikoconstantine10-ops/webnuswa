import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";
import { markAiCreditPurchasePaid } from "@/lib/aiCredits";
import { logError } from "@/lib/errors";

const PAID_STATUSES = ["paid", "success", "settlement", "completed", "berhasil"];

// Endpoint notifikasi status pembayaran dari Louvin.
// Set webhook_url project Louvin ke: {APP_URL}/api/webhooks/louvin?key={WEBHOOK_SECRET}
export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && req.nextUrl.searchParams.get("key") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const log = await db.webhookLog.create({
    data: { source: "louvin", payload: JSON.stringify(payload) },
  });

  const data = (payload.data ?? {}) as Record<string, unknown>;
  const transaction = (payload.transaction ?? {}) as Record<string, unknown>;
  const trxId =
    transaction.id ?? payload.transaction_id ?? payload.id ?? data.transaction_id ?? data.id;
  const status = String(
    payload.status ??
      payload.transaction_status ??
      transaction.status ??
      data.status ??
      ""
  ).toLowerCase();

  if (!trxId) {
    await db.webhookLog.update({
      where: { id: log.id },
      data: { note: "transaction id tidak ditemukan di payload" },
    });
    return NextResponse.json({ received: true });
  }

  let order = await db.order.findUnique({ where: { louvinTrxId: String(trxId) } });
  if (!order) {
    // Fallback: cocokkan via reference/order_id yang tersimpan di paymentInfo.
    const ref =
      transaction.reference ?? payload.reference ?? payload.order_id ?? data.reference ?? data.order_id;
    if (ref) {
      order = await db.order.findFirst({
        where: { paymentInfo: { contains: String(ref) } },
      });
    }
  }
  if (!order) {
    // Bukan pembayaran order marketplace — cek apakah ini pembelian topup kredit AI.
    const purchase = await db.aiCreditPurchase.findUnique({ where: { louvinTrxId: String(trxId) } });
    if (!purchase) {
      await db.webhookLog.update({
        where: { id: log.id },
        data: { note: `order/purchase dengan trxId ${trxId} tidak ditemukan` },
      });
      return NextResponse.json({ received: true });
    }

    if (PAID_STATUSES.includes(status)) {
      try {
        await markAiCreditPurchasePaid(purchase.id);
      } catch (e) {
        await logError("webhook.louvin.markAiCreditPurchasePaid", e, { purchaseId: purchase.id });
        throw e;
      }
      await db.webhookLog.update({
        where: { id: log.id },
        data: { processed: true, note: `topup kredit AI ${purchase.id} ditandai lunas` },
      });
    } else if (["expired", "cancelled", "failed"].includes(status)) {
      if (purchase.status === "PENDING") {
        await db.aiCreditPurchase.update({
          where: { id: purchase.id },
          data: { status: status === "expired" ? "EXPIRED" : "CANCELLED" },
        });
      }
      await db.webhookLog.update({
        where: { id: log.id },
        data: { processed: true, note: `topup kredit AI ${purchase.id} status: ${status}` },
      });
    } else {
      await db.webhookLog.update({
        where: { id: log.id },
        data: { note: `status tidak dikenali: ${status}` },
      });
    }
    return NextResponse.json({ received: true });
  }

  if (PAID_STATUSES.includes(status)) {
    try {
      await markOrderPaid(order.id);
    } catch (e) {
      await logError("webhook.louvin.markOrderPaid", e, { orderId: order.id, code: order.code });
      throw e;
    }
    await db.webhookLog.update({
      where: { id: log.id },
      data: { processed: true, note: `order ${order.code} ditandai lunas` },
    });
  } else if (["expired", "cancelled", "failed"].includes(status)) {
    if (order.status === "PENDING_PAYMENT") {
      await db.order.update({
        where: { id: order.id },
        data: { status: status === "expired" ? "EXPIRED" : "CANCELLED" },
      });
    }
    await db.webhookLog.update({
      where: { id: log.id },
      data: { processed: true, note: `order ${order.code} status: ${status}` },
    });
  } else {
    await db.webhookLog.update({
      where: { id: log.id },
      data: { note: `status tidak dikenali: ${status}` },
    });
  }

  return NextResponse.json({ received: true });
}
