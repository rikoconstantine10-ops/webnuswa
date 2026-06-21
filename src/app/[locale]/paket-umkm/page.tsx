"use client";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { useState } from "react";
import { CheckCircle, MessageCircle, Star } from "lucide-react";

const benefits = [
  "Tanpa hire content writer",
  "Tanpa pusing riset keyword",
  "Artikel publish otomatis ke website",
  "Laporan progress setiap bulan",
];

const packages = [
  {
    name: "Mulai",
    price: "Rp 750.000",
    period: "/bulan",
    desc: "Cocok untuk usaha baru",
    features: [
      "4 artikel/bulan",
      "Cocok untuk usaha baru",
      "Keyword lokal (kota/kawasan)",
    ],
    recommended: false,
  },
  {
    name: "Tumbuh",
    price: "Rp 1.500.000",
    period: "/bulan",
    desc: "Cocok untuk usaha yang ingin scale",
    features: [
      "8 artikel/bulan",
      "Cocok untuk usaha yang ingin scale",
      "Keyword lokal + nasional",
      "Laporan Google Analytics",
    ],
    recommended: true,
  },
];

const jenisList = ["Kuliner", "Fashion", "Jasa", "Retail", "Properti", "Kesehatan", "Pendidikan", "Lainnya"];

export default function PaketUmkmPage() {
  const [form, setForm] = useState({
    bisnis: "",
    jenis: "",
    paket: "",
    wa: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `Halo, saya ingin daftar paket UMKM Nuswalab. Nama Bisnis: ${form.bisnis}, Jenis: ${form.jenis}, Paket: ${form.paket}, WA: ${form.wa}`
    );
    window.open(`https://wa.me/6285181301622?text=${text}`, "_blank");
  };

  return (
    <>
      <Nav />
      <div className="min-h-screen" style={{ background: "#0a1a0a", color: "#fff" }}>
        {/* Hero */}
        <section className="relative pt-36 pb-16 lg:pt-48 lg:pb-20 overflow-hidden">
          <div
            className="absolute w-[600px] h-[600px] rounded-full -top-40 left-1/4 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(74,124,89,0.18) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center relative">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs uppercase tracking-widest mb-6 border"
              style={{ color: "#4a7c59", borderColor: "rgba(74,124,89,0.3)", background: "rgba(74,124,89,0.08)" }}
            >
              Khusus UMKM Indonesia
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Konten SEO untuk UMKM Indonesia
              <br />
              <span style={{ color: "#4a7c59" }}>— Tanpa Ribet</span>
            </h1>
            <p className="text-base md:text-xl leading-relaxed max-w-2xl mx-auto mb-10" style={{ color: "#9ca3af" }}>
              Artikel SEO profesional yang bantu pelanggan temukan bisnis Anda di Google, mulai{" "}
              <span style={{ color: "#4a7c59", fontWeight: 700 }}>Rp 750 ribu/bulan.</span>
            </p>
            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {benefits.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ background: "rgba(74,124,89,0.12)", border: "1px solid rgba(74,124,89,0.3)", color: "#d1d5db" }}
                >
                  <CheckCircle className="w-4 h-4" style={{ color: "#4a7c59" }} />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pilih Paket <span style={{ color: "#4a7c59" }}>UMKM Anda</span>
              </h2>
              <p style={{ color: "#9ca3af" }}>Dua pilihan sederhana, disesuaikan dengan tahap bisnis Anda</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className="relative rounded-2xl p-8 flex flex-col"
                  style={{
                    background: pkg.recommended ? "rgba(74,124,89,0.12)" : "rgba(255,255,255,0.04)",
                    border: pkg.recommended ? "2px solid #4a7c59" : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: pkg.recommended ? "0 0 40px rgba(74,124,89,0.15)" : "none",
                  }}
                >
                  {pkg.recommended && (
                    <div
                      className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                      style={{ background: "#4a7c59", color: "#fff" }}
                    >
                      <Star className="w-3 h-3" />
                      REKOMENDASI
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">Paket {pkg.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold" style={{ color: "#4a7c59" }}>
                        {pkg.price}
                      </span>
                      <span style={{ color: "#9ca3af" }}>{pkg.period}</span>
                    </div>
                    <p className="text-sm" style={{ color: "#9ca3af" }}>{pkg.desc}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#4a7c59" }} />
                        <span style={{ color: "#d1d5db" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, paket: pkg.name }))}
                    className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:opacity-90"
                    style={{
                      background: form.paket === pkg.name ? "#4a7c59" : "transparent",
                      color: form.paket === pkg.name ? "#fff" : "#4a7c59",
                      border: "2px solid #4a7c59",
                    }}
                  >
                    {form.paket === pkg.name ? "✓ Dipilih" : `Pilih Paket ${pkg.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section className="py-20 px-4" style={{ background: "#071207" }}>
          <div className="mx-auto max-w-xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Daftar <span style={{ color: "#4a7c59" }}>Sekarang</span>
              </h2>
              <p style={{ color: "#9ca3af" }}>
                Isi form di bawah dan kami akan langsung hubungi Anda via WhatsApp
              </p>
            </div>
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-8 space-y-5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-2">Nama Bisnis</label>
                <input
                  type="text"
                  required
                  value={form.bisnis}
                  onChange={(e) => setForm({ ...form, bisnis: e.target.value })}
                  placeholder="Contoh: Warung Makan Bu Sari"
                  className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all"
                  style={{ background: "#0a1a0a", borderColor: "rgba(74,124,89,0.3)", color: "#fff" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Jenis Usaha</label>
                <select
                  required
                  value={form.jenis}
                  onChange={(e) => setForm({ ...form, jenis: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all"
                  style={{ background: "#0a1a0a", borderColor: "rgba(74,124,89,0.3)", color: form.jenis ? "#fff" : "#6b7280" }}
                >
                  <option value="" disabled>Pilih jenis usaha...</option>
                  {jenisList.map((j) => (
                    <option key={j} value={j} style={{ color: "#fff", background: "#0a1a0a" }}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Paket</label>
                <div className="flex gap-3">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.name}
                      type="button"
                      onClick={() => setForm({ ...form, paket: pkg.name })}
                      className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 text-sm"
                      style={{
                        background: form.paket === pkg.name ? "#4a7c59" : "transparent",
                        color: form.paket === pkg.name ? "#fff" : "#4a7c59",
                        border: "2px solid #4a7c59",
                      }}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>
                {!form.paket && (
                  <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Pilih paket untuk melanjutkan</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nomor WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={form.wa}
                  onChange={(e) => setForm({ ...form, wa: e.target.value })}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all"
                  style={{ background: "#0a1a0a", borderColor: "rgba(74,124,89,0.3)", color: "#fff" }}
                />
              </div>
              <button
                type="submit"
                disabled={!form.paket}
                className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#4a7c59", color: "#fff" }}
              >
                <MessageCircle className="w-4 h-4" />
                Daftar via WhatsApp
              </button>
              <p className="text-xs text-center" style={{ color: "#9ca3af" }}>
                Anda akan diarahkan ke WhatsApp kami setelah submit
              </p>
            </form>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
