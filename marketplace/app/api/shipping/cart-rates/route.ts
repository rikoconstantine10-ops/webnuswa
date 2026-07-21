import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getGuestId } from "@/lib/guestCart";
import { getRates, INSTANT_COURIERS, REGULAR_COURIERS } from "@/lib/biteship";

// Ongkir gabungan untuk semua item satu toko di keranjang (login atau tamu).
export async function POST(req: NextRequest) {
  const user = await currentUser();
  const guestId = user ? null : await getGuestId();
  if (!user && !guestId) return NextResponse.json({ error: "keranjang kosong", pricing: [] }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as {
    storeId?: string;
    destAreaId?: string;
    destLat?: number;
    destLng?: number;
  };
  const destLat = Number(body.destLat);
  const destLng = Number(body.destLng);
  const hasDestCoord = Number.isFinite(destLat) && Number.isFinite(destLng);
  if (!body.storeId || (!body.destAreaId && !hasDestCoord)) {
    return NextResponse.json({ error: "tujuan wajib", pricing: [] }, { status: 400 });
  }

  const items = await db.cartItem.findMany({
    where: user
      ? { userId: user.id, product: { storeId: body.storeId, type: "PHYSICAL" } }
      : { guestId, product: { storeId: body.storeId, type: "PHYSICAL" } },
    include: { product: { include: { store: true } } },
  });
  if (items.length === 0) return NextResponse.json({ pricing: [] });
  const store = items[0].product.store;
  if (!store.originAreaId) {
    return NextResponse.json({ error: "Toko belum atur alamat asal", pricing: [] });
  }

  const canInstant =
    typeof store.originLat === "number" && typeof store.originLng === "number" && hasDestCoord;

  const result = await getRates({
    originAreaId: store.originAreaId,
    originLatitude: canInstant ? store.originLat! : undefined,
    originLongitude: canInstant ? store.originLng! : undefined,
    destinationAreaId: body.destAreaId || undefined,
    destinationLatitude: hasDestCoord ? destLat : undefined,
    destinationLongitude: hasDestCoord ? destLng : undefined,
    couriers: canInstant ? `${REGULAR_COURIERS},${INSTANT_COURIERS}` : REGULAR_COURIERS,
    items: items.map((it) => ({
      name: it.product.name.slice(0, 40),
      value: it.product.price,
      weight: Math.max(100, it.product.weightGrams ?? 1000),
      quantity: it.qty,
    })),
  });
  if (!result.success) return NextResponse.json({ error: result.error, pricing: [] });

  const instantSet = new Set(INSTANT_COURIERS.split(","));
  const enabledCouriers = store.enabledCouriers;
  const pricing = result.pricing
    .filter((p) => enabledCouriers.length === 0 || enabledCouriers.includes(p.courier_code))
    .map((p) => ({
      company: p.courier_code,
      type: p.courier_service_code,
      name: `${p.courier_name} ${p.courier_service_name}`,
      price: p.price,
      duration: p.duration || p.shipment_duration_range || "",
      instant: instantSet.has(p.courier_code),
      cod: Boolean(p.available_for_cash_on_delivery),
    }));
  return NextResponse.json({ pricing });
}
