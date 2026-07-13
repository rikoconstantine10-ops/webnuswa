"use client";

import { useActionState, useState } from "react";
import { generateProductImagesAction, generateCaptionsAction } from "@/app/actions/ai";

export default function AiPhotoCaptionPanel({
  productName,
  onImageChosen,
  onCaptionChosen,
}: {
  productName: string;
  onImageChosen: (url: string) => void;
  onCaptionChosen: (text: string) => void;
}) {
  const [rawPhoto, setRawPhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imgState, imgAction, imgPending] = useActionState(generateProductImagesAction, {});
  const [capState, capAction, capPending] = useActionState(generateCaptionsAction, {});

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

  return (
    <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4 space-y-4">
      <div>
        <p className="text-sm font-bold mb-1">✨ Generate Foto Studio dari Foto HP (AI)</p>
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
          className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2 bg-white"
        />
        <form action={imgAction} className="mt-2">
          <input type="hidden" name="imageUrl" value={rawPhoto} />
          <input type="hidden" name="productName" value={productName} />
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
                  onClick={() => onImageChosen(url)}
                  className="text-[11px] text-teal-600 font-semibold hover:underline"
                >
                  + Tambahkan ke foto
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-indigo-100 pt-4">
        <p className="text-sm font-bold mb-1">✨ Generate Caption Produk (AI)</p>
        <p className="text-xs text-slate-500 mb-2">Isi nama produk di atas dulu, lalu klik generate.</p>
        <form action={capAction}>
          <input type="hidden" name="productName" value={productName} />
          <input type="hidden" name="imageUrl" value={rawPhoto} />
          <button
            type="submit"
            disabled={!productName.trim() || capPending}
            className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {capPending ? "Membuat caption..." : "✨ Generate Caption"}
          </button>
        </form>
        {capState.error && <p className="text-xs text-red-600 mt-2">{capState.error}</p>}
        {capState.captions && capState.captions.length > 0 && (
          <div className="space-y-2 mt-3">
            {capState.captions.map((c, i) => (
              <div key={i} className="bg-white rounded-lg p-3 text-sm flex items-start justify-between gap-2 border border-slate-200">
                <p className="flex-1">{c}</p>
                <button
                  type="button"
                  onClick={() => onCaptionChosen(c)}
                  className="text-teal-600 text-xs font-bold hover:underline shrink-0"
                >
                  Gunakan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
