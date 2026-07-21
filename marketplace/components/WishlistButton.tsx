"use client";

import { useActionState } from "react";
import { toggleWishlistAction } from "@/app/actions/account";

export default function WishlistButton({
  productId,
  initial,
}: {
  productId: string;
  initial: boolean;
}) {
  const [state, action, pending] = useActionState(toggleWishlistAction, { inWishlist: initial });
  const active = state.inWishlist ?? initial;

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="productId" value={productId} />
      <button
        disabled={pending}
        className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl border transition disabled:opacity-50 cursor-pointer ${
          active
            ? "border-red-300 bg-red-50 text-red-600"
            : "border-slate-300 bg-white text-slate-700 hover:border-red-300 hover:text-red-600"
        }`}
      >
        {active ? "❤️ Tersimpan di Favorit" : "🤍 Simpan ke Favorit"}
      </button>
      {state.error && <p className="text-xs text-red-500 mt-1">{state.error}</p>}
    </form>
  );
}
