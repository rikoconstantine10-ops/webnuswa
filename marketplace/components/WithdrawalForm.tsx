"use client";

import { useActionState } from "react";
import { requestWithdrawalAction } from "@/app/actions/seller";

export default function WithdrawalForm() {
  const [state, formAction, pending] = useActionState(requestWithdrawalAction, {});

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-start">
      <input
        type="number"
        name="amount"
        required
        min={10000}
        step={1000}
        placeholder="Nominal (min Rp 10.000)"
        className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm flex-1 min-w-48"
      />
      <button
        disabled={pending}
        className="bg-teal-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Memproses..." : "Tarik Dana"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
    </form>
  );
}
