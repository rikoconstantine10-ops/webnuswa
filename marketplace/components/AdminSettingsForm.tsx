"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/app/actions/admin";

export default function AdminSettingsForm({ currentFee, kieApiKeySet }: { currentFee: number; kieApiKeySet: boolean }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, {});

  return (
    <form action={formAction} className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-6 space-y-4 max-w-md">
      <div>
        <label className="text-sm font-medium block mb-1">Platform fee (%)</label>
        <input
          type="number"
          name="platformFeePercent"
          step="0.1"
          min={0}
          max={50}
          defaultValue={currentFee}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          Dipotong dari subtotal tiap order yang lunas. Ongkir tidak dipotong fee.
        </p>
      </div>

      <hr className="border-slate-100" />

      <div>
        <label className="text-sm font-medium block mb-1">
          ✨ Kie.ai API Key {kieApiKeySet && <span className="text-emerald-600 font-normal">(sudah diatur)</span>}
        </label>
        <input
          type="password"
          name="kieApiKey"
          placeholder={kieApiKeySet ? "•••••••••••••••• (kosongkan jika tidak diubah)" : "Tempel API key dari kie.ai/api-key"}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          Mengaktifkan fitur ✨ Generate Foto Studio &amp; Caption AI di halaman produk seller. Ambil key di{" "}
          <a href="https://kie.ai/api-key" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">
            kie.ai/api-key
          </a>
          . Kuota gratis 10x/bulan per seller, 100x/bulan untuk seller Pro.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.saved && (
        <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">✓ Tersimpan</p>
      )}
      <button
        disabled={pending}
        className="bg-teal-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
