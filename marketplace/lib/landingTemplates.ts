import { randomBytes } from "crypto";
import type { LandingBlock, LandingBlockType } from "./landingBlocks";

function newId(): string {
  return randomBytes(6).toString("hex");
}

// Preset layout supaya seller yang awam desain tak mulai dari kanvas kosong.
export const LANDING_TEMPLATES = {
  blank: { label: "Kosong", types: [] as LandingBlockType[] },
  diskon_kilat: {
    label: "Diskon Kilat",
    types: ["hero", "countdown", "benefits", "trust_badges", "order_form"] as LandingBlockType[],
  },
  testimoni_berat: {
    label: "Testimoni Berat",
    types: ["hero", "product_info", "testimonials", "gallery", "faq", "order_form"] as LandingBlockType[],
  },
} as const;

export type LandingTemplateKey = keyof typeof LANDING_TEMPLATES;

// Isi default tiap tipe blok saat ditambahkan lewat template (placeholder, seller edit sendiri nanti).
function placeholderBlock(type: LandingBlockType): LandingBlock {
  const id = newId();
  switch (type) {
    case "hero":
      return { id, type, heading: "Judul Menarik Produkmu di Sini", subheading: "Sub-judul singkat yang meyakinkan", imageUrl: "", ctaLabel: "Lihat Penawaran" };
    case "product_info":
      return { id, type };
    case "countdown":
      return { id, type, heading: "Promo berakhir dalam:", endAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
    case "benefits":
      return { id, type, heading: "Kenapa Pilih Produk Ini?", items: [{ icon: "✅", text: "Keunggulan pertama" }] };
    case "trust_badges":
      return { id, type, items: ["100% Original", "COD Tersedia", "Garansi Uang Kembali"] };
    case "testimonials":
      return { id, type, heading: "Kata Pelanggan Kami", items: [{ name: "Pelanggan", quote: "Produknya bagus banget!", rating: 5 }] };
    case "gallery":
      return { id, type, images: [] };
    case "faq":
      return { id, type, heading: "Pertanyaan Umum", items: [{ question: "Apakah bisa COD?", answer: "Bisa, tersedia bayar di tempat." }] };
    case "order_form":
      return { id, type, heading: "Pesan Sekarang", addonIds: [] };
    case "media_text":
      return { id, type, body: "Ceritakan detail produkmu di sini.", imageUrl: "", imagePosition: "left" };
    case "steps":
      return { id, type, heading: "Cara Pesan", items: [{ title: "Isi form di bawah" }, { title: "Konfirmasi via WhatsApp" }, { title: "Barang dikirim" }] };
    case "text":
      return { id, type, body: "Tulis teks bebas di sini." };
    case "video":
      return { id, type, videoUrl: "" };
    case "whatsapp_cta":
      return { id, type, buttonLabel: "Chat Admin via WhatsApp" };
    case "social_links":
      return { id, type, items: [{ platform: "instagram", url: "" }] };
    case "pricing_plans":
      return { id, type };
    case "divider":
      return { id, type };
  }
}

export function buildTemplateBlocks(key: LandingTemplateKey): LandingBlock[] {
  const template = LANDING_TEMPLATES[key];
  if (!template) return [];
  return template.types.map(placeholderBlock);
}
