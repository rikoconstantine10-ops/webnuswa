"use client";

import { useActionState } from "react";
import { setPasswordAction } from "@/app/actions/auth";
import PasswordField from "./PasswordField";

export default function SetPasswordForm() {
  const [state, formAction, pending] = useActionState(setPasswordAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <PasswordField
        name="password"
        placeholder="Password baru (min. 8 karakter)"
        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm pr-16"
      />
      <button
        disabled={pending}
        className="bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Password"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.saved && (
        <p className="text-sm text-teal-700 bg-teal-50 rounded-lg px-3 py-2">
          Password tersimpan. Kamu bisa masuk ke dashboard toko pakai email + password ini.
        </p>
      )}
    </form>
  );
}
