"use client";

import { useEffect, useRef, useState } from "react";

const WA_NUMBER = "6285181301622";
const SESSION_KEY = "ai_chat_opened";

interface Message {
  id: number;
  role: "bot" | "user";
  text: string;
}

const QUICK_REPLIES = [
  "💰 Harga Layanan",
  "📊 Lihat Portofolio",
  "📞 Hubungi Kami",
  "🔍 Audit Gratis",
];

function getBotResponse(input: string): string {
  const t = input.toLowerCase();

  if (/halo|hi\b|hello|hai/.test(t)) {
    return "Halo! 👋 Selamat datang di Nuswalab. Kami siap bantu bisnis kamu tumbuh lewat digital marketing. Ada yang bisa saya bantu?";
  }
  if (/harga|berapa|price|cost/.test(t)) {
    return "Harga layanan kami disesuaikan dengan kebutuhan dan skala bisnis kamu. Mulai dari Rp 3 juta/bulan untuk paket dasar. Yuk, konsultasi gratis dulu biar kami bisa kasih penawaran yang tepat! 👉 https://wa.me/" + WA_NUMBER;
  }
  if (/facebook|fb ads|meta/.test(t)) {
    return "Facebook & Instagram Ads adalah layanan unggulan kami 🚀. Klien kami rata-rata mencapai ROAS 4–8x. Kami handle mulai dari creative, targeting, sampai optimasi harian. Mau tau lebih lanjut?";
  }
  if (/google|seo/.test(t)) {
    return "Google Ads & SEO kami sudah terbukti meningkatkan traffic organik hingga 300% dan cost per lead lebih efisien. Tim kami bersertifikasi Google Partner 🏆. Mau konsultasi?";
  }
  if (/tiktok/.test(t)) {
    return "TikTok Ads sedang jadi salah satu channel terpanas saat ini! 🔥 Kami bantu kamu buat konten dan iklan yang viral. Cocok untuk brand yang mau menjangkau Gen Z & Millennial.";
  }
  if (/landing page|website/.test(t)) {
    return "Landing Page & CRO kami dirancang untuk konversi maksimal. Rata-rata klien kami mengalami peningkatan conversion rate 2–5x setelah optimasi. Cek portofolio kami di nuswalab.com/portofolio 📄";
  }
  if (/audit|konsultasi/.test(t)) {
    return "Audit Marketing GRATIS tersedia untuk kamu! 🔍 Kami akan analisis iklan, website, dan strategi kamu secara menyeluruh. Mulai di: nuswalab.com/tools/audit atau langsung chat WA kami 👉 https://wa.me/" + WA_NUMBER;
  }
  if (/roi|hasil|result/.test(t)) {
    return "Hasil nyata dari klien kami 📈:\n• E-commerce fashion: ROAS 6.2x dalam 3 bulan\n• Properti: leads +240% dengan CPL turun 45%\n• F&B: omzet online naik 3x dalam 6 bulan\nMau case study lengkapnya?";
  }
  if (/berapa lama|how long/.test(t)) {
    return "Timeline umum: ⏱️\n• Setup & onboarding: 1–2 minggu\n• Iklan mulai berjalan: minggu ke-2\n• Hasil awal terlihat: 2–4 minggu\n• Optimasi penuh & hasil stabil: 1–3 bulan\nTergantung kompetisi industri dan budget ya!";
  }
  if (/portfolio|portofolio|case study/.test(t)) {
    return "Portofolio kami mencakup 100+ klien dari berbagai industri 🏆:\n• 50+ brand e-commerce\n• 20+ properti developer\n• 30+ bisnis F&B & lifestyle\nCek lengkapnya di nuswalab.com/portofolio";
  }
  if (/whatsapp|wa\b|contact|hubungi/.test(t)) {
    return "Langsung chat tim kami via WhatsApp ya! 📱\n👉 https://wa.me/" + WA_NUMBER + "\nRespon cepat di jam kerja 09.00–18.00 WIB (Senin–Sabtu).";
  }
  return "Saya bisa bantu info seputar layanan nuswalab. Ketik 'harga', 'facebook ads', 'google ads', 'seo', 'landing page', atau 'konsultasi' untuk info lebih detail! Atau langsung chat WA kami 👉 https://wa.me/" + WA_NUMBER;
}

function QuickReplyToMessage(label: string): string {
  if (label.includes("Harga")) return "harga layanan";
  if (label.includes("Portofolio")) return "portofolio";
  if (label.includes("Hubungi")) return "hubungi";
  if (label.includes("Audit")) return "audit gratis";
  return label;
}

let msgId = 0;
function nextId() { return ++msgId; }

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">N</span>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: "bot",
      text: "Halo! 👋 Saya asisten virtual Nuswalab. Ada yang bisa saya bantu seputar digital marketing?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-open after 10s once per session
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 10_000);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: nextId(), role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const botText = getBotResponse(text);
      setTyping(false);
      setMessages((prev) => [...prev, { id: nextId(), role: "bot", text: botText }]);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (label: string) => {
    sendMessage(QuickReplyToMessage(label));
  };

  return (
    <>
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-window { animation: chatSlideUp 0.25s ease forwards; }
        @keyframes chatBubblePop {
          0%   { transform: scale(0.8); opacity: 0; }
          70%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        .chat-bubble-btn { animation: chatBubblePop 0.4s ease forwards; }
      `}</style>

      {/* Chat window */}
      {open && (
        <div
          className="chat-window fixed bottom-24 left-4 z-50 w-[350px] max-w-[calc(100vw-2rem)] h-[480px] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">N</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">Nuswalab Assistant</p>
              <p className="text-blue-100 text-xs">Online · Biasanya membalas cepat</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white text-xl leading-none transition-colors"
              aria-label="Tutup chat"
            >
              &times;
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                {msg.role === "bot" ? (
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">N</span>
                ) : (
                  <span className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold shrink-0">U</span>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[75%] px-4 py-2 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "bot"
                      ? "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm"
                      : "bg-blue-600 text-white rounded-2xl rounded-br-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="px-3 pb-2 flex gap-2 flex-wrap shrink-0">
            {QUICK_REPLIES.map((label) => (
              <button
                key={label}
                onClick={() => handleQuickReply(label)}
                className="text-xs border border-blue-300 text-blue-700 rounded-full px-3 py-1 hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 px-3 py-3 border-t border-gray-200/60 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
              aria-label="Kirim"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating bubble trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="chat-bubble-btn fixed bottom-6 left-4 z-50 flex flex-col items-center gap-1 group"
        aria-label="Buka chat"
      >
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
          {open ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
          )}
          {/* Unread dot */}
          {!open && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
          )}
        </div>
        <span className="text-xs font-semibold text-gray-700 bg-white/90 px-2 py-0.5 rounded-full shadow text-center leading-tight">
          Tanya Kami
        </span>
      </button>
    </>
  );
}
