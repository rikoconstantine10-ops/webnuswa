"use client";

import { useActionState, useState } from "react";
import { generateCaptionsAction, setProductDescriptionAction } from "@/app/actions/ai";
import { Card } from "@/components/dashboard/ui";

type Product = { id: string; name: string; imageUrl: string | null };

export default function AiStudioCaptionPanel({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const selected = products.find((p) => p.id === productId);
  const [mode, setMode] = useState<"social" | "ad">("social");
  const [savedMsg, setSavedMsg] = useState("");
  const [capState, capAction, capPending] = useActionState(generateCaptionsAction, {});

  async function saveCaptionToProduct(text: string) {
    if (!productId) return;
    const fd = new FormData();
    fd.append("productId", productId);
    fd.append("description", text);
    await setProductDescriptionAction(fd);
    setSavedMsg(`✓ Deskripsi "${selected?.name}" diperbarui`);
    setTimeout(() => setSavedMsg(""), 3000);
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
    <div className="space-y-4 max-w-lg">
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
        <p className="text-sm font-bold mb-1">📝 Generate Caption Produk</p>
        <p className="text-xs text-slate-500 mb-3">Pakai nama & foto produk yang dipilih di atas.</p>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setMode("social")}
            className={`flex-1 text-sm font-semibold px-3 py-2 rounded-lg border ${
              mode === "social" ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 text-slate-600"
            }`}
          >
            💬 Caption Sosmed
          </button>
          <button
            type="button"
            onClick={() => setMode("ad")}
            className={`flex-1 text-sm font-semibold px-3 py-2 rounded-lg border ${
              mode === "ad" ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 text-slate-600"
            }`}
          >
            📢 Copy Iklan
          </button>
        </div>

        <form action={capAction}>
          <input type="hidden" name="productName" value={selected?.name ?? ""} />
          <input type="hidden" name="imageUrl" value={selected?.imageUrl ?? ""} />
          <input type="hidden" name="mode" value={mode} />
          <button
            type="submit"
            disabled={!productId || capPending}
            className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {capPending ? "Membuat caption..." : `✨ Generate ${mode === "ad" ? "Copy Iklan" : "Caption"}`}
          </button>
        </form>
        {capState.error && <p className="text-xs text-red-600 mt-2">{capState.error}</p>}
        {capState.captions && capState.captions.length > 0 && (
          <div className="space-y-2 mt-3">
            {capState.captions.map((c, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm flex items-start justify-between gap-2 border border-slate-200">
                <p className="flex-1">{c}</p>
                <button
                  type="button"
                  onClick={() => saveCaptionToProduct(c)}
                  className="text-teal-600 text-xs font-bold hover:underline shrink-0"
                >
                  Gunakan
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
