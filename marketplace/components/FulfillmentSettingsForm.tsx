"use client";

import { updateFulfillmentSettingsAction } from "@/app/actions/seller";
import { BAYARIN_PAYMENT_GROUPS, BAYARIN_BANK_CODES } from "@/lib/bayarin";

const COURIER_LABELS: Record<string, string> = {
  jne: "JNE",
  jnt: "J&T Express",
  sicepat: "SiCepat",
  anteraja: "AnterAja",
  idexpress: "ID Express",
  ninja: "Ninja Xpress",
  pos: "Pos Indonesia",
  tiki: "TIKI",
  lion: "Lion Parcel",
  wahana: "Wahana",
  sap: "SAP Express",
  rpx: "RPX",
  gojek: "Gojek (instan)",
  grab: "Grab (instan)",
  lalamove: "Lalamove (instan)",
};

const REGULAR_CODES = ["jne", "jnt", "sicepat", "anteraja", "idexpress", "ninja", "pos", "tiki", "lion", "wahana", "sap", "rpx"];
const INSTANT_CODES = ["gojek", "grab", "lalamove"];

export default function FulfillmentSettingsForm({
  enabledPaymentTypes,
  enabledCouriers,
}: {
  enabledPaymentTypes: string[];
  enabledCouriers: string[];
}) {
  const allPaymentsEnabled = enabledPaymentTypes.length === 0;
  const allCouriersEnabled = enabledCouriers.length === 0;

  return (
    <form action={updateFulfillmentSettingsAction} className="space-y-6 bg-white rounded-2xl border border-slate-200 p-6">
      <div>
        <h2 className="font-bold mb-1">Metode Pembayaran</h2>
        <p className="text-xs text-slate-500 mb-3">
          Pilih metode yang mau diaktifkan. Tidak centang apa pun = semua metode diizinkan.
        </p>
        <div className="space-y-3 mb-2">
          {BAYARIN_PAYMENT_GROUPS.map((g) => (
            <div key={g.label}>
              <p className="text-xs font-semibold text-slate-500 mb-1">{g.label}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {g.codes.map((code) => (
                  <label key={code} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="enabledPaymentTypes"
                      value={code}
                      defaultChecked={allPaymentsEnabled || enabledPaymentTypes.includes(code)}
                    />
                    {BAYARIN_BANK_CODES[code]}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="enabledPaymentTypes"
              value="cod"
              defaultChecked={allPaymentsEnabled || enabledPaymentTypes.includes("cod")}
            />
            Bayar di Tempat (COD)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="enabledPaymentTypes"
              value="crypto"
              defaultChecked={allPaymentsEnabled || enabledPaymentTypes.includes("crypto")}
            />
            Kripto (USDT/BTC/dll)
          </label>
        </div>
      </div>

      <div>
        <h2 className="font-bold mb-1">Kurir Pengiriman</h2>
        <p className="text-xs text-slate-500 mb-3">
          Pilih kurir yang mau ditampilkan ke pembeli. Tidak centang apa pun = semua kurir default diizinkan.
        </p>
        <p className="text-xs font-semibold text-slate-600 mb-1">Reguler</p>
        <div className="grid sm:grid-cols-3 gap-2 mb-3">
          {REGULAR_CODES.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="enabledCouriers"
                value={code}
                defaultChecked={allCouriersEnabled || enabledCouriers.includes(code)}
              />
              {COURIER_LABELS[code]}
            </label>
          ))}
        </div>
        <p className="text-xs font-semibold text-slate-600 mb-1">Instan (butuh titik koordinat toko)</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {INSTANT_CODES.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="enabledCouriers"
                value={code}
                defaultChecked={allCouriersEnabled || enabledCouriers.includes(code)}
              />
              {COURIER_LABELS[code]}
            </label>
          ))}
        </div>
      </div>

      <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700">
        Simpan Preferensi
      </button>
    </form>
  );
}
