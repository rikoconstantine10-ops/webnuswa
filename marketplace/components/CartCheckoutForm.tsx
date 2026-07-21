"use client";

import { useActionState, useEffect, useState } from "react";
import { checkoutCartAction } from "@/app/actions/cart";
import { formatRupiah } from "@/lib/money";
import AreaSearch from "@/components/AreaSearch";
import PaymentMethodPicker from "@/components/PaymentMethodPicker";

type Rate = { company: string; type: string; name: string; price: number; duration: string; instant?: boolean; cod?: boolean };

type Props = {
  storeId: string;
  itemsSubtotal: number;
  hasPhysical: boolean;
  storeCanShip: boolean;
  storeCanInstant: boolean;
  productIdForVoucher: string;
  defaultName?: string;
  defaultEmail?: string;
  cryptoEnabled?: boolean;
  enabledPaymentTypes?: string[];
};

export default function CartCheckoutForm({
  storeId,
  itemsSubtotal,
  hasPhysical,
  storeCanShip,
  storeCanInstant,
  productIdForVoucher,
  defaultName,
  defaultEmail,
  cryptoEnabled = false,
  enabledPaymentTypes = [],
}: Props) {
  const [state, formAction, pending] = useActionState(checkoutCartAction, {});

  const [destAreaId, setDestAreaId] = useState("");
  const [rates, setRates] = useState<Rate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState("");
  const [courier, setCourier] = useState<Rate | null>(null);
  const [destLat, setDestLat] = useState("");
  const [destLng, setDestLng] = useState("");
  const [geoErr, setGeoErr] = useState("");

  const [voucherInput, setVoucherInput] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState("");

  const hasBuyerCoord = Boolean(destLat && destLng);
  const discount = Math.min(voucherDiscount, itemsSubtotal);
  const shippingCost = hasPhysical ? courier?.price ?? 0 : 0;
  const grandTotal = itemsSubtotal - discount + shippingCost;
  const shippingReady = !hasPhysical || Boolean(courier);

  useEffect(() => {
    if (!hasPhysical || !destAreaId) return;
    let cancelled = false;
    setRatesLoading(true);
    setRatesError("");
    setCourier(null);
    (async () => {
      try {
        const res = await fetch("/api/shipping/cart-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, destAreaId, ...(hasBuyerCoord ? { destLat: Number(destLat), destLng: Number(destLng) } : {}) }),
        });
        const data = await res.json();
        if (cancelled) return;
        setRates(data.pricing ?? []);
        if (data.error && !data.pricing?.length) setRatesError(data.error);
        else if (!data.pricing?.length) setRatesError("Tidak ada layanan kurir untuk tujuan ini");
      } catch {
        if (!cancelled) setRatesError("Gagal mengambil ongkir");
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasPhysical, destAreaId, destLat, destLng, hasBuyerCoord, storeId]);

  function pinLocation() {
    if (!navigator.geolocation) return setGeoErr("Browser tidak mendukung GPS");
    setGeoErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDestLat(pos.coords.latitude.toFixed(6));
        setDestLng(pos.coords.longitude.toFixed(6));
      },
      () => setGeoErr("Gagal ambil lokasi"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function applyVoucher() {
    const code = voucherInput.trim();
    if (!code) return;
    setVoucherMsg("");
    try {
      const res = await fetch("/api/voucher/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, productId: productIdForVoucher, subtotal: itemsSubtotal }),
      });
      const data = await res.json();
      if (data.ok) {
        setVoucherCode(code);
        setVoucherDiscount(data.discount);
        setVoucherMsg(`✓ Voucher ${data.label} diterapkan`);
      } else {
        setVoucherCode("");
        setVoucherDiscount(0);
        setVoucherMsg(data.message || "Voucher tidak valid");
      }
    } catch {
      setVoucherMsg("Gagal cek voucher");
    }
  }

  const paymentAllowed = (id: string) => enabledPaymentTypes.length === 0 || enabledPaymentTypes.includes(id);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="voucherCode" value={voucherCode} />
      <input type="hidden" name="courierCompany" value={courier?.company ?? ""} />
      <input type="hidden" name="courierType" value={courier?.type ?? ""} />
      <input type="hidden" name="destLat" value={hasBuyerCoord ? destLat : ""} />
      <input type="hidden" name="destLng" value={hasBuyerCoord ? destLng : ""} />

      <input name="buyerName" required placeholder="Nama lengkap" defaultValue={defaultName} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <input name="buyerEmail" type="email" required placeholder="Email" defaultValue={defaultEmail} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      {!defaultEmail && (
        <p className="text-xs text-slate-400 -mt-1">
          💡 Pakai email yang sama dengan akunmu — pesanan otomatis tercatat di satu akun (belanja &amp; jualan).
        </p>
      )}
      <input name="buyerPhone" type="tel" required placeholder="No. WhatsApp (08xxx)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

      {hasPhysical && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <label className="text-sm font-bold block">Alamat Pengiriman</label>
          {!storeCanShip ? (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">Toko belum mengatur alamat asal pengiriman.</p>
          ) : (
            <>
              <AreaSearch areaIdField="destAreaId" postalField="destPostalCode" placeholder="Kecamatan / kota tujuan" onSelect={(a) => setDestAreaId(a.id)} />
              <textarea name="shippingAddress" required rows={2} placeholder="Alamat detail" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              {storeCanInstant && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-800">⚡ Kurir instan (Gojek/Grab)?</span>
                  <button type="button" onClick={pinLocation} className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg">
                    {hasBuyerCoord ? "📍 Ganti lokasi" : "📍 Pin lokasi"}
                  </button>
                </div>
              )}
              {geoErr && <p className="text-xs text-red-600">{geoErr}</p>}
              {destAreaId && (
                <div>
                  <label className="text-sm font-medium block mb-1">Pilih kurir</label>
                  {ratesLoading && <p className="text-xs text-slate-500 animate-pulse">Menghitung ongkir…</p>}
                  {ratesError && !ratesLoading && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{ratesError}</p>}
                  <div className="space-y-1.5 max-h-56 overflow-auto">
                    {rates.map((r) => (
                      <label key={`${r.company}-${r.type}`} className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 text-sm cursor-pointer has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
                        <input type="radio" name="courierPick" checked={courier?.company === r.company && courier?.type === r.type} onChange={() => setCourier(r)} />
                        <span className="flex-1">
                          {r.instant && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded mr-1">INSTAN</span>}
                          {r.name} {r.duration && <span className="text-slate-400">· {r.duration}</span>}
                        </span>
                        <span className="font-bold">{formatRupiah(r.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div>
        <label className="text-sm font-medium block mb-1.5">Punya kode voucher?</label>
        <div className="flex gap-2">
          <input value={voucherInput} onChange={(e) => setVoucherInput(e.target.value.toUpperCase())} placeholder="Kode" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase" />
          <button type="button" onClick={applyVoucher} disabled={!voucherInput.trim()} className="bg-slate-700 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50">Pakai</button>
        </div>
        {voucherMsg && <p className={`text-xs mt-1 ${voucherCode ? "text-emerald-600" : "text-red-600"}`}>{voucherMsg}</p>}
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Metode pembayaran</label>
        <PaymentMethodPicker enabledPaymentTypes={enabledPaymentTypes} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          {hasPhysical && courier?.cod && paymentAllowed("cod") && (
            <label className="flex items-center gap-2 border border-amber-300 bg-amber-50/40 rounded-lg px-3 py-2 text-sm cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 col-span-2">
              <input type="radio" name="paymentType" value="cod" required />
              💵 COD — Bayar di Tempat
            </label>
          )}
          {cryptoEnabled && paymentAllowed("crypto") && (
            <label className="flex items-center gap-2 border border-indigo-300 bg-indigo-50/40 rounded-lg px-3 py-2 text-sm cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 col-span-2">
              <input type="radio" name="paymentType" value="crypto" required />
              ₿ Crypto — USDT / BTC / ETH dll (via Paymento)
            </label>
          )}
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatRupiah(itemsSubtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Diskon</span><span>−{formatRupiah(discount)}</span></div>}
        {hasPhysical && <div className="flex justify-between"><span className="text-slate-500">Ongkir {courier ? `(${courier.name})` : ""}</span><span>{courier ? formatRupiah(shippingCost) : "—"}</span></div>}
        <div className="flex justify-between font-extrabold border-t border-slate-200 pt-1"><span>Total</span><span className="text-teal-600">{formatRupiah(grandTotal)}</span></div>
      </div>

      {state.error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>}

      <button disabled={pending || !shippingReady || (hasPhysical && !storeCanShip)} className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50">
        {pending ? "Memproses..." : hasPhysical && !courier ? "Pilih kurir dulu" : "Bayar Sekarang"}
      </button>
    </form>
  );
}
