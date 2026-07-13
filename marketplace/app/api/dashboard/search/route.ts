import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  let storeId: string;
  try {
    ({ store: { id: storeId } } = await requireSeller());
  } catch {
    return NextResponse.json({ orders: [], products: [] }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ orders: [], products: [] });

  const [orders, products] = await Promise.all([
    db.order.findMany({
      where: {
        storeId,
        OR: [
          { code: { contains: q, mode: "insensitive" } },
          { buyerName: { contains: q, mode: "insensitive" } },
          { buyerEmail: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, code: true, buyerName: true, status: true },
      take: 5,
    }),
    db.product.findMany({
      where: { storeId, name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ orders, products });
}
