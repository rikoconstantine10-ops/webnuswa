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
    };
  }
}

export function TurnstileWidget({ onReadyChange }: { onReadyChange?: (ready: boolean) => void }) {
  const [token, setToken] = useState("");
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  function renderWidget() {
    if (renderedRef.current || !containerRef.current || !window.turnstile) return;
    renderedRef.current = true;
    window.turnstile.render(containerRef.current, {
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
