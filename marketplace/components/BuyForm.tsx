"use client";

import { useActionState } from "react";
import { checkoutAction } from "@/app/actions/checkout";
import { PAYMENT_TYPES } from "@/lib/louvin";

type Props = {
  productId: string;
  productType: string;
  maxQty: number | null;
  defaultName?: string;
  defaultEmail?: string;
};

export default function BuyForm({ productId, productType, maxQty, defaultName, defaultEmail }: Props) {
  const [state, formAction, pending] = useActionState(checkoutAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium w-28">Jumlah</label>
        <input
          type="number"
          name="qty"
          min={1}
          max={maxQty ?? undefined}
          defaultValue={1}
          className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

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
          {PAYMENT_TYPES.map((pt, i) => (
            <label
              key={pt.id}
              className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 text-sm cursor-pointer has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50"
            >
              <input type="radio" name="paymentType" value={pt.id} defaultChecked={i === 0} required />
              {pt.label}
            </label>
          ))}
        </div>
      </div>

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
