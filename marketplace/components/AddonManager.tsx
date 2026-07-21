"use client";

import { useState } from "react";
import { saveAddonsAction } from "@/app/actions/products";
import { formatRupiah } from "@/lib/money";

type P = { id: string; name: string; price: number };
type ExistingAddon = { addonProductId: string; addonPrice: number };

export default function AddonManager({
  productId,
  candidates,
  existing,
}: {
  productId: string;
  candidates: P[];
  existing: ExistingAddon[];
}) {
  const [rows, setRows] = useState<ExistingAddon[]>(existing);

  function add() {
    const used = new Set(rows.map((r) => r.addonProductId));
    const next = candidates.find((c) => !used.has(c.id));
    if (next) setRows([...rows, { addonProductId: next.id, addonPrice: next.price }]);
  }

  return (
    <form action={saveAddonsAction} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="addonsJson" value={JSON.stringify(rows)} />

      <p className="text-sm text-slate-500">
        Pilih produk lain milikmu yang ditawarkan sebagai <b>add-on</b> saat pembeli checkout produk ini,
        dengan harga spesial. Teknik ini menaikkan nilai order.
      </p>

      {rows.length === 0 && <p className="text-sm text-slate-400">Belum ada add-on.</p>}

      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select
            value={row.addonProductId}
            onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, addonProductId: e.target.value } : r)))}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (normal {formatRupiah(c.price)})
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500">harga add-on Rp</span>
          <input
            type="number"
            min={0}
            value={row.addonPrice}
            onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, addonPrice: parseInt(e.target.value, 10) || 0 } : r)))}
            className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-red-500 px-2">
            ×
          </button>
        </div>
      ))}

      {candidates.length > rows.length && (
        <button type="button" onClick={add} className="text-teal-600 text-sm font-semibold">
          + Tambah add-on
        </button>
      )}

      <div>
        <button className="bg-teal-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-700">
          Simpan Add-on
        </button>
      </div>
    </form>
  );
}
