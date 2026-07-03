import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";

const PAID_STATUSES = ["paid", "success", "settlement", "completed", "berhasil"];

// Endpoint notifikasi status pembayaran dari Louvin.
// Set webhook_url project Louvin ke: {APP_URL}/api/webhooks/louvin
export async function POST(req: NextRequest) {
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
  const trxId = payload.transaction_id ?? payload.id ?? data.transaction_id ?? data.id;
  const status = String(
    payload.status ?? payload.transaction_status ?? data.status ?? ""
  ).toLowerCase();

  if (!trxId) {
    await db.webhookLog.update({
      where: { id: log.id },
      data: { note: "transaction id tidak ditemukan di payload" },
    });
    return NextResponse.json({ received: true });
  }

  const order = await db.order.findUnique({ where: { louvinTrxId: String(trxId) } });
  if (!order) {
    await db.webhookLog.update({
      where: { id: log.id },
      data: { note: `order dengan trxId ${trxId} tidak ditemukan` },
    });
    return NextResponse.json({ received: true });
  }

  if (PAID_STATUSES.includes(status)) {
    await markOrderPaid(order.id);
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
