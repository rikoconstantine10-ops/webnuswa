"use client";

import { useEffect, useRef, useState } from "react";

const WA_NUMBER = "6285181301622";
const WA_TEXT = "Halo+saya+minta+template+gratis";
const SESSION_KEY = "exit_popup_shown";

export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const shownRef = useRef(false);

  const show = () => {
    if (shownRef.current) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY)) return;
    shownRef.current = true;
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
    if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, "1");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    close();
    window.open(`https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`, "_blank");
  };

  const handleWA = () => {
    close();
    window.open(`https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`, "_blank");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const onMouseMove = (e: MouseEvent) => {
      if (e.clientY < 50) show();
    };

    document.addEventListener("mousemove", onMouseMove);

    const timer = setTimeout(show, 45_000);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .exit-card { animation: slideUp 0.35s ease forwards; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease forwards; }
      `}</style>

      <div className="exit-card relative bg-white rounded-2xl max-w-md w-full mx-4 p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors text-2xl leading-none"
          aria-label="Tutup"
        >
          &times;
        </button>

        {/* Headline */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Tunggu! Jangan Pergi Dulu 👋
        </h2>

        {/* Subheadline */}
        <p className="text-center text-gray-600 mb-5 text-sm leading-relaxed">
          Dapatkan <span className="font-semibold text-green-600">Template Caption IG Ads GRATIS</span> yang
          sudah terbukti menghasilkan <span className="font-semibold">3x lebih banyak klik</span>
        </p>

        {/* Value prop list */}
        <ul className="space-y-2 mb-6">
          {[
            "✅ 10 Template Caption High-Converting",
            "✅ Checklist Audit Iklan Meta",
            "✅ Formula Headline yang Viral",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-gray-700 text-sm">
              {item}
            </li>
          ))}
        </ul>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@kamu.com"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            Kirim Sekarang
          </button>
        </form>

        {/* Divider */}
        <p className="text-center text-xs text-gray-400 mb-3">
          Atau hubungi kami langsung via WhatsApp
        </p>

        {/* WA button */}
        <button
          onClick={handleWA}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-2 rounded-lg text-sm transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Chat WhatsApp Sekarang
        </button>
      </div>
    </div>
  );
}
