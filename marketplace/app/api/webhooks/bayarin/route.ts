import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";
import { verifyBayarinSignature, checkBayarinStatus } from "@/lib/bayarin";
import { logError } from "@/lib/errors";

// Callback Bayarin: notifikasi status pembayaran (server-to-server).
// Set URL ini di dashboard Bayarin → Integration → Konfigurasi Url → Callback URL (Webhook):
//   https://nuswamart.com/api/webhooks/bayarin
// Keamanan: verifikasi signature MD5(api_id+api_key+reference_id) + double-check via Check
// Transaction Status API sebelum menandai lunas (jangan percaya payload webhook saja).
export async function POST(req: NextRequest) {
  const raw = await req.text();
  await db.webhookLog.create({ data: { source: "bayarin", payload: raw.slice(0, 4000) } }).catch(() => {});

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json({ ok: true, note: "invalid json" });
  }

  const data = (body.data ?? {}) as Record<string, unknown>;
  const referenceId = String(data.reference_id ?? "");
  const signature = String(body.signature ?? "");
  if (!referenceId) return NextResponse.json({ ok: true, note: "no reference_id" });

  if (!verifyBayarinSignature(referenceId, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const order = await db.order.findUnique({ where: { code: referenceId } });
  if (!order) return NextResponse.json({ ok: true, note: "order not found" });
  if (order.status !== "PENDING_PAYMENT") return NextResponse.json({ ok: true, note: "already processed" });

  if (String(data.status ?? "") !== "paid") {
    return NextResponse.json({ ok: true, note: `status ${data.status} belum lunas` });
  }

  // Double-check ke Bayarin (jangan percaya payload saja).
  const verify = await checkBayarinStatus(referenceId);
  if (!verify.ok || verify.status !== "paid") {
    return NextResponse.json({ ok: true, note: `verify gagal/belum lunas (${verify.status ?? verify.error})` });
  }

  try {
    await markOrderPaid(order.id);
  } catch (e) {
    await logError("webhook.bayarin.markOrderPaid", e, { orderId: order.id, code: order.code });
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
