"use client";

import { useCallback, useEffect, useState } from "react";

type WaState = {
  status: "disconnected" | "qr" | "connecting" | "connected";
  qr?: string;
  phone?: string;
};

export default function WaConnect() {
  const [state, setState] = useState<WaState>({ status: "disconnected" });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/wa");
      if (res.ok) setState(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function act(action: "start" | "logout") {
    setBusy(true);
    try {
      await fetch("/api/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      {state.status === "connected" ? (
        <div className="text-center space-y-3">
          <div className="text-5xl">✅</div>
          <p className="font-bold text-emerald-600">WhatsApp Terhubung</p>
          <p className="text-sm text-slate-500">
            Nomor: <b className="font-mono">+{state.phone}</b>
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Notifikasi pesanan & reminder pembayaran otomatis dikirim dari nomor ini
            ke pembeli tokomu.
          </p>
          <button
            onClick={() => act("logout")}
            disabled={busy}
            className="text-sm font-bold text-red-600 bg-red-50 px-5 py-2.5 rounded-xl hover:bg-red-100 disabled:opacity-50"
          >
            Putuskan Koneksi
          </button>
        </div>
      ) : state.status === "qr" && state.qr ? (
        <div className="text-center space-y-3">
          <p className="font-bold">Scan QR ini dengan WhatsApp-mu</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.qr} alt="QR WhatsApp" className="w-64 h-64 mx-auto border rounded-xl" />
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Buka WhatsApp di HP → <b>Perangkat Tertaut</b> → <b>Tautkan Perangkat</b> → scan.
            QR diperbarui otomatis.
          </p>
        </div>
      ) : state.status === "connecting" ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500 animate-pulse">Menyambungkan…</p>
        </div>
      ) : (
        <div className="text-center space-y-3 py-4">
          <div className="text-5xl">💬</div>
          <p className="font-bold">Hubungkan WhatsApp Tokomu</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Setelah terhubung, pembeli otomatis menerima konfirmasi pembayaran dan
            reminder lewat WhatsApp dari nomormu — kamu juga mendapat notifikasi
            pesanan baru.
          </p>
          <button
            onClick={() => act("start")}
            disabled={busy}
            className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Menyiapkan…" : "Hubungkan WhatsApp"}
          </button>
        </div>
      )}
    </div>
  );
}
