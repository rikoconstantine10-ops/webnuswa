"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { parseStoreBlocks, storeBlockSchema, type StoreBlock } from "@/lib/storeBlocks";

function newId(): string {
  return randomBytes(6).toString("hex");
}

async function loadBlocks(storeId: string): Promise<StoreBlock[]> {
  const store = await db.store.findUnique({ where: { id: storeId }, select: { layoutBlocks: true } });
  return parseStoreBlocks(store?.layoutBlocks);
}

async function saveBlocks(storeId: string, slug: string, blocks: StoreBlock[]) {
  await db.store.update({ where: { id: storeId }, data: { layoutBlocks: blocks } });
  revalidatePath("/dashboard/store/builder");
  revalidatePath(`/s/${slug}`);
}

export async function addBannerBlockAction(formData: FormData) {
  const { store } = await requireSeller();
  const heading = String(formData.get("heading") ?? "").trim();
  const subheading = String(formData.get("subheading") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  if (!heading || !imageUrl) return;

  const block = storeBlockSchema.parse({
    id: newId(),
    type: "banner",
    heading,
    imageUrl,
    ...(subheading ? { subheading } : {}),
    ...(linkUrl ? { linkUrl } : {}),
  });
  const blocks = await loadBlocks(store.id);
  await saveBlocks(store.id, store.slug, [...blocks, block]);
}

export async function addFeaturedProductsBlockAction(formData: FormData) {
  const { store } = await requireSeller();
  const heading = String(formData.get("heading") ?? "").trim();
  const productIds = formData.getAll("productIds").map(String).filter(Boolean);
  if (!heading || productIds.length === 0) return;

  // Pastikan produk yang dipilih memang milik toko ini.
  const owned = await db.product.findMany({
    where: { id: { in: productIds }, storeId: store.id },
    select: { id: true },
  });
  const validIds = owned.map((p) => p.id);
  if (validIds.length === 0) return;

  const block = storeBlockSchema.parse({ id: newId(), type: "featured_products", heading, productIds: validIds });
  const blocks = await loadBlocks(store.id);
  await saveBlocks(store.id, store.slug, [...blocks, block]);
}

export async function addCategoryBlockAction(formData: FormData) {
  const { store } = await requireSeller();
  const heading = String(formData.get("heading") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!heading || !categoryId) return;

  const block = storeBlockSchema.parse({ id: newId(), type: "category", heading, categoryId });
  const blocks = await loadBlocks(store.id);
  await saveBlocks(store.id, store.slug, [...blocks, block]);
}

// Testimoni digabung ke satu blok "testimonials" (maks 6 item) supaya tidak
// muncul sebagai banyak section terpisah dengan judul berulang.
export async function addTestimonialAction(formData: FormData) {
  const { store } = await requireSeller();
  const name = String(formData.get("name") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const ratingRaw = parseInt(String(formData.get("rating") ?? ""), 10);
  const rating = Number.isFinite(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : undefined;
  if (!name || !quote) return;

  const blocks = await loadBlocks(store.id);
  const existing = blocks.find(
    (b): b is Extract<StoreBlock, { type: "testimonials" }> => b.type === "testimonials"
  );
  if (existing) {
    if (existing.items.length >= 6) return;
    existing.items.push({ name, quote, rating });
    await saveBlocks(store.id, store.slug, blocks);
  } else {
    const block = storeBlockSchema.parse({
      id: newId(),
      type: "testimonials",
      heading: "Kata Pelanggan Kami",
      items: [{ name, quote, rating }],
    });
    await saveBlocks(store.id, store.slug, [...blocks, block]);
  }
}

export async function addTextBlockAction(formData: FormData) {
  const { store } = await requireSeller();
  const heading = String(formData.get("heading") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const block = storeBlockSchema.parse({ id: newId(), type: "text", body, ...(heading ? { heading } : {}) });
  const blocks = await loadBlocks(store.id);
  await saveBlocks(store.id, store.slug, [...blocks, block]);
}

export async function removeBlockAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const blocks = await loadBlocks(store.id);
  await saveBlocks(store.id, store.slug, blocks.filter((b) => b.id !== id));
}

export async function moveBlockAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const blocks = await loadBlocks(store.id);
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx === -1) return;
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= blocks.length) return;
  [blocks[idx], blocks[swapWith]] = [blocks[swapWith], blocks[idx]];
  await saveBlocks(store.id, store.slug, blocks);
}
