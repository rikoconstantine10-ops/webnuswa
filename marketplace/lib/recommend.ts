import { db } from "./db";

const CARD_SELECT = {
  id: true,
  slug: true,
  name: true,
  price: true,
  type: true,
  imageUrl: true,
  ratingAvg: true,
  ratingCount: true,
  salePrice: true,
  saleEndsAt: true,
  boostedUntil: true,
  store: { select: { name: true, slug: true } },
} as const;

const baseWhere = { active: true, moderation: "APPROVED", store: { status: "ACTIVE" } } as const;

// Produk serupa: kategori sama (fallback: toko sama), diurutkan terlaris.
export async function similarProducts(product: { id: string; categoryId: string | null; storeId: string }, take = 6) {
  if (product.categoryId) {
    const byCat = await db.product.findMany({
      where: { ...baseWhere, categoryId: product.categoryId, id: { not: product.id } },
      select: CARD_SELECT,
      orderBy: [{ soldCount: "desc" }, { ratingAvg: "desc" }],
      take,
    });
    if (byCat.length >= 2) return byCat;
  }
  // Fallback: produk lain dari toko yang sama.
  return db.product.findMany({
    where: { ...baseWhere, storeId: product.storeId, id: { not: product.id } },
    select: CARD_SELECT,
    orderBy: { soldCount: "desc" },
    take,
  });
}

// Sering dibeli bersama: produk yang muncul di order yang sama dengan produk ini.
export async function frequentlyBoughtTogether(productId: string, take = 4) {
  const orderRows = await db.orderItem.findMany({
    where: { productId, isAddon: false },
    select: { orderId: true },
    take: 500,
  });
  const orderIds = [...new Set(orderRows.map((r) => r.orderId))];
  if (orderIds.length === 0) return [];

  const co = await db.orderItem.groupBy({
    by: ["productId"],
    where: { orderId: { in: orderIds }, productId: { not: productId }, isAddon: false },
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: take * 2,
  });
  const ids = co.map((c) => c.productId);
  if (ids.length === 0) return [];

  const products = await db.product.findMany({
    where: { ...baseWhere, id: { in: ids } },
    select: CARD_SELECT,
  });
  // Pertahankan urutan berdasarkan frekuensi co-purchase.
  const rank = new Map(ids.map((id, i) => [id, i]));
  return products.sort((a, b) => (rank.get(a.id)! - rank.get(b.id)!)).slice(0, take);
}
