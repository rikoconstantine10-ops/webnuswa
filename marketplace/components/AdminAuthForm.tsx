"use client";

import { useState } from "react";
import { useActionState } from "react";
import { TurnstileWidget, TURNSTILE_SITE_KEY } from "./TurnstileWidget";
import PasswordField from "./PasswordField";
import {
  adminRequestOtpAction,
  adminVerifyOtpAction,
  adminPasswordLoginAction,
} from "@/app/actions/auth";

function OtpTab() {
  const [state, formAction, pending] = useActionState(
    async (prev: { step: string; email: string; error?: string }, formData: FormData) => {
      if (prev.step === "otp" && formData.get("code")) {
        return adminVerifyOtpAction(prev, formData);
      }
      return adminRequestOtpAction(prev, formData);
    },
    { step: "email", email: "" }
  );
  const [turnstileReady, setTurnstileReady] = useState(!TURNSTILE_SITE_KEY);

  return (
    <form action={formAction} className="space-y-4">
      {state.step === "email" ? (
        <>
          <input
            type="email"
            name="email"
            required
            placeholder="Email admin"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm"
          />
          <TurnstileWidget onReadyChange={setTurnstileReady} resetSignal={state} />
          <button
            disabled={pending || !turnstileReady}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "Mengirim kode..." : turnstileReady ? "Kirim Kode OTP" : "Menyiapkan verifikasi keamanan..."}
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
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50"
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

function PasswordTab() {
  const [state, formAction, pending] = useActionState(adminPasswordLoginAction, {});
  const [turnstileReady, setTurnstileReady] = useState(!TURNSTILE_SITE_KEY);

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="email"
        name="email"
        required
        placeholder="Email admin"
        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm"
      />
      <PasswordField
        name="password"
        placeholder="Password"
        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm pr-16"
      />
      <TurnstileWidget onReadyChange={setTurnstileReady} resetSignal={state} />
      <button
        disabled={pending || !turnstileReady}
        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Memproses..." : turnstileReady ? "Masuk dengan Password" : "Menyiapkan verifikasi keamanan..."}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      <p className="text-xs text-slate-500">
        Belum atur password? Masuk pakai Kode OTP, lalu atur password di halaman Akun.
      </p>
    </form>
  );
}

export default function AdminAuthForm() {
  const [tab, setTab] = useState<"otp" | "password">("otp");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setTab("otp")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            tab === "otp" ? "bg-white shadow text-slate-900" : "text-slate-500"
          }`}
        >
          Kode OTP
        </button>
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            tab === "password" ? "bg-white shadow text-slate-900" : "text-slate-500"
          }`}
        >
          Password
        </button>
      </div>

      {tab === "otp" ? <OtpTab /> : <PasswordTab />}
    </div>
  );
}
