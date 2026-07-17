import { z } from "zod";

// Blok halaman Landing Page (funnel 1-produk, drag-n-drop, langsung checkout).
// Disimpan sebagai array JSON di LandingPage.blocks. Beda dari lib/storeBlocks.ts
// (itu untuk halaman toko multi-produk /s/[slug]) — blok di sini fokus konversi
// satu produk: tarik perhatian → yakinkan → bukti sosial → dorong beli sekarang.

export const heroBlockSchema = z.object({
  id: z.string(),
  type: z.literal("hero"),
  heading: z.string().min(1).max(100),
  subheading: z.string().max(200).optional(),
  imageUrl: z.string().min(1),
  ctaLabel: z.string().max(40).optional(),
});

// Info produk otomatis (nama/harga/rating/terjual) diambil dari produk yang diikat ke
// landing page ini — blok ini tak punya konfigurasi, cuma penanda posisi tampil.
export const productInfoBlockSchema = z.object({
  id: z.string(),
  type: z.literal("product_info"),
});

export const mediaTextBlockSchema = z.object({
  id: z.string(),
  type: z.literal("media_text"),
  heading: z.string().max(80).optional(),
  body: z.string().min(1).max(1000),
  imageUrl: z.string().min(1),
  imagePosition: z.enum(["left", "right"]).default("left"),
});

export const benefitsBlockSchema = z.object({
  id: z.string(),
  type: z.literal("benefits"),
  heading: z.string().min(1).max(80),
  items: z
    .array(z.object({ icon: z.string().min(1).max(4), text: z.string().min(1).max(120) }))
    .min(1)
    .max(8),
});

export const stepsBlockSchema = z.object({
  id: z.string(),
  type: z.literal("steps"),
  heading: z.string().min(1).max(80),
  items: z
    .array(z.object({ title: z.string().min(1).max(60), desc: z.string().max(160).optional() }))
    .min(1)
    .max(6),
});

export const trustBadgesBlockSchema = z.object({
  id: z.string(),
  type: z.literal("trust_badges"),
  items: z.array(z.string().min(1).max(40)).min(1).max(6),
});

export const countdownBlockSchema = z.object({
  id: z.string(),
  type: z.literal("countdown"),
  heading: z.string().max(80).optional(),
  endAt: z.string().min(1), // ISO datetime
  expiredText: z.string().max(100).optional(),
});

export const dividerBlockSchema = z.object({
  id: z.string(),
  type: z.literal("divider"),
});

export const textBlockSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  heading: z.string().max(80).optional(),
  body: z.string().min(1).max(1000),
});

export const faqBlockSchema = z.object({
  id: z.string(),
  type: z.literal("faq"),
  heading: z.string().min(1).max(80),
  items: z
    .array(z.object({ question: z.string().min(1).max(150), answer: z.string().min(1).max(500) }))
    .min(1)
    .max(10),
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

export const galleryBlockSchema = z.object({
  id: z.string(),
  type: z.literal("gallery"),
  heading: z.string().max(80).optional(),
  images: z.array(z.string().min(1)).min(1).max(10),
});

export const videoBlockSchema = z.object({
  id: z.string(),
  type: z.literal("video"),
  heading: z.string().max(80).optional(),
  videoUrl: z.string().min(1),
});

export const whatsappCtaBlockSchema = z.object({
  id: z.string(),
  type: z.literal("whatsapp_cta"),
  heading: z.string().max(80).optional(),
  buttonLabel: z.string().min(1).max(40),
  messageTemplate: z.string().max(300).optional(),
});

export const socialLinksBlockSchema = z.object({
  id: z.string(),
  type: z.literal("social_links"),
  items: z
    .array(z.object({ platform: z.enum(["instagram", "tiktok", "facebook", "youtube"]), url: z.string().min(1) }))
    .min(1)
    .max(4),
});

// Paket harga grosir diambil otomatis dari WholesaleTier produk — blok ini cuma judul opsional.
export const pricingPlansBlockSchema = z.object({
  id: z.string(),
  type: z.literal("pricing_plans"),
  heading: z.string().max(80).optional(),
});

// Blok inti/wajib: form order untuk produk utama landing page ini + add-on pilihan
// (subset dari ProductAddon yang sudah dikonfigurasi seller di produk tsb).
export const orderFormBlockSchema = z.object({
  id: z.string(),
  type: z.literal("order_form"),
  heading: z.string().max(80).optional(),
  addonIds: z.array(z.string()).default([]),
});

export const landingBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  productInfoBlockSchema,
  mediaTextBlockSchema,
  benefitsBlockSchema,
  stepsBlockSchema,
  trustBadgesBlockSchema,
  countdownBlockSchema,
  dividerBlockSchema,
  textBlockSchema,
  faqBlockSchema,
  testimonialsBlockSchema,
  galleryBlockSchema,
  videoBlockSchema,
  whatsappCtaBlockSchema,
  socialLinksBlockSchema,
  pricingPlansBlockSchema,
  orderFormBlockSchema,
]);

export const landingBlocksSchema = z.array(landingBlockSchema).max(40);

export type LandingBlock = z.infer<typeof landingBlockSchema>;
export type LandingBlockType = LandingBlock["type"];

export const BLOCK_LABELS: Record<LandingBlockType, string> = {
  hero: "Hero Banner",
  product_info: "Info Produk",
  media_text: "Media & Teks",
  benefits: "Daftar Keunggulan",
  steps: "Cara Pesan",
  trust_badges: "Badge Kepercayaan",
  countdown: "Countdown Timer",
  divider: "Pemisah",
  text: "Teks Bebas",
  faq: "FAQ",
  testimonials: "Testimoni",
  gallery: "Galeri Foto",
  video: "Video",
  whatsapp_cta: "Tombol WhatsApp",
  social_links: "Media Sosial",
  pricing_plans: "Paket Harga",
  order_form: "Form Order",
};

export const BLOCK_ICONS: Record<LandingBlockType, string> = {
  hero: "🖼️",
  product_info: "🏷️",
  media_text: "🖇️",
  benefits: "✅",
  steps: "🔢",
  trust_badges: "🛡️",
  countdown: "⏳",
  divider: "➖",
  text: "📝",
  faq: "❓",
  testimonials: "💬",
  gallery: "🌄",
  video: "🎬",
  whatsapp_cta: "💚",
  social_links: "🔗",
  pricing_plans: "💰",
  order_form: "🧾",
};

// Grup kategori untuk modal "Tambah Blok" (mirip picker Taplink) — urut sesuai alur funnel.
export const BLOCK_CATEGORIES: { label: string; types: LandingBlockType[] }[] = [
  { label: "Pembuka", types: ["hero", "product_info"] },
  { label: "Meyakinkan", types: ["media_text", "benefits", "steps", "trust_badges", "countdown", "text", "faq", "divider"] },
  { label: "Bukti Sosial", types: ["testimonials", "gallery", "video"] },
  { label: "Kontak & Harga", types: ["whatsapp_cta", "social_links", "pricing_plans"] },
  { label: "Konversi", types: ["order_form"] },
];

export function parseLandingBlocks(raw: unknown): LandingBlock[] {
  const result = landingBlocksSchema.safeParse(raw);
  return result.success ? result.data : [];
}
