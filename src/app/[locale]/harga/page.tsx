"use client";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { useState } from "react";
import { CheckCircle, MessageCircle, HelpCircle } from "lucide-react";

const packages = [
  {
    name: "Starter",
    price: "Rp 750.000",
    period: "/bulan",
    features: [
      "4 artikel SEO/bulan",
      "800-1000 kata per artikel",
      "Keyword research included",
      "Publish ke blog Anda",
      "Laporan bulanan",
    ],
    popular: false,
    waText: "Halo%2C%20saya%20tertarik%20paket%20Starter%20Nuswalab",
  },
  {
    name: "Growth",
    price: "Rp 1.500.000",
    period: "/bulan",
    features: [
      "8 artikel SEO/bulan",
      "1000-1500 kata per artikel",
      "Keyword research + competitor analysis",
      "Publish ke blog Anda",
      "Internal linking otomatis",
      "Laporan mingguan",
      "Priority support",
    ],
    popular: true,
    waText: "Halo%2C%20saya%20tertarik%20paket%20Growth%20Nuswalab",
  },
  {
    name: "Agency",
    price: "Rp 3.000.000",
    period: "/bulan",
    features: [
      "20 artikel SEO/bulan",
      "1500-2000 kata per artikel",
      "Full keyword strategy",
      "Multi-website support",
      "White-label report",
      "Dedicated account manager",
      "Custom topik & kalender konten",
    ],
    popular: false,
    waText: "Halo%2C%20saya%20tertarik%20paket%20Agency%20Nuswalab",
  },
];

const faqs = [
  {
    q: "Apakah artikel bisa langsung publish?",
    a: "Ya, kami publish langsung ke WordPress/website Anda",
  },
  {
    q: "Berapa lama kontrak?",
    a: "Tidak ada kontrak, bisa cancel kapan saja",
  },
  {
    q: "Bagaimana cara bayar?",
    a: "Transfer bank BCA/Mandiri/BRI, invoice dikirim setiap bulan",
  },
  {
    q: "Apakah bisa request topik?",
    a: "Ya, Anda bisa request topik atau kami yang riset keyword terbaik",
  },
];

export default function HargaPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
              Harga & Paket
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              <span style={{ color: "#4a7c59" }}>Harga Transparan,</span>
              <br />
              <span className="text-white">Hasil Nyata</span>
            </h1>
            <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "#9ca3af" }}>
              Pilih paket konten SEO yang sesuai dengan kebutuhan bisnis Anda. Semua paket sudah termasuk riset keyword dan publish ke website.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className="relative rounded-2xl p-8 flex flex-col"
                  style={{
                    background: pkg.popular ? "rgba(74,124,89,0.12)" : "rgba(255,255,255,0.04)",
                    border: pkg.popular ? "2px solid #4a7c59" : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: pkg.popular ? "0 0 40px rgba(74,124,89,0.15)" : "none",
                  }}
                >
                  {pkg.popular && (
                    <div
                      className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                      style={{ background: "#4a7c59", color: "#fff" }}
                    >
                      POPULER
                    </div>
                  )}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{pkg.name}</h2>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold" style={{ color: "#4a7c59" }}>
                        {pkg.price}
                      </span>
                      <span style={{ color: "#9ca3af" }}>{pkg.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#4a7c59" }} />
                        <span style={{ color: "#d1d5db" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`https://wa.me/6285181301622?text=${pkg.waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
                    style={{
                      background: pkg.popular ? "#4a7c59" : "transparent",
                      color: pkg.popular ? "#fff" : "#4a7c59",
                      border: pkg.popular ? "none" : "2px solid #4a7c59",
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Mulai Sekarang
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4" style={{ background: "#071207" }}>
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pertanyaan yang <span style={{ color: "#4a7c59" }}>Sering Ditanya</span>
              </h2>
              <p style={{ color: "#9ca3af" }}>Temukan jawaban atas pertanyaan Anda di bawah ini</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <button
                    className="w-full flex items-center justify-between p-6 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-semibold flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#4a7c59" }} />
                      {faq.q}
                    </span>
                    <span
                      className="ml-4 flex-shrink-0 text-xl font-bold transition-transform duration-200"
                      style={{
                        color: "#4a7c59",
                        transform: openFaq === i ? "rotate(45deg)" : "rotate(0)",
                      }}
                    >
                      +
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6" style={{ color: "#9ca3af" }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="mb-4" style={{ color: "#9ca3af" }}>
                Masih ada pertanyaan? Chat langsung dengan tim kami.
              </p>
              <a
                href="https://wa.me/6285181301622?text=Halo%2C%20saya%20ingin%20tanya%20tentang%20paket%20Nuswalab"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:opacity-90"
                style={{ background: "#4a7c59", color: "#fff" }}
              >
                <MessageCircle className="w-4 h-4" />
                Chat via WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
