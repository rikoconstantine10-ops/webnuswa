"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { slugify, randomSuffix } from "@/lib/slug";
import { findProhibited } from "@/lib/trust";

const variantSchema = z.array(
  z.object({ name: z.string().min(1), price: z.coerce.number().int().min(500), stock: z.coerce.number().int().min(0).nullable().optional() })
).max(30);

const tierSchema = z.array(
  z.object({ minQty: z.coerce.number().int().min(2), price: z.coerce.number().int().min(1) })
).max(10);

const imagesSchema = z.array(z.string().min(1)).max(5);

const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(["DIGITAL", "PHYSICAL"]),
  price: z.coerce.number().int().min(500),
  stock: z.coerce.number().int().min(0).optional(),
  weightGrams: z.coerce.number().int().min(1).optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().optional(),
  digitalFilePath: z.string().optional(),
  digitalFileName: z.string().optional(),
  affiliatePct: z.coerce.number().int().min(0).max(50).optional(),
  salePrice: z.coerce.number().int().min(0).optional(),
  saleDays: z.coerce.number().int().min(0).max(90).optional(),
});

function parseJson<T>(raw: FormDataEntryValue | null, schema: z.ZodType<T>, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(String(raw)));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

function parseProductForm(formData: FormData) {
  return {
    base: productSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      type: formData.get("type"),
      price: formData.get("price"),
      stock: formData.get("stock") || undefined,
      weightGrams: formData.get("weightGrams") || undefined,
      imageUrl: formData.get("imageUrl") || "",
      categoryId: formData.get("categoryId") || undefined,
      digitalFilePath: formData.get("digitalFilePath") || undefined,
      digitalFileName: formData.get("digitalFileName") || undefined,
      affiliatePct: formData.get("affiliatePct") || undefined,
      salePrice: formData.get("salePrice") || undefined,
      saleDays: formData.get("saleDays") || undefined,
    }),
    variants: parseJson(formData.get("variantsJson"), variantSchema, []),
    tiers: parseJson(formData.get("tiersJson"), tierSchema, []),
    images: parseJson(formData.get("imagesJson"), imagesSchema, []),
  };
}

export async function createProductAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const { store } = await requireSeller();
  const { base, variants, tiers, images } = parseProductForm(formData);
  if (!base.success) return { error: "Data produk tidak valid: " + base.error.issues[0].message };
  const input = base.data;

  if (input.type === "DIGITAL" && !input.digitalFilePath) {
    return { error: "Produk digital wajib mengunggah file" };
  }

  // Filter kata terlarang: produk yang cocok ditahan (PENDING) untuk ditinjau admin.
  const prohibited = await findProhibited(`${input.name} ${input.description ?? ""}`);
  const moderation = prohibited ? "PENDING" : "APPROVED";

  let slug = slugify(input.name);
  if (await db.product.findUnique({ where: { slug } })) {
    slug = `${slug}-${randomSuffix()}`;
  }

  const createdProduct = await db.product.create({
    data: {
      storeId: store.id,
      name: input.name,
      slug,
      moderation,
      description: input.description || null,
      type: input.type,
      price: input.price,
      stock: input.type === "PHYSICAL" ? input.stock ?? 0 : null,
      weightGrams: input.type === "PHYSICAL" ? input.weightGrams ?? null : null,
      imageUrl: input.imageUrl || null,
      categoryId: input.categoryId || null,
      affiliatePct: input.affiliatePct ?? 0,
      salePrice: input.salePrice && input.salePrice > 0 ? input.salePrice : null,
      saleEndsAt: input.salePrice && input.salePrice > 0 && input.saleDays ? new Date(Date.now() + input.saleDays * 86400000) : null,
      digitalAsset:
        input.type === "DIGITAL" && input.digitalFilePath
          ? { create: { filePath: input.digitalFilePath, fileName: input.digitalFileName || "file" } }
          : undefined,
      variants: { create: variants.map((v) => ({ name: v.name, price: v.price, stock: input.type === "PHYSICAL" ? (v.stock ?? 0) : null })) },
      wholesaleTiers: { create: tiers.map((t) => ({ minQty: t.minQty, price: t.price })) },
      images: { create: images.map((url, i) => ({ url, sort: i })) },
    },
  });

  // Produk ber-kata-terlarang → masuk antrian tinjauan admin.
  if (prohibited) {
    await db.productReport.create({
      data: {
        productId: createdProduct.id,
        storeId: store.id,
        reason: "PROHIBITED",
        detail: `Auto-flag: kata "${prohibited}" terdeteksi`,
      },
    });
  }

  revalidatePath("/dashboard/products");
  redirect(prohibited ? "/dashboard/products?review=1" : "/dashboard/products");
}

