import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ stores: [], orders: [], products: [] }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ stores: [], orders: [], products: [] });

  const [stores, orders, products] = await Promise.all([
    db.store.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { owner: { email: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: { id: true, name: true, slug: true, owner: { select: { email: true } } },
      take: 5,
    }),
    db.order.findMany({
      where: {
        OR: [
          { code: { contains: q, mode: "insensitive" } },
          { buyerEmail: { contains: q, mode: "insensitive" } },
          { buyerName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, code: true, buyerName: true, status: true, storeId: true },
      take: 5,
    }),
    db.product.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, storeId: true, slug: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ stores, orders, products });
}
