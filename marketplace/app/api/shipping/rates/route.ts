import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRates } from "@/lib/biteship";

// Hitung ongkir untuk sebuah produk fisik ke area tujuan pembeli.
// Origin diambil dari alamat toko (server-side, bukan dari client).
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    productId?: string;
    qty?: number;
    destAreaId?: string;
  };
  const qty = Math.max(1, Math.min(999, Number(body.qty) || 1));

  if (!body.productId || !body.destAreaId) {
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

  const weight = Math.max(100, product.weightGrams ?? 1000);
  const result = await getRates({
    originAreaId: store.originAreaId,
    destinationAreaId: body.destAreaId,
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
  const pricing = result.pricing.map((p) => ({
    company: p.courier_code,
    type: p.courier_service_code,
    name: `${p.courier_name} ${p.courier_service_name}`,
    price: p.price,
    duration: p.duration || p.shipment_duration_range || "",
  }));

  return NextResponse.json({ pricing });
}