export async function updateProductAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const { store } = await requireSeller();
  const id = String(formData.get("id"));
  const product = await db.product.findFirst({ where: { id, storeId: store.id } });
  if (!product) return { error: "Produk tidak ditemukan" };

  const { base, variants, tiers, images } = parseProductForm(formData);
  if (!base.success) return { error: "Data produk tidak valid: " + base.error.issues[0].message };
  const input = base.data;

  await db.$transaction([
    db.product.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description || null,
        price: input.price,
        stock: product.type === "PHYSICAL" ? input.stock ?? product.stock : null,
        weightGrams: product.type === "PHYSICAL" ? input.weightGrams ?? null : null,
        affiliatePct: input.affiliatePct ?? 0,
        salePrice: input.salePrice && input.salePrice > 0 ? input.salePrice : null,
        saleEndsAt: input.salePrice && input.salePrice > 0 && input.saleDays ? new Date(Date.now() + input.saleDays * 86400000) : null,
        imageUrl: input.imageUrl || null,
        categoryId: input.categoryId || null,
        active: formData.get("active") === "on",
      },
    }),
    db.productVariant.deleteMany({ where: { productId: id } }),
    db.productVariant.createMany({
      data: variants.map((v) => ({ productId: id, name: v.name, price: v.price, stock: product.type === "PHYSICAL" ? (v.stock ?? 0) : null })),
    }),
    db.wholesaleTier.deleteMany({ where: { productId: id } }),
    db.wholesaleTier.createMany({ data: tiers.map((t) => ({ productId: id, minQty: t.minQty, price: t.price })) }),
    db.productImage.deleteMany({ where: { productId: id } }),
    db.productImage.createMany({ data: images.map((url, i) => ({ productId: id, url, sort: i })) }),
  ]);

  if (product.type === "DIGITAL" && input.digitalFilePath) {
    await db.digitalAsset.upsert({
      where: { productId: id },
      create: { productId: id, filePath: input.digitalFilePath, fileName: input.digitalFileName || "file" },
      update: { filePath: input.digitalFilePath, fileName: input.digitalFileName || "file" },
    });
  }

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function deleteProductAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id"));
  const product = await db.product.findFirst({
    where: { id, storeId: store.id },
    include: { orderItems: { select: { id: true }, take: 1 } },
  });
  if (!product) return;

  if (product.orderItems.length > 0) {
    // Sudah pernah terjual: nonaktifkan saja agar riwayat order tetap utuh.
    await db.product.update({ where: { id }, data: { active: false } });
  } else {
    await db.product.delete({ where: { id } });
  }
  revalidatePath("/dashboard/products");
}

export async function saveAddonsAction(formData: FormData): Promise<void> {
  const { store } = await requireSeller();
  const productId = String(formData.get("productId"));
  const product = await db.product.findFirst({ where: { id: productId, storeId: store.id } });
  if (!product) return;

  // Format: addonsJson = [{ addonProductId, addonPrice }]
  const parsed = z
    .array(z.object({ addonProductId: z.string().min(1), addonPrice: z.coerce.number().int().min(0) }))
    .max(10)
    .safeParse(JSON.parse(String(formData.get("addonsJson") || "[]")));
  if (!parsed.success) return;

  // Hanya boleh menawarkan add-on dari produk milik toko sendiri, bukan produk itu sendiri.
  const owned = await db.product.findMany({
    where: { storeId: store.id, id: { in: parsed.data.map((a) => a.addonProductId) } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((o) => o.id));
  const valid = parsed.data.filter((a) => ownedIds.has(a.addonProductId) && a.addonProductId !== productId);

  await db.$transaction([
    db.productAddon.deleteMany({ where: { productId } }),
    db.productAddon.createMany({
      data: valid.map((a) => ({ productId, addonProductId: a.addonProductId, addonPrice: a.addonPrice })),
    }),
  ]);
  revalidatePath(`/dashboard/products/${productId}/addons`);
}

export async function duplicateProductAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id"));
  const product = await db.product.findFirst({
    where: { id, storeId: store.id },
    include: { variants: true, wholesaleTiers: true, images: true, digitalAsset: true },
  });
  if (!product) return;

  const name = `${product.name} (salinan)`;
  await db.product.create({
    data: {
      storeId: store.id,
      name,
      slug: `${slugify(name)}-${randomSuffix()}`,
      description: product.description,
      type: product.type,
      price: product.price,
      stock: product.stock,
      weightGrams: product.weightGrams,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      active: false, // salinan mulai nonaktif agar bisa diedit dulu
      digitalAsset: product.digitalAsset
        ? { create: { filePath: product.digitalAsset.filePath, fileName: product.digitalAsset.fileName, maxDownloads: product.digitalAsset.maxDownloads } }
        : undefined,
      variants: { create: product.variants.map((v) => ({ name: v.name, price: v.price, stock: v.stock })) },
      wholesaleTiers: { create: product.wholesaleTiers.map((t) => ({ minQty: t.minQty, price: t.price })) },
      images: { create: product.images.map((im) => ({ url: im.url, sort: im.sort })) },
    },
  });
  revalidatePath("/dashboard/products");
}
