"use client";

import { useActionState } from "react";
import { updateStoreAction } from "@/app/actions/seller";

type Store = {
  name: string;
  description: string | null;
  logoUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
};

export default function StoreSettingsForm({ store }: { store: Store }) {
  const [state, formAction, pending] = useActionState(updateStoreAction, {});

  return (
    <form action={formAction} className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6">
      <div>
        <label className="text-sm font-medium block mb-1">Nama toko</label>
        <input
          type="text"
          name="name"
          required
          defaultValue={store.name}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Deskripsi</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={store.description ?? ""}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">URL Logo (opsional)</label>
        <input
          type="url"
          name="logoUrl"
          defaultValue={store.logoUrl ?? ""}
          placeholder="https://..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <hr className="border-slate-100" />
      <h2 className="font-bold text-sm">Rekening Bank (tujuan penarikan dana)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          name="bankName"
          placeholder="Nama bank (BCA/BNI/...)"
          defaultValue={store.bankName ?? ""}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="bankAccountNumber"
          placeholder="Nomor rekening"
          defaultValue={store.bankAccountNumber ?? ""}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="bankAccountName"
          placeholder="Nama pemilik rekening"
          defaultValue={store.bankAccountName ?? ""}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
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
