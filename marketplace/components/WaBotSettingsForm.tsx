"use client";

import { useActionState } from "react";
import { updateWaBotSettingsAction } from "@/app/actions/wa";

const DAYS: Array<{ code: string; label: string }> = [
  { code: "MON", label: "Sen" },
  { code: "TUE", label: "Sel" },
  { code: "WED", label: "Rab" },
  { code: "THU", label: "Kam" },
  { code: "FRI", label: "Jum" },
  { code: "SAT", label: "Sab" },
  { code: "SUN", label: "Min" },
];

async function action(_prev: unknown, formData: FormData) {
  await updateWaBotSettingsAction(formData);
  return { saved: true };
}

export default function WaBotSettingsForm({
  waPersonaPrompt,
  waAutoReplyEnabled,
  waActiveDays,
  waActiveHoursStart,
  waActiveHoursEnd,
}: {
  waPersonaPrompt: string;
  waAutoReplyEnabled: boolean;
  waActiveDays: string[];
  waActiveHoursStart: string;
  waActiveHoursEnd: string;
}) {
  const [state, formAction, pending] = useActionState(action, { saved: false });

  return (
    <form action={formAction} className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-5 space-y-5">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="waAutoReplyEnabled" defaultChecked={waAutoReplyEnabled} className="rounded" />
        Aktifkan balas otomatis chatbot
      </label>

      <div>
        <label className="text-sm font-medium block mb-1">Persona / gaya bicara bot</label>
        <textarea
          name="waPersonaPrompt"
          rows={4}
          defaultValue={waPersonaPrompt}
          placeholder='Contoh: "Kamu admin toko baju anak Rumah Kecil, ramah, suka pakai emoji, panggil pembeli dengan Kak."'
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          Ini gaya bicara bot-mu. Aturan keras anti-halusinasi (harga/stok tidak boleh dikarang, dst) diatur
          platform dan tetap berlaku walau persona ini kosong.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Hari bot aktif</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <label key={d.code} className="flex items-center gap-1 text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
              <input type="checkbox" name="waActiveDays" value={d.code} defaultChecked={waActiveDays.includes(d.code)} />
              {d.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1">Tidak dicentang sama sekali = aktif setiap hari.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">Jam mulai</label>
          <input
            type="time"
            name="waActiveHoursStart"
            defaultValue={waActiveHoursStart}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Jam selesai</label>
          <input
            type="time"
            name="waActiveHoursEnd"
            defaultValue={waActiveHoursEnd}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-slate-500 -mt-3">Kosongkan kedua jam = bot aktif 24 jam.</p>

      {state.saved && <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">✓ Tersimpan</p>}
      <button
        disabled={pending}
        className="bg-teal-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
