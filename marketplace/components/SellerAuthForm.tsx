"use client";

import { useState } from "react";
import { useActionState } from "react";
import { TurnstileWidget, TURNSTILE_SITE_KEY } from "./TurnstileWidget";
import PasswordField from "./PasswordField";
import {
  sellerRequestOtpAction,
  sellerVerifyOtpAction,
  sellerPasswordLoginAction,
} from "@/app/actions/auth";

function GoogleButton() {
  return (
    <a
      href="/api/auth/google?next=/register-seller"
      className="w-full flex items-center justify-center gap-2 border border-slate-300 rounded-xl py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7z" />
        <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.9 39.7 16.4 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.6 5.6C39.9 37.5 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
      </svg>
      Lanjut dengan Google
    </a>
  );
}

function OtpTab() {
  const [state, formAction, pending] = useActionState(
    async (prev: { step: string; email: string; error?: string }, formData: FormData) => {
      if (prev.step === "otp" && formData.get("code")) {
        return sellerVerifyOtpAction(prev, formData);
      }
      return sellerRequestOtpAction(prev, formData);
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
            placeholder="Alamat email"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm"
          />
          <TurnstileWidget onReadyChange={setTurnstileReady} resetSignal={state} />
          <button
            disabled={pending || !turnstileReady}
            className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
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

function PasswordTab() {
  const [state, formAction, pending] = useActionState(sellerPasswordLoginAction, {});
  const [turnstileReady, setTurnstileReady] = useState(!TURNSTILE_SITE_KEY);

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="text"
        name="identifier"
        required
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Email atau username"
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
        className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Memproses..." : turnstileReady ? "Masuk dengan Password" : "Menyiapkan verifikasi keamanan..."}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      <p className="text-xs text-slate-500">
        Belum punya password/username? Masuk pakai Kode OTP, lalu atur di halaman Akun.
      </p>
    </form>
  );
}

export default function SellerAuthForm() {
  const [tab, setTab] = useState<"otp" | "password">("otp");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setTab("otp")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            tab === "otp" ? "bg-white shadow text-teal-700" : "text-slate-500"
          }`}
        >
          Kode OTP
        </button>
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            tab === "password" ? "bg-white shadow text-teal-700" : "text-slate-500"
          }`}
        >
          Password
        </button>
      </div>

      {tab === "otp" ? <OtpTab /> : <PasswordTab />}

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        atau
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleButton />
    </div>
  );
}
