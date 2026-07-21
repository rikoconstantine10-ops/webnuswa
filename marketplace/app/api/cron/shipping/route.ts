import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncShipmentStatus, autoCompleteDeliveredOrders } from "@/lib/shipping";

// Sinkron status kurir + auto-selesaikan order yang sudah sampai (rilis dana escrow).
// Panggil: GET /api/cron/shipping?key={CRON_SECRET}  (tiap ~30 menit)
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.nextUrl.searchParams.get("key") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Sinkronkan order fisik yang masih berjalan (fallback bila webhook Biteship tak jalan).
  const active = await db.order.findMany({
    where: {
      status: { in: ["PROCESSING", "SHIPPED"] },
      biteshipOrderId: { not: null },
      fundsReleased: false,
    },
    select: { id: true },
    take: 100,
  });
  for (const o of active) await syncShipmentStatus(o.id);

  const completed = await autoCompleteDeliveredOrders();

  return NextResponse.json({ synced: active.length, autoCompleted: completed });
}
