"use client";

import { useActionState, useState } from "react";
import { reportProductAction } from "@/app/actions/report";

const initial: { error?: string; ok?: boolean } = {};

const REASONS = [
  { value: "PROHIBITED", label: "Barang terlarang/ilegal" },
  { value: "COUNTERFEIT", label: "Produk palsu/KW" },
  { value: "SCAM", label: "Penipuan" },
  { value: "SPAM", label: "Spam / menyesatkan" },
  { value: "OTHER", label: "Lainnya" },
];

export default function ReportForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(reportProductAction, initial);

  if (state.ok) {
    return <p className="text-xs text-emerald-600 mt-4">✓ Terima kasih, laporanmu sudah kami terima.</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-slate-400 hover:text-red-500 mt-4 cursor-pointer underline"
      >
        ⚑ Laporkan produk ini
      </button>
    );
  }

  return (
    <form action={action} className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 max-w-md">
      <p className="text-sm font-semibold">Laporkan produk</p>
      <input type="hidden" name="productId" value={productId} />
      <select name="reason" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <textarea
        name="detail"
        rows={2}
        placeholder="Detail (opsional)"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />
      {state.error && <p className="text-xs text-red-500">{state.error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer">
          {pending ? "Mengirim…" : "Kirim Laporan"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-500 text-sm px-3 cursor-pointer">Batal</button>
      </div>
    </form>
  );
}
