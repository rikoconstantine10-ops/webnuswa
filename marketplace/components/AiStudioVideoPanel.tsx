"use client";

import { useActionState, useState } from "react";
import { generateProductVideoAction } from "@/app/actions/ai";
import { Card } from "@/components/dashboard/ui";

type Product = { id: string; name: string; imageUrl: string | null };

export default function AiStudioVideoPanel({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const selected = products.find((p) => p.id === productId);
  const [rawPhoto, setRawPhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [vidState, vidAction, vidPending] = useActionState(generateProductVideoAction, {});

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
      </Card>

      <Card>
        <p className="text-sm font-bold mb-1">🎬 Generate Video Showcase dari Foto HP</p>
        <p className="text-xs text-slate-500 mb-2">
          Upload foto produk apa adanya (dari kamera HP), AI akan buatkan 1 video showcase singkat.
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
        <form action={vidAction} className="mt-2">
          <input type="hidden" name="imageUrl" value={rawPhoto} />
          <input type="hidden" name="productName" value={selected?.name ?? ""} />
          <button
            type="submit"
            disabled={!rawPhoto || uploading || vidPending}
            className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {vidPending ? "Membuat video... (±1-3 menit)" : "🎬 Generate Video"}
          </button>
        </form>
        {vidState.error && <p className="text-xs text-red-600 mt-2">{vidState.error}</p>}
        {vidState.urls && vidState.urls.length > 0 && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {vidState.urls.map((url, i) => (
              <div key={url + i} className="text-center">
                <video src={url} controls className="w-48 rounded-lg border mb-1" />
                <a
                  href={url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-teal-600 font-semibold hover:underline"
                >
                  ⬇ Download video
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
