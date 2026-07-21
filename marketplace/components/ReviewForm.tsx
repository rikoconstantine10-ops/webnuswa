"use client";

import { useActionState, useState } from "react";
import { submitReviewAction } from "@/app/actions/reviews";

type Props = { code: string; productId: string; productName: string };

export default function ReviewForm({ code, productId, productName }: Props) {
  const [state, formAction, pending] = useActionState(submitReviewAction, {});
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);

  if (state.ok) {
    return (
      <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
        ✓ Terima kasih, ulasanmu untuk {productName} tersimpan.
      </p>
    );
  }

  return (
    <form action={formAction} className="border border-slate-200 rounded-xl p-3 space-y-2">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <p className="text-sm font-semibold">Beri ulasan: {productName}</p>
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className={(hover || rating) >= n ? "text-amber-500" : "text-slate-300"}
            aria-label={`${n} bintang`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        rows={2}
        placeholder="Ceritakan pengalamanmu (opsional)"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        disabled={pending}
        className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </form>
  );
}
