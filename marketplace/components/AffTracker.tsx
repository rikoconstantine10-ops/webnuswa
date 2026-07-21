"use client";

import { useEffect } from "react";

// Jika URL memuat ?aff=KODE, simpan sebagai cookie 30 hari agar komisi
// terhitung saat checkout (dibaca server action).
export default function AffTracker() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("aff");
    if (code && /^[A-Za-z0-9]{3,20}$/.test(code)) {
      document.cookie = `nm_aff=${code.toUpperCase()}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
    }
  }, []);
  return null;
}
