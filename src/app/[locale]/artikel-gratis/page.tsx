"use client";
import { useState } from "react";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { FileText, Download, Loader2, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";

type ArticleResult = {
  title: string;
  content_preview: string;
  word_count: number;
  seo_score: number | null;
  download_url: string | null;
  slug: string;
};

const PROGRESS_STEPS = [
  "Menganalisis keyword...",
  "Riset kompetitor...",
  "Menulis artikel...",
  "Optimasi SEO...",
  "Finalisasi konten...",
];

export default function ArtikelGratisPage() {
  const [keyword, setKeyword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<ArticleResult | null>(null);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setLimitReached(false);
    setProgressStep(0);

    const interval = setInterval(() => {
      setProgressStep(prev => {
        if (prev < PROGRESS_STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 5000);

    try {
      const res = await fetch("http://localhost:3003/api/leads/free-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), business_name: businessName.trim(), email: email.trim() }),
      });
      const data = await res.json();
      clearInterval(interval);
      if (res.status === 429) {
        setLimitReached(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
      setResult(data);
    } catch (e: unknown) {
      clearInterval(interval);
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-aurora opacity-60" />
      <div className="fixed inset-0 -z-10 bg-grid" />
      <Nav />

      <section className="relative pt-36 pb-16 lg:pt-48 lg:pb-20" style={{ background: "linear-gradient(135deg, #0d1f0d 0%, #1a2e1a 60%, #0d1f0d 100%)" }}>
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-6 font-semibold" style={{ background: "rgba(92,122,90,0.2)", color: "#8fba8c", border: "1px solid rgba(92,122,90,0.4)" }}>
              <FileText className="w-3.5 h-3.5" /> Gratis 1 Artikel
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ fontFamily: "var(--font-display)" }}>
              Dapatkan Artikel SEO Gratis
            </h1>
            <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
              Masukkan keyword bisnis Anda, kami buat artikel SEO-ready dalam 30 detik. Download .docx langsung.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16" style={{ background: "#0a1a0a" }}>
        <div className="container-custom max-w-xl mx-auto">
          {!result && !limitReached && (
            <form onSubmit={handleSubmit} className="space-y-4 p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div>
                <label className="block text-white/70 text-sm mb-2">Keyword Target *</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="Contoh: jasa catering jakarta selatan"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-white/30 outline-none disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Nama Bisnis</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Contoh: Catering Bu Sari"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-white/30 outline-none disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@anda.com"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-white/30 outline-none disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "#4a7c59" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {loading ? PROGRESS_STEPS[progressStep] : "Buat Artikel Sekarang"}
              </button>
              {error && (
                <div className="p-3 rounded-lg text-red-400 text-sm text-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                  {error}
                </div>
              )}
            </form>
          )}

          {limitReached && (
            <div className="p-8 rounded-2xl text-center" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.3)" }}>
              <AlertCircle className="w-10 h-10 mx-auto mb-4" style={{ color: "#fb923c" }} />
              <h3 className="text-white font-semibold text-xl mb-2">Kuota Artikel Gratis Habis</h3>
              <p className="text-white/60 mb-6">Anda sudah mendapatkan 1 artikel gratis bulan ini. Upgrade ke paket berbayar untuk artikel lebih banyak.</p>
              <a href="/harga" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white" style={{ background: "#4a7c59" }}>
                Lihat Paket Konten Bulanan <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h2 className="text-white font-bold text-xl leading-tight">{result.title}</h2>
                  <div className="flex gap-3 flex-shrink-0 text-sm">
                    <span className="px-3 py-1 rounded-full" style={{ background: "rgba(92,122,90,0.2)", color: "#8fba8c" }}>
                      {result.word_count} kata
                    </span>
                    {result.seo_score && (
                      <span className="px-3 py-1 rounded-full" style={{ background: "rgba(92,122,90,0.2)", color: "#8fba8c" }}>
                        SEO {result.seo_score}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="prose prose-invert prose-sm max-w-none text-white/70 line-clamp-[10]"
                  dangerouslySetInnerHTML={{ __html: result.content_preview }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {result.download_url && (
                  <a
                    href={`http://localhost:3003${result.download_url}`}
                    download
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-lg font-semibold text-white"
                    style={{ background: "#4a7c59" }}
                  >
                    <Download className="w-4 h-4" /> Download .docx
                  </a>
                )}
                <a
                  href="/harga"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-lg font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                >
                  Mau 4 artikel/bulan? <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="p-5 rounded-xl text-center" style={{ background: "rgba(92,122,90,0.1)", border: "1px solid rgba(92,122,90,0.2)" }}>
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
                <p className="text-white/70 text-sm">Artikel juga dikirim ke email Anda.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16" style={{ background: "#071207" }}>
        <div className="container-custom max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Paket Konten Bulanan</h2>
          <p className="text-white/60 mb-6">Artikel SEO premium setiap bulan, otomatis dipublikasikan ke website Anda.</p>
          <a href="/harga" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white" style={{ background: "#4a7c59" }}>
            Lihat Harga & Paket <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
