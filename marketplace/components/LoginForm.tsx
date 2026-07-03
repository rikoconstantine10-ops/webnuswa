"use client";

import { useActionState } from "react";
import { requestOtpAction, verifyOtpAction } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    async (
      prev: { step: string; email: string; error?: string },
      formData: FormData
    ) => {
      if (prev.step === "otp" && formData.get("code")) {
        return verifyOtpAction(prev, formData);
      }
      return requestOtpAction(prev, formData);
    },
    { step: "email", email: "" }
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.step === "email" ? (
        <>
          <input
            type="email"
            name="email"
            required
            placeholder="Alamat email"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm"
          />
          <button
            disabled={pending}
            className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
          >
            {pending ? "Mengirim kode..." : "Kirim Kode OTP"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Kode OTP telah dikirim ke <b>{state.email}</b>
          </p>
          <input type="hidden" name="email" value={state.email} />
          <input
            type="text"
            name="code"
            required
            inputMode="numeric"
            maxLength={6}
            placeholder="6 digit kode"
            autoFocus
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em]"
          />
          <button
            disabled={pending}
            className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
          >
            {pending ? "Memverifikasi..." : "Masuk"}
          </button>
        </>
      )}
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
    </form>
  );
}
