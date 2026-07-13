"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateProductImage, generateCaptions, checkAiQuota, kieAiEnabled } from "@/lib/kieai";

export async function generateProductImagesAction(
  _prev: { urls?: string[]; error?: string },
  formData: FormData
): Promise<{ urls?: string[]; error?: string }> {
  const { store } = await requireSeller();
  if (!(await kieAiEnabled())) return { error: "Fitur AI belum diaktifkan admin" };

  const quota = await checkAiQuota(store.id);
  if (!quota.ok) {
    return { error: `Kuota generate AI bulan ini habis (${quota.used}/${quota.limit}). Upgrade ke Pro untuk kuota lebih besar.` };
  }

  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const productName = String(formData.get("productName") ?? "produk").trim() || "produk";
  if (!imageUrl) return { error: "Upload foto dulu" };

  const prompt = `Transform this raw smartphone photo of a product called "${productName}" into a clean, professional e-commerce product photo. Keep the product itself unchanged (same shape, color, details, proportions), but place it on a clean studio background with soft even lighting, centered composition, no clutter, no watermark, no added text.`;

  const results = await Promise.all([
    generateProductImage({ imageUrl, prompt }),
    generateProductImage({ imageUrl, prompt: `${prompt} Use a subtle light gray background.` }),
    generateProductImage({ imageUrl, prompt: `${prompt} Use a soft white gradient background with a gentle shadow beneath the product.` }),
  ]);

  const urls = results.flatMap((r) => (r.ok && r.urls ? r.urls : []));
  if (urls.length === 0) {
    return { error: results.find((r) => r.error)?.error || "Gagal generate foto" };
  }

  await db.aiGeneration.create({ data: { storeId: store.id, type: "IMAGE" } });
  return { urls };
}

export async function generateCaptionsAction(
  _prev: { captions?: string[]; error?: string },
  formData: FormData
): Promise<{ captions?: string[]; error?: string }> {
  const { store } = await requireSeller();
  if (!(await kieAiEnabled())) return { error: "Fitur AI belum diaktifkan admin" };

  const quota = await checkAiQuota(store.id);
  if (!quota.ok) {
    return { error: `Kuota generate AI bulan ini habis (${quota.used}/${quota.limit}). Upgrade ke Pro untuk kuota lebih besar.` };
  }

  const productName = String(formData.get("productName") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || undefined;
  if (!productName) return { error: "Isi nama produk dulu" };

  const result = await generateCaptions({ productName, imageUrl });
  if (!result.ok) return { error: result.error };

  await db.aiGeneration.create({ data: { storeId: store.id, type: "CAPTION" } });
  return { captions: result.captions };
}

// Simpan hasil generate langsung ke produk terpilih — dipakai dari halaman AI Studio
// yang berdiri sendiri (bukan di dalam form produk).
export async function addProductImageAction(formData: FormData): Promise<void> {
  const { store } = await requireSeller();
  const productId = String(formData.get("productId") ?? "");
  const url = String(formData.get("url") ?? "");
  if (!productId || !url) return;

  const product = await db.product.findFirst({ where: { id: productId, storeId: store.id } });
  if (!product) return;

  const count = await db.productImage.count({ where: { productId } });
  if (count >= 5) return;

  await db.productImage.create({ data: { productId, url, sort: count } });
  revalidatePath(`/dashboard/products/${productId}/edit`);
}

export async function setProductDescriptionAction(formData: FormData): Promise<void> {
  const { store } = await requireSeller();
  const productId = String(formData.get("productId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!productId || !description) return;

  const product = await db.product.findFirst({ where: { id: productId, storeId: store.id } });
  if (!product) return;

  await db.product.update({ where: { id: productId }, data: { description } });
  revalidatePath(`/dashboard/products/${productId}/edit`);
}
