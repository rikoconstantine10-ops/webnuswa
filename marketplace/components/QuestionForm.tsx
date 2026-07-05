"use client";

import { useActionState } from "react";
import { askQuestionAction } from "@/app/actions/questions";

const initial: { error?: string; ok?: boolean } = {};

export default function QuestionForm({ productId, loggedIn }: { productId: string; loggedIn: boolean }) {
  const [state, action, pending] = useActionState(askQuestionAction, initial);

  if (state.ok) {
    return (
      <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
        ✓ Pertanyaanmu terkirim. Penjual akan segera menjawab.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="productId" value={productId} />
      {!loggedIn && (
        <input
          name="askerName"
          placeholder="Nama kamu"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      )}
      <textarea
        name="question"
        required
        rows={2}
        placeholder="Tulis pertanyaan tentang produk ini…"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />
      {state.error && <p className="text-xs text-red-500">{state.error}</p>}
      <button
        disabled={pending}
        className="bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-900 disabled:opacity-50 cursor-pointer"
      >
        {pending ? "Mengirim…" : "Kirim Pertanyaan"}
      </button>
    </form>
  );
}
