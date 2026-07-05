"use client";

import { useActionState, useState } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/products";

type Category = { id: string; name: string };
type Variant = { name: string; price: number; stock: number | null };
type Tier = { minQty: number; price: number };
type Product = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price: number;
  stock: number | null;
  weightGrams: number | null;
  imageUrl: string | null;
  categoryId: string | null;
  active: boolean;
  affiliatePct: number;
  salePrice: number | null;
  digitalAsset: { fileName: string } | null;
  variants: Variant[];
  wholesaleTiers: Tier[];
  images: { url: string }[];
};

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload?kind=image", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload gambar gagal");
  return json.url as string;
}

export default function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product;
}) {
  const isEdit = Boolean(product);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateProductAction : createProductAction,
    {}
  );
  const [type, setType] = useState(product?.type ?? "PHYSICAL");
  const [uploading, setUploading] = useState(false);
  const [digitalFile, setDigitalFile] = useState<{ filePath: string; fileName: string } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [coverUrl, setCoverUrl] = useState(product?.imageUrl ?? "");
  const [extraImages, setExtraImages] = useState<string[]>(product?.images.map((i) => i.url) ?? []);
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? []);
  const [tiers, setTiers] = useState<Tier[]>(product?.wholesaleTiers ?? []);

  async function handleDigitalUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload gagal");
      setDigitalFile(json);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      setCoverUrl(await uploadImage(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  async function handleExtraUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - extraImages.length);
    if (!files.length) return;
    setUploading(true);
    setUploadError("");
    try {
      const urls: string[] = [];
      for (const f of files) urls.push(await uploadImage(f));
      setExtraImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm";

  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6">
      {isEdit && <input type="hidden" name="id" value={product!.id} />}
      <input type="hidden" name="imageUrl" value={coverUrl} />
      <input type="hidden" name="imagesJson" value={JSON.stringify(extraImages)} />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants.filter((v) => v.name.trim()))} />
      <input type="hidden" name="tiersJson" value={JSON.stringify(tiers.filter((t) => t.minQty >= 2 && t.price > 0))} />

      <div>
        <label className="text-sm font-medium block mb-1">Nama produk</label>
        <input type="text" name="name" required defaultValue={product?.name} className={inputCls} />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Deskripsi</label>
        <textarea name="description" rows={4} defaultValue={product?.description ?? ""} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Tipe produk</label>
          {isEdit ? (
            <>
              <input type="hidden" name="type" value={product!.type} />
              <p className="text-sm px-3 py-2 bg-slate-100 rounded-lg">
                {product!.type === "DIGITAL" ? "Digital" : "Fisik"} (tidak bisa diubah)
              </p>
            </>
          ) : (
            <select name="type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option value="PHYSICAL">Fisik (dikirim kurir)</option>
              <option value="DIGITAL">Digital (file download)</option>
            </select>
          )}
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Harga dasar (Rp)</label>
          <input type="number" name="price" required min={500} defaultValue={product?.price} className={inputCls} />
        </div>
      </div>

      {type === "PHYSICAL" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Stok {variants.length > 0 && "(dipakai jika tanpa varian)"}</label>
            <input type="number" name="stock" min={0} defaultValue={product?.stock ?? 0} className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Berat (gram)</label>
            <input type="number" name="weightGrams" min={1} defaultValue={product?.weightGrams ?? 500} className={inputCls} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
        <div>
          <label className="text-sm font-medium block mb-1">💥 Harga flash sale (Rp)</label>
          <input type="number" name="salePrice" min={0} defaultValue={product?.salePrice ?? ""} placeholder="Kosongkan jika tidak ada" className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Durasi flash sale (hari)</label>
          <input type="number" name="saleDays" min={0} max={90} defaultValue={7} placeholder="mis. 7" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium block mb-1">🤝 Komisi afiliasi (%)</label>
          <input type="number" name="affiliatePct" min={0} max={50} defaultValue={product?.affiliatePct ?? 0} className={inputCls} />
          <p className="text-xs text-slate-400 mt-1">Komisi untuk orang yang mereferensikan produk ini (0 = nonaktif). Diambil dari bagianmu.</p>
        </div>
      </div>

      {type === "DIGITAL" && (
        <div>
          <label className="text-sm font-medium block mb-1">File produk digital</label>
          {product?.digitalAsset && !digitalFile && (
            <p className="text-xs text-slate-500 mb-2">
              File saat ini: <b>{product.digitalAsset.fileName}</b> (upload baru untuk mengganti)
            </p>
          )}
          <input type="file" onChange={handleDigitalUpload} className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-3" />
          {digitalFile && <p className="text-xs text-emerald-600 mt-1">✓ {digitalFile.fileName} terunggah</p>}
          <input type="hidden" name="digitalFilePath" value={digitalFile?.filePath ?? ""} />
          <input type="hidden" name="digitalFileName" value={digitalFile?.fileName ?? ""} />
        </div>
      )}

      {/* Foto produk */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Foto utama</label>
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="cover" className="w-24 h-24 object-cover rounded-lg border mb-2" />
          )}
          <input type="file" accept="image/*" onChange={handleCoverUpload} className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Foto tambahan (maks 5)</label>
          {extraImages.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {extraImages.map((url, i) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`foto ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setExtraImages(extraImages.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input type="file" accept="image/*" multiple onChange={handleExtraUpload} className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Kategori</label>
        <select name="categoryId" defaultValue={product?.categoryId ?? ""} className={inputCls}>
          <option value="">— Tanpa kategori —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Varian */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold">Varian (opsional)</label>
          <button
            type="button"
            onClick={() => setVariants([...variants, { name: "", price: product?.price ?? 0, stock: 0 }])}
            className="text-teal-600 text-sm font-semibold"
          >
            + Tambah varian
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-2">Contoh: &quot;Merah / XL&quot;. Jika ada varian, pembeli wajib memilih dan harga varian yang berlaku.</p>
        {variants.map((v, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              type="text" placeholder="Nama varian" value={v.name}
              onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number" placeholder="Harga" min={500} value={v.price || ""}
              onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, price: parseInt(e.target.value, 10) || 0 } : x)))}
              className="w-28 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            {type === "PHYSICAL" && (
              <input
                type="number" placeholder="Stok" min={0} value={v.stock ?? ""}
                onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, stock: parseInt(e.target.value, 10) || 0 } : x)))}
                className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            )}
            <button type="button" onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="text-red-500 px-2">×</button>
          </div>
        ))}
      </div>

      {/* Harga grosir */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold">Harga grosir (opsional)</label>
          <button
            type="button"
            onClick={() => setTiers([...tiers, { minQty: 10, price: product?.price ?? 0 }])}
            className="text-teal-600 text-sm font-semibold"
          >
            + Tambah tier
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-2">Beli ≥ jumlah minimum, harga satuan otomatis turun. Berlaku untuk produk tanpa pilihan varian.</p>
        {tiers.map((t, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <span className="text-sm text-slate-500">Beli ≥</span>
            <input
              type="number" min={2} value={t.minQty || ""}
              onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, minQty: parseInt(e.target.value, 10) || 0 } : x)))}
              className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-sm text-slate-500">harga satuan Rp</span>
            <input
              type="number" min={1} value={t.price || ""}
              onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, price: parseInt(e.target.value, 10) || 0 } : x)))}
              className="w-28 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="text-red-500 px-2">×</button>
          </div>
        ))}
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={product!.active} />
          Produk aktif (tampil di marketplace)
        </label>
      )}

      {uploading && <p className="text-xs text-slate-500">Mengunggah...</p>}
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      {state.error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>}

      <button
        disabled={pending || uploading}
        className="bg-teal-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
      </button>
    </form>
  );
}
