import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyShipmentStatus } from "@/lib/shipping";

// Webhook status pengiriman dari Biteship.
// Konfigurasi URL ini di dashboard Biteship. Opsional lindungi dengan
// BITESHIP_WEBHOOK_TOKEN (header/query) bila diset.
export async function POST(req: NextRequest) {
  const token = process.env.BITESHIP_WEBHOOK_TOKEN;
  if (token) {
    const got = req.headers.get("x-webhook-token") || req.nextUrl.searchParams.get("token");
    if (got !== token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    order_id?: string;
    status?: string;
    courier_waybill_id?: string;
    waybill_id?: string;
  };

  await db.webhookLog.create({
    data: { source: "biteship", payload: JSON.stringify(body).slice(0, 4000) },
  });

  const biteshipOrderId = body.order_id;
  const status = body.status;
  if (!biteshipOrderId || !status) {
    return NextResponse.json({ ok: true, note: "no order/status" });
  }

  const order = await db.order.findFirst({ where: { biteshipOrderId } });
  if (!order) return NextResponse.json({ ok: true, note: "order not found" });

  await applyShipmentStatus(order.id, status, body.courier_waybill_id || body.waybill_id);
  return NextResponse.json({ ok: true });
}
