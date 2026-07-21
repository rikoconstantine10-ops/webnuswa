"use client";

import { useActionState, useState } from "react";
import { boostProductAction } from "@/app/actions/promote";

const initial: { error?: string; ok?: boolean } = {};

export default function BoostButton({
  productId,
  boostedUntil,
}: {
  productId: string;
  boostedUntil: Date | string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(boostProductAction, initial);
  const active = boostedUntil ? new Date(boostedUntil).getTime() > Date.now() : false;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-amber-600 font-semibold hover:underline cursor-pointer"
        title={active ? `Aktif s/d ${new Date(boostedUntil as string).toLocaleDateString("id-ID")}` : undefined}
      >
        {active ? "⭐ Boosted" : "Boost"}
      </button>
    );
  }

  return (
    <form action={action} className="inline-flex items-center gap-1 align-middle">
      <input type="hidden" name="productId" value={productId} />
      <select
        name="days"
        defaultValue="7"
        className="border border-slate-300 rounded-lg px-1.5 py-1 text-xs"
      >
        <option value="3">3 hari</option>
        <option value="7">7 hari</option>
        <option value="14">14 hari</option>
        <option value="30">30 hari</option>
      </select>
      <button
        disabled={pending}
        className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
      >
        {pending ? "..." : "Bayar"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-slate-400 text-xs cursor-pointer">
        ✕
      </button>
      {state.ok && <span className="text-emerald-600 text-xs">✓</span>}
      {state.error && <span className="text-red-500 text-[10px] max-w-[140px]">{state.error}</span>}
    </form>
  );
}
