"use client";

import { useActionState, useState } from "react";
import { updateStoreAction } from "@/app/actions/seller";
import AreaSearch from "@/components/AreaSearch";

type Store = {
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsapp: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  metaPixelId: string | null;
  metaCapiToken: string | null;
  originAreaId: string | null;
  originPostalCode: string | null;
  originAddress: string | null;
  originContactName: string | null;
  originContactPhone: string | null;
  originLat: number | null;
  originLng: number | null;
};

export default function StoreSettingsForm({ store }: { store: Store }) {
  const [state, formAction, pending] = useActionState(updateStoreAction, {});
  const [logoUrl, setLogoUrl] = useState(store.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(store.bannerUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [lat, setLat] = useState(store.originLat != null ? String(store.originLat) : "");
  const [lng, setLng] = useState(store.originLng != null ? String(store.originLng) : "");
  const [geoErr, setGeoErr] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  function pinLocation() {
    if (!navigator.geolocation) {
      setGeoErr("Browser tidak mendukung GPS");
      return;
    }
    setGeoErr("");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      (err) => {
        setGeoErr(err.code === 1 ? "Izin lokasi ditolak" : "Gagal ambil lokasi");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>, set: (u: string) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?kind=image", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) set(json.url);
    } finally {
      setUploading(false);
    }
  }

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
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Logo toko</label>
          <input type="hidden" name="logoUrl" value={logoUrl} />
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="logo" className="w-16 h-16 rounded-full object-cover border mb-2" />
          )}
          <input type="file" accept="image/*" onChange={(e) => upload(e, setLogoUrl)} className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Banner toko</label>
          <input type="hidden" name="bannerUrl" value={bannerUrl} />
          {bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="banner" className="w-full h-16 rounded-lg object-cover border mb-2" />
          )}
          <input type="file" accept="image/*" onChange={(e) => upload(e, setBannerUrl)} className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Nomor WhatsApp toko (untuk tombol &quot;Chat Penjual&quot;)</label>
        <input
          type="text"
          name="whatsapp"
          defaultValue={store.whatsapp ?? ""}
          placeholder="628123456789"
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

      <hr className="border-slate-100" />
      <h2 className="font-bold text-sm">Alamat Asal Pengiriman (produk fisik)</h2>
      <p className="text-xs text-slate-400 -mt-2">
        Titik jemput kurir & dasar perhitungan ongkir. Wajib diisi jika kamu jual produk fisik.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          name="originContactName"
          placeholder="Nama pengirim / toko"
          defaultValue={store.originContactName ?? ""}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="originContactPhone"
          placeholder="No. HP pengirim (628xxx)"
          defaultValue={store.originContactPhone ?? ""}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Kecamatan / Kota asal</label>
        <AreaSearch
          areaIdField="originAreaId"
          postalField="originPostalCode"
          defaultLabel={store.originAreaId ? `${store.originAddress ? "" : ""}Kode pos ${store.originPostalCode ?? ""}` : ""}
          placeholder="Ketik kecamatan asal (min 3 huruf)"
        />
        {store.originAreaId && (
          <p className="text-xs text-emerald-600 mt-1">
            Area asal sudah tersimpan (kode pos {store.originPostalCode}). Ketik ulang untuk mengganti.
          </p>
        )}
      </div>
      <textarea
        name="originAddress"
        rows={2}
        placeholder="Alamat detail asal (nama jalan, nomor, patokan)"
        defaultValue={store.originAddress ?? ""}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />

      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium">
            Titik jemput (GPS) — untuk kurir instan Gojek/Grab
          </label>
          <button
            type="button"
            onClick={pinLocation}
            disabled={geoLoading}
            className="text-xs font-bold bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-50 whitespace-nowrap"
          >
            {geoLoading ? "Mengambil…" : "📍 Pin lokasi toko"}
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Buka halaman ini saat berada di lokasi toko lalu klik &quot;Pin lokasi toko&quot;, atau isi
          koordinat manual. Tanpa titik ini, opsi Gojek/Grab tidak muncul di checkout.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            name="originLat"
            inputMode="decimal"
            placeholder="Latitude (mis. -6.244100)"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="originLng"
            inputMode="decimal"
            placeholder="Longitude (mis. 106.799700)"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {geoErr && <p className="text-xs text-red-600">{geoErr}</p>}
        {lat && lng && !geoErr && (
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-teal-600 hover:underline"
          >
            Cek titik di Google Maps ↗
          </a>
        )}
      </div>

      <hr className="border-slate-100" />
      <h2 className="font-bold text-sm">Facebook / Meta Pixel (opsional)</h2>
      <p className="text-xs text-slate-400 -mt-2">
        Untuk melacak konversi iklan Facebook/Instagram. Pixel dipasang di halaman produk & pembayaran;
        event Purchase juga dikirim server-side (Conversions API) agar akurat meski ada ad-blocker.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          name="metaPixelId"
          placeholder="Pixel ID (angka)"
          defaultValue={store.metaPixelId ?? ""}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="metaCapiToken"
          placeholder="CAPI Access Token"
          defaultValue={store.metaCapiToken ?? ""}
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
        disabled={pending || uploading}
        className="bg-teal-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {uploading ? "Mengunggah..." : pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
