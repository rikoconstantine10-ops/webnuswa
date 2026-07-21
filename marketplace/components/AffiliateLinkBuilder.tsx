"use client";

import { useState } from "react";

export default function AffiliateLinkBuilder({ affCode, appUrl }: { affCode: string; appUrl: string }) {
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const link = slug.trim()
    ? `${appUrl}/p/${slug.trim().replace(/.*\/p\//, "").replace(/\?.*/, "")}?aff=${affCode}`
    : "";

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="space-y-2">
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="Tempel slug atau URL produk (mis. kaos-polos)"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />
      {link && (
        <div className="flex gap-2">
          <input readOnly value={link} className="flex-1 border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs font-mono" />
          <button onClick={copy} className="bg-teal-600 text-white text-sm font-bold px-4 rounded-lg hover:bg-teal-700">
            {copied ? "✓" : "Salin"}
          </button>
        </div>
      )}
    </div>
  );
}
