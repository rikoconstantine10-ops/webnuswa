"use client";

import { useActionState } from "react";
import { subscribeProAction } from "@/app/actions/promote";

const initial: { error?: string; ok?: boolean } = {};

export default function SubscribeButton({ price, active }: { price: number; active: boolean }) {
  const [state, action, pending] = useActionState(subscribeProAction, initial);
  return (
    <form action={action} className="space-y-2">
      <button
        disabled={pending}
        className="bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
      >
        {pending ? "Memproses..." : active ? `Perpanjang 30 hari — Rp${price.toLocaleString("id-ID")}` : `Langganan Pro — Rp${price.toLocaleString("id-ID")}/bln`}
      </button>
      {state.ok && <p className="text-emerald-600 text-sm">✓ Langganan Pro aktif. Terima kasih!</p>}
      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
    </form>
  );
}
