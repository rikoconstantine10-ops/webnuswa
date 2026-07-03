"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { slugify, randomSuffix } from "@/lib/slug";

const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(["DIGITAL", "PHYSICAL"]),
  price: z.coerce.number().int().min(500),
  stock: z.coerce.number().int().min(0).optional(),
  weightGrams: z.coerce.number().int().min(1).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional(),
  digitalFilePath: z.string().optional(),
  digitalFileName: z.string().optional(),
});

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
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
  });
}

export async function createProductAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const { store } = await requireSeller();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: "Data produk tidak valid: " + parsed.error.issues[0].message };
  const input = parsed.data;

  if (input.type === "DIGITAL" && !input.digitalFilePath) {
    return { error: "Produk digital wajib mengunggah file" };
  }

  let slug = slugify(input.name);
  if (await db.product.findUnique({ where: { slug } })) {
    slug = `${slug}-${randomSuffix()}`;
  }

  await db.product.create({
    data: {
      storeId: store.id,
      name: input.name,
      slug,
      description: input.description || null,
      type: input.type,
      price: input.price,
      stock: input.type === "PHYSICAL" ? input.stock ?? 0 : null,
      weightGrams: input.type === "PHYSICAL" ? input.weightGrams ?? null : null,
      imageUrl: input.imageUrl || null,
      categoryId: input.categoryId || null,
      digitalAsset:
        input.type === "DIGITAL" && input.digitalFilePath
          ? {
              create: {
                filePath: input.digitalFilePath,
                fileName: input.digitalFileName || "file",
              },
            }
          : undefined,
    },
  });

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProductAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const { store } = await requireSeller();
  const id = String(formData.get("id"));
  const product = await db.product.findFirst({ where: { id, storeId: store.id } });
  if (!product) return { error: "Produk tidak ditemukan" };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: "Data produk tidak valid: " + parsed.error.issues[0].message };
  const input = parsed.data;

  await db.product.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description || null,
      price: input.price,
      stock: product.type === "PHYSICAL" ? input.stock ?? product.stock : null,
      weightGrams: product.type === "PHYSICAL" ? input.weightGrams ?? null : null,
      imageUrl: input.imageUrl || null,
      categoryId: input.categoryId || null,
      active: formData.get("active") === "on",
    },
  });

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
