import { z } from "zod";

// Blok kustom halaman toko (/s/[slug]). Disimpan sebagai array JSON di Store.layoutBlocks.
// Bila kosong/null, halaman toko tampil seperti biasa (cuma grid semua produk).

export const bannerBlockSchema = z.object({
  id: z.string(),
  type: z.literal("banner"),
  heading: z.string().min(1).max(80),
  subheading: z.string().max(160).optional(),
  imageUrl: z.string().min(1),
  linkUrl: z.string().max(300).optional(),
});

export const featuredProductsBlockSchema = z.object({
  id: z.string(),
  type: z.literal("featured_products"),
  heading: z.string().min(1).max(80),
  productIds: z.array(z.string()).min(1).max(12),
});

export const categoryBlockSchema = z.object({
  id: z.string(),
  type: z.literal("category"),
  heading: z.string().min(1).max(80),
  categoryId: z.string().min(1),
});

export const testimonialsBlockSchema = z.object({
  id: z.string(),
  type: z.literal("testimonials"),
  heading: z.string().min(1).max(80),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        quote: z.string().min(1).max(300),
        rating: z.number().int().min(1).max(5).optional(),
      })
    )
    .min(1)
    .max(6),
});

export const textBlockSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  heading: z.string().max(80).optional(),
  body: z.string().min(1).max(1000),
});

export const storeBlockSchema = z.discriminatedUnion("type", [
  bannerBlockSchema,
  featuredProductsBlockSchema,
  categoryBlockSchema,
  testimonialsBlockSchema,
  textBlockSchema,
]);

export const storeBlocksSchema = z.array(storeBlockSchema).max(20);

export type StoreBlock = z.infer<typeof storeBlockSchema>;

export const BLOCK_LABELS: Record<StoreBlock["type"], string> = {
  banner: "Banner Promo",
  featured_products: "Produk Pilihan",
  category: "Kategori Produk",
  testimonials: "Testimoni",
  text: "Teks Bebas",
};

// Parse aman dari Prisma Json (unknown) — kembalikan array kosong bila rusak/tidak valid,
// supaya halaman toko tak pernah gagal render gara-gara data blok yang cacat.
export function parseStoreBlocks(raw: unknown): StoreBlock[] {
  const result = storeBlocksSchema.safeParse(raw);
  return result.success ? result.data : [];
}
