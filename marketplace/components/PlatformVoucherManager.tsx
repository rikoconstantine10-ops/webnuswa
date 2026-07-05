"use client";

import { useActionState } from "react";
import { createPlatformVoucherAction } from "@/app/actions/admin";

export default function PlatformVoucherManager() {
  const [state, formAction, pending] = useActionState(createPlatformVoucherAction, {});
  return (
    <form action={formAction} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <h2 className="font-bold text-sm">Buat Voucher Platform (berlaku semua toko)</h2>
      <p className="text-xs text-slate-400 -mt-1">Diskon voucher platform ditanggung platform, bukan penjual.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <input name="code" required placeholder="Kode (mis. NUSWA25)" className="border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase" />
        <select name="type" className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="PERCENT">Persen (%)</option>
          <option value="FIXED">Potongan tetap (Rp)</option>
        </select>
        <input name="value" type="number" min={1} required placeholder="Nilai" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input name="minSpend" type="number" min={0} placeholder="Min. belanja (Rp)" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input name="maxDiscount" type="number" min={0} placeholder="Maks. diskon (Rp)" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input name="quota" type="number" min={0} placeholder="Kuota (0 = tanpa batas)" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input name="endsAt" type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && <p className="text-xs text-emerald-600">✓ Voucher platform dibuat</p>}
      <button disabled={pending} className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50">
        {pending ? "Menyimpan..." : "Buat Voucher"}
      </button>
    </form>
  );
}
