"use client";

import { useActionState, useEffect, useState } from "react";
import { checkoutAction } from "@/app/actions/checkout";
import { PAYMENT_TYPES, MIN_VA_AMOUNT, isPaymentTypeAllowed } from "@/lib/louvin";
import { formatRupiah } from "@/lib/money";
import AreaSearch from "@/components/AreaSearch";

type Variant = { id: string; name: string; price: number; stock: number | null };
type Tier = { minQty: number; price: number };
type Addon = { id: string; name: string; price: number };
type Rate = { company: string; type: string; name: string; price: number; duration: string; instant?: boolean; cod?: boolean };

type Props = {
  productId: string;
  productType: string;
  price: number;
  maxQty: number | null;
  variants: Variant[];
  tiers: Tier[];
  addons?: Addon[];
  storeCanShip: boolean;
  storeCanInstant?: boolean;
  defaultName?: string;
  defaultEmail?: string;
  userPoints?: number;
  cryptoEnabled?: boolean;
};

export default function BuyForm({
  productId,
  productType,
  price,
  maxQty,
  variants,
  tiers,
  addons = [],
  storeCanShip,
  storeCanInstant = false,
  defaultName,
  defaultEmail,
  userPoints = 0,
  cryptoEnabled = false,
}: Props) {
  const [state, formAction, pending] = useActionState(checkoutAction, {});
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string>(variants[0]?.id ?? "");
  const [addonSel, setAddonSel] = useState<Record<string, boolean>>({});
  const [usePoints, setUsePoints] = useState(false);
  const [payMethod, setPayMethod] = useState<string>("");

  // Pengiriman (produk fisik)
  const isPhysical = productType === "PHYSICAL";
  const [destAreaId, setDestAreaId] = useState("");
  const [rates, setRates] = useState<Rate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState("");
  const [courier, setCourier] = useState<Rate | null>(null);

  // Koordinat tujuan pembeli (untuk kurir instan Gojek/Grab)
  const [destLat, setDestLat] = useState("");
  const [destLng, setDestLng] = useState("");
  const [geoErr, setGeoErr] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  function pinBuyerLocation() {
    if (!navigator.geolocation) {
      setGeoErr("Browser tidak mendukung GPS");
      return;
    }
    setGeoErr("");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDestLat(pos.coords.latitude.toFixed(6));
        setDestLng(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      (err) => {
        setGeoErr(err.code === 1 ? "Izin lokasi ditolak" : "Gagal ambil lokasi");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Voucher
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState("");
  const [voucherChecking, setVoucherChecking] = useState(false);

  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
  const variant = variants.find((v) => v.id === variantId);

  let unitPrice = price;
  if (variant) unitPrice = variant.price;
  else {
    const tier = [...tiers].sort((a, b) => b.minQty - a.minQty).find((t) => safeQty >= t.minQty);
    if (tier) unitPrice = tier.price;
  }
  const addonTotal = addons.reduce((s, a) => (addonSel[a.id] ? s + a.price : s), 0);
  const itemsSubtotal = unitPrice * safeQty + addonTotal;
  const shippingCost = isPhysical ? courier?.price ?? 0 : 0;
  const discount = Math.min(voucherDiscount, itemsSubtotal);
  // Poin loyalti hanya untuk pembayaran online (bukan COD) & maksimal senilai subtotal setelah diskon.
  const isCodSel = payMethod === "cod";
  const maxPoints = Math.max(0, Math.min(userPoints, itemsSubtotal - discount));
  const pointsRedeemed = usePoints && !isCodSel ? maxPoints : 0;
  const grandTotal = itemsSubtotal - discount + shippingCost - pointsRedeemed;

  async function applyVoucher() {
    const code = voucherInput.trim();
    if (!code) return;
    setVoucherChecking(true);
    setVoucherMsg("");
    try {
      const res = await fetch("/api/voucher/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, productId, subtotal: itemsSubtotal }),
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
    } finally {
      setVoucherChecking(false);
    }
  }
  const effectiveMax = variant ? variant.stock : maxQty;

  const hasBuyerCoord = Boolean(destLat && destLng);

  // Ambil ongkir saat area tujuan / jumlah / koordinat berubah.
  useEffect(() => {
    if (!isPhysical || !destAreaId) return;
    let cancelled = false;
    setRatesLoading(true);
    setRatesError("");
    setCourier(null);
    (async () => {
      try {
        const res = await fetch("/api/shipping/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            qty: safeQty,
            destAreaId,
            ...(hasBuyerCoord ? { destLat: Number(destLat), destLng: Number(destLng) } : {}),
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.error && (!data.pricing || data.pricing.length === 0)) {
          setRatesError(data.error);
          setRates([]);
        } else {
          setRates(data.pricing ?? []);
          if (!data.pricing?.length) setRatesError("Tidak ada layanan kurir untuk tujuan ini");
        }
      } catch {
        if (!cancelled) setRatesError("Gagal mengambil ongkir");
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPhysical, destAreaId, safeQty, productId, destLat, destLng, hasBuyerCoord]);

  const available = PAYMENT_TYPES.filter((pt) => isPaymentTypeAllowed(pt.id, grandTotal));
  const vaHidden = available.length < PAYMENT_TYPES.length;
  const shippingReady = !isPhysical || Boolean(courier);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />

      {variants.length > 0 && (
        <div>
          <label className="text-sm font-medium block mb-1.5">Pilih varian</label>
          <input type="hidden" name="variantId" value={variantId} />
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const out = isPhysical && v.stock !== null && v.stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  onClick={() => setVariantId(v.id)}
                  className={`text-sm px-3 py-2 rounded-lg border ${
                    variantId === v.id
                      ? "border-teal-600 bg-teal-50 text-teal-700 font-semibold"
                      : "border-slate-300 text-slate-600"
                  } ${out ? "opacity-40 line-through" : ""}`}
                >
                  {v.name} · {formatRupiah(v.price)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tiers.length > 0 && variants.length === 0 && (
        <div className="text-xs bg-amber-50 text-amber-800 rounded-lg px-3 py-2">
          <p className="font-bold mb-1">💡 Harga grosir:</p>
          {[...tiers].sort((a, b) => a.minQty - b.minQty).map((t) => (
            <p key={t.minQty}>
              Beli ≥ {t.minQty} → {formatRupiah(t.price)}/pcs
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium w-28">Jumlah</label>
        <input
          type="number"
          name="qty"
          min={1}
          max={effectiveMax ?? undefined}
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
          className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {addons.length > 0 && (
        <div className="border border-dashed border-teal-300 bg-teal-50/50 rounded-lg p-3">
          <p className="text-xs font-bold text-teal-700 mb-2">🎁 Sekalian tambah? Harga spesial:</p>
          <div className="space-y-1.5">
            {addons.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="addonIds"
                  value={a.id}
                  checked={Boolean(addonSel[a.id])}
                  onChange={(e) => setAddonSel({ ...addonSel, [a.id]: e.target.checked })}
                />
                <span className="flex-1">{a.name}</span>
                <span className="font-bold text-teal-700">+{formatRupiah(a.price)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <input
        type="text"
        name="buyerName"
        required
        placeholder="Nama lengkap"
        defaultValue={defaultName}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />
      <input
        type="email"
        name="buyerEmail"
        required
        placeholder="Email (untuk bukti & link download)"
        defaultValue={defaultEmail}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />
      <input
        type="tel"
        name="buyerPhone"
        required
        placeholder="No. WhatsApp (mis. 08123456789)"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />

      {isPhysical && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <label className="text-sm font-bold block">Alamat Pengiriman</label>
          {!storeCanShip ? (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              Toko ini belum mengatur alamat asal pengiriman, jadi ongkir belum bisa dihitung.
            </p>
          ) : (
            <>
              <AreaSearch
                areaIdField="destAreaId"
                postalField="destPostalCode"
                placeholder="Kecamatan / kota tujuan (min 3 huruf)"
                onSelect={(a) => setDestAreaId(a.id)}
              />
              <textarea
                name="shippingAddress"
                required
                rows={2}
                placeholder="Alamat detail (jalan, nomor, RT/RW, patokan)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />

              {storeCanInstant && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-800">
                      ⚡ Mau kurir instan (Gojek/Grab)?
                    </span>
                    <button
                      type="button"
                      onClick={pinBuyerLocation}
                      disabled={geoLoading}
                      className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {geoLoading ? "…" : hasBuyerCoord ? "📍 Ganti lokasi" : "📍 Pin lokasi saya"}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-700/80">
                    Aktifkan lokasi untuk melihat opsi antar cepat hari ini. Tanpa ini, hanya kurir
                    reguler yang muncul.
                  </p>
                  {hasBuyerCoord && !geoErr && (
                    <p className="text-[11px] text-emerald-700">✓ Lokasi terpasang ({destLat}, {destLng})</p>
                  )}
                  {geoErr && <p className="text-[11px] text-red-600">{geoErr}</p>}
                </div>
              )}

              {destAreaId && (
                <div>
                  <label className="text-sm font-medium block mb-1">Pilih kurir</label>
                  {ratesLoading && <p className="text-xs text-slate-500 animate-pulse">Menghitung ongkir…</p>}
                  {ratesError && !ratesLoading && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{ratesError}</p>
                  )}
                  <div className="space-y-1.5 max-h-56 overflow-auto">
                    {rates.map((r) => (
                      <label
                        key={`${r.company}-${r.type}`}
                        className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 text-sm cursor-pointer has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50"
                      >
                        <input
                          type="radio"
                          name="courierPick"
                          checked={courier?.company === r.company && courier?.type === r.type}
                          onChange={() => setCourier(r)}
                        />
                        <span className="flex-1">
                          {r.instant && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded mr-1">
                              INSTAN
                            </span>
                          )}
                          {r.name} {r.duration && <span className="text-slate-400">· {r.duration}</span>}
                        </span>
                        <span className="font-bold">{formatRupiah(r.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <input type="hidden" name="courierCompany" value={courier?.company ?? ""} />
              <input type="hidden" name="courierType" value={courier?.type ?? ""} />
              <input type="hidden" name="courierName" value={courier?.name ?? ""} />
              <input type="hidden" name="destLat" value={hasBuyerCoord ? destLat : ""} />
              <input type="hidden" name="destLng" value={hasBuyerCoord ? destLng : ""} />
            </>
          )}
        </div>
      )}

      <input type="hidden" name="voucherCode" value={voucherCode} />
      <div>
        <label className="text-sm font-medium block mb-1.5">Punya kode voucher?</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={voucherInput}
            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
            placeholder="Masukkan kode"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase"
          />
          <button
            type="button"
            onClick={applyVoucher}
            disabled={voucherChecking || !voucherInput.trim()}
            className="bg-slate-700 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            {voucherChecking ? "…" : "Pakai"}
          </button>
        </div>
        {voucherMsg && (
          <p className={`text-xs mt-1 ${voucherCode ? "text-emerald-600" : "text-red-600"}`}>{voucherMsg}</p>
        )}
      </div>

      <input type="hidden" name="usePoints" value={pointsRedeemed > 0 ? "1" : ""} />
      {userPoints > 0 && (
        <label className={`flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer ${isCodSel ? "border-slate-200 opacity-50" : "border-teal-200 bg-teal-50/50"}`}>
          <span className="flex items-center gap-2">
            <input type="checkbox" checked={usePoints} disabled={isCodSel} onChange={(e) => setUsePoints(e.target.checked)} />
            Tukar poin loyalti {isCodSel && <span className="text-xs text-slate-400">(tidak berlaku untuk COD)</span>}
          </span>
          <span className="text-teal-700 font-semibold">
            ⭐ {userPoints.toLocaleString("id-ID")} tersedia (−{formatRupiah(maxPoints)})
          </span>
        </label>
      )}

      <div>
        <label className="text-sm font-medium block mb-1.5">Metode pembayaran</label>
        <div className="grid grid-cols-2 gap-2">
          {available.map((pt, i) => (
            <label
              key={pt.id}
              className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 text-sm cursor-pointer has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50"
            >
              <input type="radio" name="paymentType" value={pt.id} defaultChecked={i === 0} onChange={() => setPayMethod(pt.id)} required />
              {pt.label}
            </label>
          ))}
          {isPhysical && courier?.cod && (
            <label className="flex items-center gap-2 border border-amber-300 bg-amber-50/40 rounded-lg px-3 py-2 text-sm cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 col-span-2">
              <input type="radio" name="paymentType" value="cod" onChange={() => setPayMethod("cod")} required />
              💵 COD — Bayar di Tempat (tunai ke kurir saat barang sampai)
            </label>
          )}
          {cryptoEnabled && (
            <label className="flex items-center gap-2 border border-indigo-300 bg-indigo-50/40 rounded-lg px-3 py-2 text-sm cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 col-span-2">
              <input type="radio" name="paymentType" value="crypto" onChange={() => setPayMethod("crypto")} required />
              ₿ Crypto — USDT / BTC / ETH dll (via Paymento)
            </label>
          )}
        </div>
        {vaHidden && (
          <p className="text-xs text-slate-400 mt-1.5">
            Virtual Account tersedia untuk total minimal {formatRupiah(MIN_VA_AMOUNT)}.
          </p>
        )}
      </div>

      <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">Subtotal produk</span>
          <span>{formatRupiah(itemsSubtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Diskon voucher</span>
            <span>−{formatRupiah(discount)}</span>
          </div>
        )}
        {pointsRedeemed > 0 && (
          <div className="flex justify-between text-teal-600">
            <span>Poin loyalti</span>
            <span>−{formatRupiah(pointsRedeemed)}</span>
          </div>
        )}
        {isPhysical && (
          <div className="flex justify-between">
            <span className="text-slate-500">Ongkir {courier ? `(${courier.name})` : ""}</span>
            <span>{courier ? formatRupiah(shippingCost) : "—"}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold border-t border-slate-200 pt-1">
          <span>Total</span>
          <span className="text-teal-600">{formatRupiah(grandTotal)}</span>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        disabled={pending || !shippingReady || (isPhysical && !storeCanShip)}
        className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Memproses..." : isPhysical && !courier ? "Pilih kurir dulu" : "Beli Sekarang"}
      </button>
    </form>
  );
}
