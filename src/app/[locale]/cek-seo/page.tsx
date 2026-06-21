"use client";
import { useState } from "react";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Search, Lock, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

type Check = {
  name: string;
  passed: boolean | null;
  detail: string;
  points: number;
  earned: number;
  locked?: boolean;
};

type SeoResult = {
  score: number;
  url: string;
  checks: Check[];
};

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#4ade80" : score >= 40 ? "#facc15" : "#f87171";
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
        <circle cx="72" cy="72" r={r} stroke={color} strokeWidth="10" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div className="text-center">
        <div className="text-4xl font-bold text-white">{score}</div>
        <div className="text-xs text-white/60">/ 100</div>
      </div>
    </div>
  );
}

export default function CekSeoPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [fullResult, setFullResult] = useState<SeoResult | null>(null);
  const [capturing, setCapturing] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setFullResult(null);
    setEmailSent(false);
    try {
      const res = await fetch("http://localhost:3003/api/leads/seo-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Tidak bisa mengakses URL tersebut");
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !result) return;
    setCapturing(true);
    try {
      const res = await fetch("http://localhost:3003/api/leads/seo-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
      setFullResult(data);
      setEmailSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mengirim laporan");
    } finally {
      setCapturing(false);
    }
  };

  const displayResult = fullResult || result;
  const checks = displayResult?.checks || [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-aurora opacity-60" />
      <div className="fixed inset-0 -z-10 bg-grid" />
      <Nav />

      <section className="relative pt-36 pb-16 lg:pt-48 lg:pb-20" style={{ background: "linear-gradient(135deg, #0d1f0d 0%, #1a2e1a 60%, #0d1f0d 100%)" }}>
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-6 font-semibold" style={{ background: "rgba(92,122,90,0.2)", color: "#8fba8c", border: "1px solid rgba(92,122,90,0.4)" }}>
              <Search className="w-3.5 h-3.5" /> Tools Gratis
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ fontFamily: "var(--font-display)" }}>
              Cek Skor SEO Website Anda
            </h1>
            <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
              Analisis 10 faktor SEO dalam hitungan detik. Gratis, tanpa daftar.
            </p>

            <form onSubmit={handleCheck} className="flex gap-3 max-w-xl mx-auto">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://website-anda.com"
                required
                className="flex-1 px-4 py-3 rounded-lg text-white placeholder-white/40 outline-none focus:ring-2"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2 disabled:opacity-50"
                style={{ background: "#4a7c59" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? "Mengecek..." : "Cek Sekarang"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 rounded-lg text-red-400 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {displayResult && (
        <section className="py-16" style={{ background: "#0a1a0a" }}>
          <div className="container-custom max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10 p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <ScoreRing score={displayResult.score} />
              <div>
                <div className="text-white/60 text-sm mb-1">Skor SEO untuk</div>
                <div className="text-white font-medium mb-2 break-all">{displayResult.url}</div>
                <div className="text-white/70 text-sm">
                  {displayResult.score >= 70 ? "👍 SEO Anda sudah cukup baik! Ada beberapa hal yang bisa ditingkatkan."
                    : displayResult.score >= 40 ? "⚠️ SEO Anda perlu perhatian. Ada beberapa masalah yang harus diperbaiki."
                    : "🚨 SEO Anda bermasalah. Segera perbaiki untuk meningkatkan visibilitas di Google."}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-10">
              {checks.map((c, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="mt-0.5 flex-shrink-0">
                    {c.locked ? <Lock className="w-5 h-5 text-white/30" />
                      : c.passed ? <CheckCircle className="w-5 h-5 text-green-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium text-sm ${c.locked ? "text-white/30" : "text-white"}`}>{c.name}</span>
                      <span className="text-xs flex-shrink-0" style={{ color: c.locked ? "rgba(255,255,255,0.2)" : c.passed ? "#4ade80" : "#f87171" }}>
                        {c.locked ? `?/${c.points}` : `${c.earned}/${c.points}`}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: c.locked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.55)" }}>{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {!emailSent ? (
              !fullResult && (
                <div className="p-6 rounded-2xl text-center" style={{ background: "rgba(92,122,90,0.15)", border: "1px solid rgba(92,122,90,0.3)" }}>
                  <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "#8fba8c" }} />
                  <h3 className="text-white font-semibold text-lg mb-2">Lihat Laporan Lengkap Gratis</h3>
                  <p className="text-white/60 text-sm mb-4">Masukkan email Anda untuk membuka semua hasil analisis + PDF dikirim ke inbox.</p>
                  <form onSubmit={handleCapture} className="flex gap-3 max-w-sm mx-auto">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@anda.com"
                      required
                      className="flex-1 px-4 py-2.5 rounded-lg text-white placeholder-white/40 outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                    />
                    <button
                      type="submit"
                      disabled={capturing}
                      className="px-5 py-2.5 rounded-lg font-semibold text-white text-sm disabled:opacity-50"
                      style={{ background: "#4a7c59" }}
                    >
                      {capturing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kirim"}
                    </button>
                  </form>
                </div>
              )
            ) : (
              <div className="p-6 rounded-2xl text-center" style={{ background: "rgba(74,172,95,0.1)", border: "1px solid rgba(74,172,95,0.3)" }}>
                <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-400" />
                <h3 className="text-white font-semibold">Laporan dikirim ke {email}</h3>
                <p className="text-white/60 text-sm mt-1">Cek inbox Anda dalam beberapa menit.</p>
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
