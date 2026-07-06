import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";
import { verifyCallbackSignature, verifyPayment, PAYMENTO_PAID_STATUSES } from "@/lib/paymento";
import { logError } from "@/lib/errors";

// IPN Paymento: notifikasi status pembayaran crypto (server-to-server).
// Set URL ini di dashboard Paymento (Set Payment Settings / IPN URL):
//   https://nuswamart.com/api/webhooks/paymento
// Keamanan: verifikasi HMAC-SHA256 header + double-check via Verify Payment API sebelum menandai lunas.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature =
    req.headers.get("x-hmac-sha256-signature") ||
    req.headers.get("hmac_sha256_signature") ||
    req.headers.get("x-hmac-sha256");

  await db.webhookLog.create({ data: { source: "paymento", payload: raw.slice(0, 4000) } }).catch(() => {});

  if (!verifyCallbackSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try { body = JSON.parse(raw || "{}"); } catch { /* noop */ }
  const token = String(body.Token ?? body.token ?? "");
  const orderCode = String(body.OrderId ?? body.orderId ?? "");
  const statusRaw = body.OrderStatus ?? body.orderStatus;
  const status = typeof statusRaw === "number" ? statusRaw : parseInt(String(statusRaw ?? ""), 10);

  if (!token || !orderCode) return NextResponse.json({ ok: true, note: "no token/orderId" });

  const order = await db.order.findUnique({ where: { code: orderCode } });
  if (!order) return NextResponse.json({ ok: true, note: "order not found" });

  // Hanya proses bila status callback menandakan lunas.
  if (!Number.isFinite(status) || !PAYMENTO_PAID_STATUSES.includes(status as (typeof PAYMENTO_PAID_STATUSES)[number])) {
    return NextResponse.json({ ok: true, note: `status ${status} belum lunas` });
  }

  // Double-check ke Paymento (jangan percaya payload saja).
  const verify = await verifyPayment(token);
  if (!verify.ok || !verify.paid) {
    return NextResponse.json({ ok: true, note: `verify gagal/belum lunas (${verify.orderStatus ?? verify.error})` });
  }

  try {
    await markOrderPaid(order.id);
  } catch (e) {
    await logError("webhook.paymento.markOrderPaid", e, { orderId: order.id, code: order.code });
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
