"use client";

import { useActionState, useState } from "react";
import { checkoutAction } from "@/app/actions/checkout";
import { PAYMENT_TYPES, MIN_VA_AMOUNT, isPaymentTypeAllowed } from "@/lib/louvin";
import { formatRupiah } from "@/lib/money";

type Variant = { id: string; name: string; price: number; stock: number | null };
type Tier = { minQty: number; price: number };
type Addon = { id: string; name: string; price: number };

type Props = {
  productId: string;
  productType: string;
  price: number;
  maxQty: number | null;
  variants: Variant[];
  tiers: Tier[];
  addons?: Addon[];
  defaultName?: string;
  defaultEmail?: string;
};

export default function BuyForm({
  productId,
  productType,
  price,
  maxQty,
  variants,
  tiers,
  addons = [],
  defaultName,
  defaultEmail,
}: Props) {
  const [state, formAction, pending] = useActionState(checkoutAction, {});
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string>(variants[0]?.id ?? "");
  const [addonSel, setAddonSel] = useState<Record<string, boolean>>({});

  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
  const variant = variants.find((v) => v.id === variantId);

  // Cermin dari logika server: varian > grosir > harga dasar.
  let unitPrice = price;
  if (variant) unitPrice = variant.price;
  else {
    const tier = [...tiers].sort((a, b) => b.minQty - a.minQty).find((t) => safeQty >= t.minQty);
    if (tier) unitPrice = tier.price;
  }
  const addonTotal = addons.reduce((s, a) => (addonSel[a.id] ? s + a.price : s), 0);
  const subtotal = unitPrice * safeQty + addonTotal;
  const effectiveMax = variant ? variant.stock : maxQty;

  const available = PAYMENT_TYPES.filter((pt) => isPaymentTypeAllowed(pt.id, subtotal));
  const vaHidden = available.length < PAYMENT_TYPES.length;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />

      {variants.length > 0 && (
        <div>
          <label className="text-sm font-medium block mb-1.5">Pilih varian</label>
          <input type="hidden" name="variantId" value={variantId} />
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const out = productType === "PHYSICAL" && v.stock !== null && v.stock <= 0;
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

      {productType === "PHYSICAL" && (
        <textarea
          name="shippingAddress"
          required
          rows={3}
          placeholder="Alamat pengiriman lengkap (jalan, kecamatan, kota, kode pos)"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      )}

      <div>
        <label className="text-sm font-medium block mb-1.5">Metode pembayaran</label>
        <div className="grid grid-cols-2 gap-2">
          {available.map((pt, i) => (
            <label
              key={pt.id}
              className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 text-sm cursor-pointer has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50"
            >
              <input type="radio" name="paymentType" value={pt.id} defaultChecked={i === 0} required />
              {pt.label}
            </label>
          ))}
        </div>
        {vaHidden && (
          <p className="text-xs text-slate-400 mt-1.5">
            Virtual Account tersedia untuk pembelian minimal {formatRupiah(MIN_VA_AMOUNT)}.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
        <span className="text-slate-500">
          Subtotal ({formatRupiah(unitPrice)} × {safeQty})
        </span>
        <span className="font-bold">{formatRupiah(subtotal)}</span>
      </div>
      <p className="text-xs text-slate-400">
        Biaya admin pembayaran (jika ada) ditampilkan di halaman pembayaran.
      </p>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        disabled={pending}
        className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Memproses..." : "Beli Sekarang"}
      </button>
    </form>
  );
}
