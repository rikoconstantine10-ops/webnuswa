"use client";

import { useActionState, useState } from "react";
import { generateProductImagesAction, addProductImageAction } from "@/app/actions/ai";
import { Card } from "@/components/dashboard/ui";

type Product = { id: string; name: string; imageUrl: string | null };

export default function AiStudioPanel({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const selected = products.find((p) => p.id === productId);
  const [rawPhoto, setRawPhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [imgState, imgAction, imgPending] = useActionState(generateProductImagesAction, {});

  async function uploadRawPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?kind=image", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) setRawPhoto(json.url);
    } finally {
      setUploading(false);
    }
  }

  function flash(msg: string) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 3000);
  }

  async function saveImageToProduct(url: string) {
    if (!productId) return;
    const fd = new FormData();
    fd.append("productId", productId);
    fd.append("url", url);
    await addProductImageAction(fd);
    flash(`✓ Foto ditambahkan ke galeri "${selected?.name}"`);
  }

  if (products.length === 0) {
    return (
      <Card className="text-center py-16">
        <p className="text-3xl mb-2">📦</p>
        <p className="font-semibold text-slate-600">Belum ada produk</p>
        <p className="text-sm text-slate-400 mt-1">Tambahkan produk dulu sebelum pakai AI Studio.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <label className="text-sm font-medium block mb-1">Produk tujuan</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {savedMsg && <p className="text-xs text-emerald-600 mt-2">{savedMsg}</p>}
      </Card>

      <Card>
        <p className="text-sm font-bold mb-1">✨ Generate Foto Studio dari Foto HP</p>
        <p className="text-xs text-slate-500 mb-2">
          Upload foto produk apa adanya (dari kamera HP), AI akan buatkan beberapa versi foto studio.
        </p>
        {rawPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rawPhoto} alt="foto asli" className="w-20 h-20 object-cover rounded-lg border mb-2" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={uploadRawPhoto}
          className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2"
        />
        <form action={imgAction} className="mt-2">
          <input type="hidden" name="imageUrl" value={rawPhoto} />
          <input type="hidden" name="productName" value={selected?.name ?? ""} />
          <button
            type="submit"
            disabled={!rawPhoto || uploading || imgPending}
            className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {imgPending ? "Membuat foto studio... (±30-60 detik)" : "✨ Generate Foto Studio"}
          </button>
        </form>
        {imgState.error && <p className="text-xs text-red-600 mt-2">{imgState.error}</p>}
        {imgState.urls && imgState.urls.length > 0 && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {imgState.urls.map((url, i) => (
              <div key={url + i} className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`hasil ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border mb-1" />
                <button
                  type="button"
                  onClick={() => saveImageToProduct(url)}
                  className="text-[11px] text-teal-600 font-semibold hover:underline"
                >
                  + Tambahkan ke produk
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
