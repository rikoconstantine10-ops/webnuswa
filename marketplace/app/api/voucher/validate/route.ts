import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateVoucher } from "@/lib/voucher";

// Cek voucher saat checkout (dipanggil dari BuyForm). Subtotal dihitung ulang
// tetap di server saat checkout; endpoint ini hanya untuk pratinjau diskon.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { code?: string; productId?: string; subtotal?: number };
  if (!body.code || !body.productId) {
    return NextResponse.json({ ok: false, message: "data tidak lengkap" }, { status: 400 });
  }
  const product = await db.product.findUnique({ where: { id: body.productId }, select: { storeId: true } });
  if (!product) return NextResponse.json({ ok: false, message: "produk tidak valid" }, { status: 400 });

  const subtotal = Math.max(0, Number(body.subtotal) || 0);
  const res = await validateVoucher(body.code, product.storeId, subtotal);
  return NextResponse.json(res);
}
