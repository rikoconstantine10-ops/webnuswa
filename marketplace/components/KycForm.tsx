"use client";

import { useActionState, useState } from "react";
import { submitKycAction } from "@/app/actions/seller";

type Props = {
  kycStatus: string;
  kycName: string | null;
  kycIdNumber: string | null;
};

const BADGE: Record<string, { label: string; cls: string }> = {
  UNVERIFIED: { label: "Belum diverifikasi", cls: "bg-slate-200 text-slate-600" },
  PENDING: { label: "Menunggu tinjauan admin", cls: "bg-amber-100 text-amber-700" },
  VERIFIED: { label: "Terverifikasi ✓", cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Ditolak — kirim ulang", cls: "bg-red-100 text-red-700" },
};

export default function KycForm({ kycStatus, kycName, kycIdNumber }: Props) {
  const [state, formAction, pending] = useActionState(submitKycAction, {});
  const [idImage, setIdImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const badge = BADGE[kycStatus] ?? BADGE.UNVERIFIED;
  const locked = kycStatus === "VERIFIED" || kycStatus === "PENDING";

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?kind=image", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) setIdImage(json.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm">Verifikasi Identitas (KYC)</h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
      </div>
      <p className="text-xs text-slate-400 -mt-2">
        Toko perlu diverifikasi agar produk langsung tayang tanpa moderasi & bisa menerima pencairan dana.
      </p>

      {locked ? (
        <p className="text-sm text-slate-500">
          {kycStatus === "VERIFIED"
            ? "Identitas kamu sudah terverifikasi."
            : "Data KYC sedang ditinjau admin. Kamu akan diberi tahu setelah selesai."}
        </p>
      ) : (
        <>
          <input type="hidden" name="kycIdImageUrl" value={idImage} />
          <div className="grid md:grid-cols-2 gap-4">
            <input name="kycName" required defaultValue={kycName ?? ""} placeholder="Nama lengkap sesuai KTP" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <input name="kycIdNumber" required defaultValue={kycIdNumber ?? ""} placeholder="NIK (16 digit)" inputMode="numeric" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Foto KTP</label>
            {idImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={idImage} alt="KTP" className="h-24 rounded-lg object-cover border mb-2" />
            )}
            <input type="file" accept="image/*" onChange={upload} className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2" />
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="text-sm text-emerald-600">✓ Data KYC terkirim, menunggu tinjauan admin.</p>}
          <button disabled={pending || uploading} className="bg-teal-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50">
            {uploading ? "Mengunggah..." : pending ? "Mengirim..." : "Kirim Verifikasi"}
          </button>
        </>
      )}
    </form>
  );
}
