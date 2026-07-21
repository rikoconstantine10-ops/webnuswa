"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

// resetSignal: nilai apa saja yang berubah tiap kali sebuah submit attempt selesai
// (biasanya objek state dari useActionState). Token Turnstile cuma bisa dipakai
// sekali — begitu satu percobaan submit terkirim ke server, token itu langsung
// "terbakar" di sisi Cloudflare walau attempt-nya gagal karena alasan lain
// (mis. password salah). Tanpa reset ini, percobaan submit berikutnya akan selalu
// gagal dengan "Verifikasi keamanan gagal" walau widget-nya masih tampil "Success!".
export function TurnstileWidget({
  onReadyChange,
  resetSignal,
}: {
  onReadyChange?: (ready: boolean) => void;
  resetSignal?: unknown;
}) {
  const [token, setToken] = useState("");
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const skipNextResetRef = useRef(true);

  function renderWidget() {
    if (widgetIdRef.current || !containerRef.current || !window.turnstile) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY!,
      callback: (t) => {
        setToken(t);
        setFailed(false);
        onReadyChange?.(true);
      },
      "error-callback": () => {
        setFailed(true);
        onReadyChange?.(false);
      },
      "expired-callback": () => {
        setToken("");
        onReadyChange?.(false);
      },
    });
  }

  useEffect(() => {
    if (window.turnstile) renderWidget();
  }, []);

  useEffect(() => {
    if (skipNextResetRef.current) {
      skipNextResetRef.current = false;
      return;
    }
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setToken("");
      onReadyChange?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  if (!TURNSTILE_SITE_KEY) return null;

  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div ref={containerRef} />
      <input type="hidden" name="turnstileToken" value={token} />
      {failed && (
        <p className="text-xs text-red-500">
          Verifikasi keamanan gagal dimuat. Coba muat ulang halaman atau nonaktifkan pemblokir
          iklan/skrip untuk challenges.cloudflare.com.
        </p>
      )}
    </div>
  );
}
