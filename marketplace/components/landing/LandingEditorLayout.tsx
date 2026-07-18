"use client";

import { useState } from "react";
import type { LandingBlock } from "@/lib/landingBlocks";
import LandingBuilderForm from "./LandingBuilderForm";

type Addon = { id: string; name: string };

export default function LandingEditorLayout({
  landingPageId,
  initialBlocks,
  addons,
  previewUrl,
}: {
  landingPageId: string;
  initialBlocks: LandingBlock[];
  addons: Addon[];
  previewUrl: string;
}) {
  const [previewNonce, setPreviewNonce] = useState(0);
  const bumpPreview = () => setPreviewNonce((n) => n + 1);

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-5">
        <h2 className="font-bold mb-3">Susun Blok (geser untuk urutkan)</h2>
        <LandingBuilderForm landingPageId={landingPageId} initialBlocks={initialBlocks} addons={addons} onSaved={bumpPreview} />
      </div>

      <div className="lg:sticky lg:top-6 bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="font-bold text-sm">👁 Pratinjau Live</h2>
          <button type="button" onClick={bumpPreview} className="text-xs font-bold text-teal-600 hover:underline">
            ⟳ Refresh
          </button>
        </div>
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <iframe
            key={previewNonce}
            src={`${previewUrl}?preview=${previewNonce}`}
            className="w-full"
            style={{ height: "70vh" }}
            title="Pratinjau landing page"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2 px-1">
          Pratinjau ini bisa diklik/dicoba sama seperti halaman aslinya — hati-hati kalau isi form order, itu akan bikin order sungguhan.
        </p>
      </div>
    </div>
  );
}
