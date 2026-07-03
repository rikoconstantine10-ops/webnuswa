"use client";

import { useActionState } from "react";
import { registerSellerAction } from "@/app/actions/auth";

export default function RegisterSellerForm() {
  const [state, formAction, pending] = useActionState(registerSellerAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="text"
        name="name"
        required
        placeholder="Nama toko"
        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm"
      />
      <textarea
        name="description"
        rows={3}
        placeholder="Deskripsi singkat toko (opsional)"
        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm"
      />
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      <button
        disabled={pending}
        className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Membuat toko..." : "Buat Toko"}
      </button>
      <p className="text-xs text-slate-500">
        Toko baru berstatus <b>menunggu persetujuan admin</b> sebelum produkmu tampil di marketplace.
      </p>
    </form>
  );
}
