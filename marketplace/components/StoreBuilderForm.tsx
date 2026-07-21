"use client";

import { useState } from "react";
import {
  addBannerBlockAction,
  addFeaturedProductsBlockAction,
  addCategoryBlockAction,
  addTestimonialAction,
  addTextBlockAction,
  removeBlockAction,
  moveBlockAction,
} from "@/app/actions/storeBuilder";
import { BLOCK_LABELS, type StoreBlock } from "@/lib/storeBlocks";

type Product = { id: string; name: string };
type Category = { id: string; name: string };

const BLOCK_ICONS: Record<StoreBlock["type"], string> = {
  banner: "🖼️",
  featured_products: "⭐",
  category: "🗂️",
  testimonials: "💬",
  text: "📝",
};

function blockSummary(b: StoreBlock, categories: Category[]): string {
  switch (b.type) {
    case "banner":
      return b.heading;
    case "featured_products":
      return `${b.heading} — ${b.productIds.length} produk`;
    case "category":
      return `${b.heading} — ${categories.find((c) => c.id === b.categoryId)?.name ?? "kategori dihapus"}`;
    case "testimonials":
      return `${b.heading} — ${b.items.length} testimoni`;
    case "text":
      return b.heading || "Teks bebas";
  }
}

function ExistingBlocks({ blocks, categories }: { blocks: StoreBlock[]; categories: Category[] }) {
  if (blocks.length === 0) {
    return (
      <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">
        Belum ada blok kustom. Halaman tokomu masih tampil default (cuma grid semua produk).
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => (
        <div key={b.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
          <span className="text-xl">{BLOCK_ICONS[b.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400">{BLOCK_LABELS[b.type]}</p>
            <p className="text-sm font-semibold truncate">{blockSummary(b, categories)}</p>
          </div>
          <form action={moveBlockAction}>
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="direction" value="up" />
            <button disabled={i === 0} className="text-slate-500 hover:text-teal-600 disabled:opacity-25 px-1">↑</button>
          </form>
          <form action={moveBlockAction}>
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="direction" value="down" />
            <button disabled={i === blocks.length - 1} className="text-slate-500 hover:text-teal-600 disabled:opacity-25 px-1">↓</button>
          </form>
          <form action={removeBlockAction}>
            <input type="hidden" name="id" value={b.id} />
            <button className="text-red-500 hover:text-red-700 px-1" title="Hapus">×</button>
          </form>
        </div>
      ))}
    </div>
  );
}

async function uploadImage(e: React.ChangeEvent<HTMLInputElement>, set: (u: string) => void, setUploading: (b: boolean) => void) {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading(true);
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload?kind=image", { method: "POST", body: fd });
    const json = await res.json();
    if (res.ok) set(json.url);
  } finally {
    setUploading(false);
  }
}

function BannerForm() {
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  return (
    <form action={addBannerBlockAction} className="space-y-3">
      <input name="heading" required placeholder="Judul (mis. Diskon 12.12!)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <input name="subheading" placeholder="Sub-judul (opsional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <input type="file" accept="image/*" onChange={(e) => uploadImage(e, setImageUrl, setUploading)} className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2" />
      {imageUrl && <p className="text-xs text-teal-600">Gambar terunggah ✓</p>}
      <input name="linkUrl" placeholder="Link tujuan saat banner diklik (opsional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <button disabled={uploading || !imageUrl} className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-700 disabled:opacity-50">
        Tambah Banner
      </button>
    </form>
  );
}

function FeaturedProductsForm({ products }: { products: Product[] }) {
  return (
    <form action={addFeaturedProductsBlockAction} className="space-y-3">
      <input name="heading" required placeholder="Judul section (mis. Produk Andalan)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-1">
        {products.length === 0 && <p className="text-sm text-slate-400">Belum ada produk aktif.</p>}
        {products.map((p) => (
          <label key={p.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="productIds" value={p.id} />
            {p.name}
          </label>
        ))}
      </div>
      <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-700">
        Tambah Produk Pilihan
      </button>
    </form>
  );
}

function CategoryForm({ categories }: { categories: Category[] }) {
  return (
    <form action={addCategoryBlockAction} className="space-y-3">
      <input name="heading" required placeholder="Judul section (mis. Best Seller)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <select name="categoryId" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
        <option value="">Pilih kategori</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-700">
        Tambah Kategori
      </button>
    </form>
  );
}

function TestimonialForm() {
  return (
    <form action={addTestimonialAction} className="space-y-3">
      <input name="name" required placeholder="Nama pelanggan" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <textarea name="quote" required rows={3} placeholder="Kutipan testimoni" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <select name="rating" defaultValue="5" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>{"⭐".repeat(n)}</option>
        ))}
      </select>
      <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-700">
        Tambah Testimoni
      </button>
      <p className="text-xs text-slate-400">Maks. 6 testimoni digabung dalam satu section.</p>
    </form>
  );
}

function TextForm() {
  return (
    <form action={addTextBlockAction} className="space-y-3">
      <input name="heading" placeholder="Judul (opsional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <textarea name="body" required rows={4} placeholder="Isi teks (cerita toko, kebijakan, dll)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-700">
        Tambah Teks
      </button>
    </form>
  );
}

const TABS: { key: StoreBlock["type"]; label: string }[] = [
  { key: "banner", label: "Banner Promo" },
  { key: "featured_products", label: "Produk Pilihan" },
  { key: "category", label: "Kategori" },
  { key: "testimonials", label: "Testimoni" },
  { key: "text", label: "Teks Bebas" },
];

export default function StoreBuilderForm({
  blocks,
  products,
  categories,
}: {
  blocks: StoreBlock[];
  products: Product[];
  categories: Category[];
}) {
  const [tab, setTab] = useState<StoreBlock["type"]>("banner");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-bold mb-3">Blok Saat Ini (urutan tampil di halaman toko)</h2>
        <ExistingBlocks blocks={blocks} categories={categories} />
      </div>

      <div>
        <h2 className="font-bold mb-3">Tambah Blok Baru</h2>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                tab === t.key ? "bg-white shadow text-teal-700" : "text-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          {tab === "banner" && <BannerForm />}
          {tab === "featured_products" && <FeaturedProductsForm products={products} />}
          {tab === "category" && <CategoryForm categories={categories} />}
          {tab === "testimonials" && <TestimonialForm />}
          {tab === "text" && <TextForm />}
        </div>
      </div>
    </div>
  );
}
