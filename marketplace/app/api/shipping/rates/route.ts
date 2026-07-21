import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRates, INSTANT_COURIERS, REGULAR_COURIERS } from "@/lib/biteship";

// Hitung ongkir untuk sebuah produk fisik ke area tujuan pembeli.
// Origin diambil dari alamat toko (server-side, bukan dari client).
// Jika toko punya koordinat titik jemput DAN pembeli mengirim koordinat tujuan,
// kurir instan (Gojek/Grab/Lalamove) ikut dihitung bersama kurir reguler.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    productId?: string;
    qty?: number;
    destAreaId?: string;
    destLat?: number;
    destLng?: number;
  };
  const qty = Math.max(1, Math.min(999, Number(body.qty) || 1));
  const destLat = Number(body.destLat);
  const destLng = Number(body.destLng);
  const hasDestCoord = Number.isFinite(destLat) && Number.isFinite(destLng);

  if (!body.productId || (!body.destAreaId && !hasDestCoord)) {
    return NextResponse.json({ error: "produk & tujuan wajib" }, { status: 400 });
  }

  const product = await db.product.findUnique({
    where: { id: body.productId },
    include: { store: true },
  });
  if (!product || product.type !== "PHYSICAL") {
    return NextResponse.json({ error: "produk tidak valid" }, { status: 400 });
  }

  const store = product.store;
  if (!store.originAreaId) {
    return NextResponse.json(
      { error: "Toko belum mengatur alamat asal pengiriman", pricing: [] },
      { status: 200 }
    );
  }

  // Kurir instan hanya bisa dihitung bila toko & pembeli sama-sama punya koordinat.
  const canInstant =
    typeof store.originLat === "number" &&
    typeof store.originLng === "number" &&
    hasDestCoord;

  const weight = Math.max(100, product.weightGrams ?? 1000);
  const result = await getRates({
    originAreaId: store.originAreaId,
    originLatitude: canInstant ? store.originLat! : undefined,
    originLongitude: canInstant ? store.originLng! : undefined,
    destinationAreaId: body.destAreaId || undefined,
    destinationLatitude: hasDestCoord ? destLat : undefined,
    destinationLongitude: hasDestCoord ? destLng : undefined,
    // Kurir reguler selalu; tambah instan bila koordinat toko & tujuan lengkap.
    couriers: canInstant ? `${REGULAR_COURIERS},${INSTANT_COURIERS}` : REGULAR_COURIERS,
    items: [
      {
        name: product.name.slice(0, 40),
        value: product.price,
        weight,
        quantity: qty,
      },
    ],
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error, pricing: [] });
  }

  // Sederhanakan payload untuk client.
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
