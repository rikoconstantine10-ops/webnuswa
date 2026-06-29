"use client";
import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";

interface NewsletterCaptureProps {
  title?: string;
  description?: string;
  buttonText?: string;
  placeholder?: string;
  source?: string;
}

export function NewsletterCapture({
  title = "Dapatkan Tips Digital Marketing",
  description = "Subscribe dan dapatkan artikel terbaru langsung ke email Anda.",
  buttonText = "Subscribe",
  placeholder = "Email Anda",
  source = "website",
}: NewsletterCaptureProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gagal subscribe. Coba lagi.");
        return;
      }
      setSubmitted(true);
      setEmail("");
    } catch {
      setError("Gagal terhubung. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[#f0f5f0] rounded-2xl p-8 text-center border border-[#d4e4d4]">
        <CheckCircle className="w-10 h-10 text-[#5C7A5A] mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 mb-1">Terima kasih!</h3>
        <p className="text-sm text-gray-500">Anda berhasil subscribe. Tips akan dikirim ke {email || "email Anda"}.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a2e1a] to-[#2d4a2d] rounded-2xl p-8 text-white">
      <Mail className="w-8 h-8 mb-4 opacity-80" />
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-300 mb-5">{description}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 bg-white text-[#2d4a2d] rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-60"
        >
          {loading ? "..." : buttonText}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
