"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";

const reviewSchema = z.object({
  code: z.string().min(3),
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// Hitung ulang rata-rata rating produk & toko dari seluruh review.
async function recomputeAggregates(productId: string, storeId: string) {
  const [prod, store] = await Promise.all([
    db.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true }),
    db.review.aggregate({ where: { storeId }, _avg: { rating: true }, _count: true }),
  ]);
  await db.product.update({
    where: { id: productId },
    data: { ratingAvg: prod._avg.rating ?? 0, ratingCount: prod._count },
  });
  await db.store.update({
    where: { id: storeId },
    data: { ratingAvg: store._avg.rating ?? 0, ratingCount: store._count },
  });
}

// Pembeli mengirim ulasan untuk produk pada order yang sudah SELESAI.
export async function submitReviewAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = reviewSchema.safeParse({
    code: formData.get("code"),
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) return { error: "Data ulasan tidak valid" };
  const { code, productId, rating, comment } = parsed.data;

  const order = await db.order.findUnique({
    where: { code },
    include: { items: true },
  });
  if (!order) return { error: "Pesanan tidak ditemukan" };
  if (order.status !== "COMPLETED") return { error: "Ulasan hanya bisa setelah pesanan selesai" };
  const item = order.items.find((i) => i.productId === productId && !i.isAddon);
  if (!item) return { error: "Produk tidak ada di pesanan ini" };

  const existing = await db.review.findUnique({
    where: { orderId_productId: { orderId: order.id, productId } },
  });
  if (existing) return { error: "Kamu sudah memberi ulasan untuk produk ini" };

  await db.review.create({
    data: {
      orderId: order.id,
      productId,
      storeId: order.storeId,
      buyerId: order.buyerId,
      buyerName: order.buyerName,
      rating,
      comment: comment?.trim() || null,
    },
  });
  await recomputeAggregates(productId, order.storeId);

  const product = await db.product.findUnique({ where: { id: productId }, select: { slug: true } });
  revalidatePath(`/order/${code}`);
  if (product) revalidatePath(`/p/${product.slug}`);
  return { ok: true };
}

// Seller membalas sebuah ulasan produknya.
export async function replyReviewAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const { store } = await requireSeller();
  const reviewId = String(formData.get("reviewId") ?? "");
  const reply = String(formData.get("reply") ?? "").trim().slice(0, 1000);
  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review || review.storeId !== store.id) return { error: "Ulasan tidak ditemukan" };
  await db.review.update({ where: { id: reviewId }, data: { sellerReply: reply || null } });
  revalidatePath("/dashboard/reviews");
  return { ok: true };
}
