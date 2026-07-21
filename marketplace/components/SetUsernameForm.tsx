"use client";

import { useActionState } from "react";
import { setUsernameAction } from "@/app/actions/auth";

export default function SetUsernameForm({ current }: { current?: string | null }) {
  const [state, formAction, pending] = useActionState(setUsernameAction, {
    username: current ?? undefined,
  });
  const value = state.username ?? current ?? "";

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden">
        <span className="px-3 py-2.5 text-sm text-slate-400 bg-slate-50 border-r border-slate-200">@</span>
        <input
          type="text"
          name="username"
          defaultValue={value}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="username_toko"
          className="flex-1 px-3 py-2.5 text-sm outline-none"
        />
      </div>
      <button
        disabled={pending}
        className="bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Username"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.saved && (
        <p className="text-sm text-teal-700 bg-teal-50 rounded-lg px-3 py-2">
          Username tersimpan. Kamu bisa masuk pakai <b>@{state.username}</b> + password.
        </p>
      )}
    </form>
  );
}
