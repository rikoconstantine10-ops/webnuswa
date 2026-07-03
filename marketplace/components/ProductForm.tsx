"use client";

import { useActionState, useState } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/products";

type Category = { id: string; name: string };
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
  digitalAsset: { fileName: string } | null;
};

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6">
      {isEdit && <input type="hidden" name="id" value={product!.id} />}

      <div>
        <label className="text-sm font-medium block mb-1">Nama produk</label>
        <input
          type="text"
          name="name"
          required
          defaultValue={product?.name}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Deskripsi</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
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
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="PHYSICAL">Fisik (dikirim kurir)</option>
              <option value="DIGITAL">Digital (file download)</option>
            </select>
          )}
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Harga (Rp)</label>
          <input
            type="number"
            name="price"
            required
            min={500}
            defaultValue={product?.price}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {type === "PHYSICAL" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Stok</label>
            <input
              type="number"
              name="stock"
              min={0}
              defaultValue={product?.stock ?? 0}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Berat (gram)</label>
            <input
              type="number"
              name="weightGrams"
              min={1}
              defaultValue={product?.weightGrams ?? 500}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {type === "DIGITAL" && (
        <div>
          <label className="text-sm font-medium block mb-1">File produk digital</label>
          {product?.digitalAsset && !digitalFile && (
            <p className="text-xs text-slate-500 mb-2">
              File saat ini: <b>{product.digitalAsset.fileName}</b> (upload baru untuk mengganti)
            </p>
          )}
          <input
            type="file"
            onChange={handleFileUpload}
            className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-3"
          />
          {uploading && <p className="text-xs text-slate-500 mt-1">Mengunggah...</p>}
          {digitalFile && (
            <p className="text-xs text-emerald-600 mt-1">✓ {digitalFile.fileName} terunggah</p>
          )}
          {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
          <input type="hidden" name="digitalFilePath" value={digitalFile?.filePath ?? ""} />
          <input type="hidden" name="digitalFileName" value={digitalFile?.fileName ?? ""} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">URL Gambar (opsional)</label>
          <input
            type="url"
            name="imageUrl"
            defaultValue={product?.imageUrl ?? ""}
            placeholder="https://..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Kategori</label>
          <select
            name="categoryId"
            defaultValue={product?.categoryId ?? ""}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— Tanpa kategori —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={product!.active} />
          Produk aktif (tampil di marketplace)
        </label>
      )}

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        disabled={pending || uploading}
        className="bg-teal-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
      </button>
    </form>
  );
}
