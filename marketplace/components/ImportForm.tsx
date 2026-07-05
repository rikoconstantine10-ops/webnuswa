"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importProductsAction } from "@/app/actions/import";

const initial: { error?: string; created?: number; skipped?: string[] } = {};

const SAMPLE = `name,price,type,description,stock,weight,category,image,saleprice,saledays
Kaos Polos Premium,75000,PHYSICAL,Kaos katun combed 30s,50,250,Fashion,,60000,7
Kopi Gayo 250g,55000,PHYSICAL,Biji kopi arabica,100,300,Makanan,,,`;

export default function ImportForm() {
  const [state, action, pending] = useActionState(importProductsAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
        <p className="font-semibold mb-1">Format kolom (baris pertama = header):</p>
        <p className="text-slate-500 mb-2">
          Wajib: <code>name</code>, <code>price</code>. Opsional: <code>type</code> (PHYSICAL),{" "}
          <code>description</code>, <code>stock</code>, <code>weight</code> (gram), <code>category</code>,{" "}
          <code>image</code> (URL), <code>saleprice</code>, <code>saledays</code>.
        </p>
        <pre className="bg-white border border-slate-200 rounded-lg p-2 overflow-x-auto text-xs">{SAMPLE}</pre>
        <p className="text-slate-400 text-xs mt-1">Produk digital tidak didukung import massal (butuh unggah file).</p>
      </div>

      <textarea
        name="csv"
        rows={10}
        required
        placeholder="Tempel data CSV di sini…"
        defaultValue={SAMPLE}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono"
      />

      {state.error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>}
      {state.created != null && (
        <div className="text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <p className="text-emerald-700 font-semibold">✓ {state.created} produk berhasil diimpor.</p>
          {state.skipped && state.skipped.length > 0 && (
            <details className="mt-1">
              <summary className="text-amber-600 cursor-pointer">{state.skipped.length} baris dilewati</summary>
              <ul className="list-disc ml-5 mt-1 text-amber-700">
                {state.skipped.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </details>
          )}
          <Link href="/dashboard/products" className="inline-block mt-2 text-teal-600 font-semibold hover:underline">
            Lihat produk →
          </Link>
        </div>
      )}

      <button
        disabled={pending}
        className="bg-teal-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
      >
        {pending ? "Mengimpor…" : "Impor Produk"}
      </button>
    </form>
  );
}
