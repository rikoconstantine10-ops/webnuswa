"use client";

import { useActionState, useState } from "react";
import { saveAddressAction } from "@/app/actions/account";

const initial: { error?: string; ok?: boolean } = {};

type Addr = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  detail: string;
  areaId: string | null;
  postalCode: string | null;
  isDefault: boolean;
};

export default function AddressForm({ editing }: { editing?: Addr }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveAddressAction, initial);

  if (state.ok && open) {
    // Tutup form otomatis setelah simpan berhasil.
    setTimeout(() => setOpen(false), 0);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={
          editing
            ? "text-teal-600 text-sm font-semibold hover:underline cursor-pointer"
            : "bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700 cursor-pointer"
        }
      >
        {editing ? "Edit" : "+ Tambah Alamat"}
      </button>
    );
  }

  return (
    <form action={action} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 mb-3">
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="text-slate-500 text-xs">Label</span>
          <input name="label" defaultValue={editing?.label ?? "Rumah"} className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-0.5" />
        </label>
        <label className="text-sm">
          <span className="text-slate-500 text-xs">Nama Penerima</span>
          <input name="recipientName" defaultValue={editing?.recipientName ?? ""} required className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-0.5" />
        </label>
        <label className="text-sm">
          <span className="text-slate-500 text-xs">No. Telepon/WA</span>
          <input name="phone" defaultValue={editing?.phone ?? ""} required className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-0.5" />
        </label>
        <label className="text-sm">
          <span className="text-slate-500 text-xs">Kode Pos</span>
          <input name="postalCode" defaultValue={editing?.postalCode ?? ""} className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-0.5" />
        </label>
      </div>
      <input type="hidden" name="areaId" defaultValue={editing?.areaId ?? ""} />
      <label className="text-sm block">
        <span className="text-slate-500 text-xs">Alamat Lengkap (jalan, RT/RW, kelurahan, kecamatan, kota)</span>
        <textarea name="detail" defaultValue={editing?.detail ?? ""} required rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-0.5" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" defaultChecked={editing?.isDefault} />
        Jadikan alamat utama
      </label>
      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 cursor-pointer">
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-500 text-sm px-4 py-2 cursor-pointer">
          Batal
        </button>
      </div>
    </form>
  );
}
