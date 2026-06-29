'use client';
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Check, X, Minus } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";

const WA_NUMBER = "6285181301622";

const CRITERIA = [
  {
    id: "strategi",
    en: "Data-driven strategy",
    label: "Strategi berbasis data",
  },
  {
    id: "fullstack",
    en: "Full-stack: ads + SEO + content + CRM",
    label: "Full-stack: iklan + SEO + konten + CRM",
  },
  {
    id: "dashboard",
    en: "Real-time performance dashboard",
    label: "Dashboard performa real-time",
  },
  {
    id: "ai",
    en: "AI-powered content & automation",
    label: "Konten & otomasi berbasis AI",
  },
  {
    id: "capi",
    en: "Meta CAPI server-side tracking",
    label: "Tracking Meta CAPI server-side",
  },
  {
    id: "dedicated",
    en: "Dedicated account manager",
    label: "Account manager dedicated",
  },
  {
    id: "transparan",
    en: "Transparent reporting",
    label: "Laporan transparan & jujur",
  },
  {
    id: "scale",
    en: "Scales with your business",
    label: "Skalabel sesuai bisnis Anda",
  },
  {
    id: "harga",
    en: "Competitive pricing",
    label: "Harga kompetitif",
  },
  {
    id: "garansi",
    en: "Guaranteed results in contract",
    label: "Hasil dijamin dalam kontrak",
  },
];

type Score = "yes" | "no" | "partial";

const COLUMNS: {
  keyId: string;
  keyEn: string;
  color: string;
  highlight?: boolean;
  scores: Record<string, Score>;
}[] = [
  {
    keyId: "Nuswalab",
    keyEn: "Nuswalab",
    color: "#4a7c59",
    highlight: true,
    scores: {
      strategi: "yes",
      fullstack: "yes",
      dashboard: "yes",
      ai: "yes",
      capi: "yes",
      dedicated: "yes",
      transparan: "yes",
      scale: "yes",
      harga: "yes",
      garansi: "yes",
    },
  },
  {
    keyId: "Freelancer",
    keyEn: "Freelancer",
    color: "#7c6a4a",
    scores: {
      strategi: "partial",
      fullstack: "no",
      dashboard: "no",
      ai: "partial",
      capi: "no",
      dedicated: "partial",
      transparan: "partial",
      scale: "no",
      harga: "yes",
      garansi: "no",
    },
  },
  {
    keyId: "Agency Umum",
    keyEn: "Generic Agency",
    color: "#4a5f7c",
    scores: {
      strategi: "partial",
      fullstack: "partial",
      dashboard: "partial",
      ai: "no",
      capi: "no",
      dedicated: "partial",
      transparan: "partial",
      scale: "partial",
      harga: "no",
      garansi: "no",
    },
  },
  {
    keyId: "Kelola Sendiri",
    keyEn: "DIY",
    color: "#7c4a4a",
    scores: {
      strategi: "no",
      fullstack: "no",
      dashboard: "no",
      ai: "partial",
      capi: "no",
      dedicated: "no",
      transparan: "yes",
      scale: "no",
      harga: "yes",
      garansi: "no",
    },
  },
];

const WINS = [
  {
    stat: "+340%",
    label: { id: "Traffic organik (4 bulan)", en: "Organic traffic (4 months)" },
    color: "#4a7c59",
  },
  {
    stat: "6.2x",
    label: { id: "ROAS Meta Ads", en: "Meta Ads ROAS" },
    color: "#7c4a6e",
  },
  {
    stat: "-65%",
    label: { id: "Cost per lead", en: "Cost per lead" },
    color: "#4a5f7c",
  },
  {
    stat: "45%",
    label: { id: "Revenue naik dalam 6 bulan", en: "Revenue growth in 6 months" },
    color: "#7c6a4a",
  },
];

function ScoreIcon({ score }: { score: Score }) {
  if (score === "yes") return <Check className="w-5 h-5 text-green-600" />;
  if (score === "no") return <X className="w-5 h-5 text-red-400" />;
  return <Minus className="w-5 h-5 text-amber-400" />;
}

export default function KenapaNuswalabPage() {
  const locale = useLocale();
  const isEn = locale === "en";

  const waMsg = encodeURIComponent(
    isEn
      ? "Hi Nuswalab! I want to discuss digital marketing for my business."
      : "Halo Nuswalab! Saya ingin konsultasi digital marketing untuk bisnis saya."
  );

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="section-padding" style={{ background: "oklch(0.97 0.005 145)" }}>
        <div className="container-custom text-center max-w-3xl mx-auto">
          <AnimateOnScroll>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "#4a7c5920", color: "#4a7c59" }}>
              {isEn ? "Why Nuswalab?" : "Kenapa Nuswalab?"}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-5" style={{ fontFamily: "var(--font-display)" }}>
              {isEn ? (
                <>Nuswalab vs <span className="text-gradient">The Alternatives</span></>
              ) : (
                <>Nuswalab vs <span className="text-gradient">Alternatif Lainnya</span></>
              )}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {isEn
                ? "An honest comparison — data speaks louder than promises."
                : "Perbandingan jujur — data lebih berbicara daripada janji."}
            </p>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex"
            >
              {isEn ? "Get Free Consultation" : "Konsultasi Gratis"}
            </a>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Win Stats */}
      <section className="py-10" style={{ background: "oklch(0.98 0.003 265)" }}>
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {WINS.map((w) => (
              <AnimateOnScroll key={w.stat}>
                <div className="shimmer-card rounded-2xl p-5 text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: w.color }}>{w.stat}</div>
                  <div className="text-xs text-muted-foreground">{isEn ? w.label.en : w.label.id}</div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="section-padding" style={{ background: "oklch(0.98 0.003 265)" }}>
        <div className="container-custom">
          <AnimateOnScroll>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ fontFamily: "var(--font-display)" }}>
              {isEn ? "Feature Comparison" : "Perbandingan Fitur"}
            </h2>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr style={{ background: "oklch(0.96 0.005 265)" }}>
                    <th className="text-left px-5 py-4 text-sm font-semibold w-1/3">
                      {isEn ? "Criteria" : "Kriteria"}
                    </th>
                    {COLUMNS.map((col) => (
                      <th
                        key={col.keyId}
                        className="text-center px-4 py-4 text-sm font-bold"
                        style={col.highlight ? { color: col.color } : { color: "var(--muted-foreground)" }}
                      >
                        {isEn ? col.keyEn : col.keyId}
                        {col.highlight && (
                          <span className="ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded-full" style={{ background: `${col.color}18`, color: col.color }}>
                            {isEn ? "Recommended" : "Pilihan"}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRITERIA.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? "white" : "oklch(0.99 0.002 265)" }}>
                      <td className="px-5 py-3.5 text-sm font-medium">
                        {isEn ? c.en : c.label}
                      </td>
                      {COLUMNS.map((col) => (
                        <td key={col.keyId} className="px-4 py-3.5 text-center">
                          <div className="flex justify-center">
                            <ScoreIcon score={col.scores[c.id]} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {isEn ? "✓ = Full support   − = Partial   ✗ = Not offered" : "✓ = Penuh   − = Sebagian   ✗ = Tidak tersedia"}
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Why Us Cards */}
      <section className="section-padding" style={{ background: "oklch(0.97 0.005 145)" }}>
        <div className="container-custom">
          <AnimateOnScroll>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ fontFamily: "var(--font-display)" }}>
              {isEn ? "What Makes Nuswalab Different" : "Apa yang Membuat Nuswalab Berbeda"}
            </h2>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "📊",
                titleId: "Laporan Real-Time",
                titleEn: "Real-Time Reporting",
                descId: "Dashboard performa yang bisa Anda akses kapan saja — tidak perlu menunggu laporan bulanan untuk tahu iklan Anda bekerja atau tidak.",
                descEn: "A performance dashboard accessible anytime — no waiting for monthly reports to know if your ads are working.",
              },
              {
                icon: "🤖",
                titleId: "AI + Human Expertise",
                titleEn: "AI + Human Expertise",
                descId: "Kami menggabungkan kecepatan AI dengan judgement manusia berpengalaman. Hasilnya: konten berkualitas tinggi dengan volume yang tidak mungkin dilakukan manual.",
                descEn: "We combine AI speed with experienced human judgment — high-quality content at a volume impossible to achieve manually.",
              },
              {
                icon: "🎯",
                titleId: "Full-Stack Marketing",
                titleEn: "Full-Stack Marketing",
                descId: "SEO, iklan berbayar, social media, email, CRM — semua dari satu tim yang saling terkoordinasi. Tidak ada silo, tidak ada brief yang hilang di antara vendor.",
                descEn: "SEO, paid ads, social media, email, CRM — all from one coordinated team. No silos, no briefs lost between vendors.",
              },
              {
                icon: "🔒",
                titleId: "Server-Side Tracking",
                titleEn: "Server-Side Tracking",
                descId: "Tracking Meta CAPI kami berjalan di server, bukan browser — sehingga data iklan Anda akurat meski pengguna memakai ad blocker atau iOS 17.",
                descEn: "Our Meta CAPI tracking runs server-side — so your ad data stays accurate even when users have ad blockers or iOS 17.",
              },
              {
                icon: "💬",
                titleId: "Dedicated Account Manager",
                titleEn: "Dedicated Account Manager",
                descId: "Satu kontak yang tahu bisnis Anda dari awal sampai akhir — tidak perlu mengulang brief setiap kali ada pergantian tim.",
                descEn: "One contact who knows your business end-to-end — no rebriefing every time there's a team change.",
              },
              {
                icon: "📈",
                titleId: "Skalabel Sesuai Pertumbuhan",
                titleEn: "Scales With Your Growth",
                descId: "Mulai dari paket Starter, naik ke Enterprise saat bisnis tumbuh — tanpa harus pindah vendor atau kehilangan historical data.",
                descEn: "Start with Starter, scale to Enterprise as you grow — no vendor switching or losing historical data.",
              },
            ].map((item, i) => (
              <AnimateOnScroll key={item.titleId} delay={i * 60}>
                <div className="shimmer-card rounded-2xl p-6 h-full">
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="font-bold text-base mb-2">{isEn ? item.titleEn : item.titleId}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{isEn ? item.descEn : item.descId}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding" style={{ background: "linear-gradient(135deg, #1a2e1a, #2d4a2d)" }}>
        <div className="container-custom text-center max-w-2xl mx-auto">
          <AnimateOnScroll>
            <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
              {isEn ? "Ready to stop guessing?" : "Siap berhenti menebak-nebak?"}
            </h2>
            <p className="text-gray-300 mb-8">
              {isEn
                ? "Book a free 30-minute strategy call. No pitch, just analysis."
                : "Booking strategy call gratis 30 menit. Tidak ada presentasi panjang, hanya analisis bisnis Anda."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#2d4a2d] rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                {isEn ? "WhatsApp Consultation" : "Konsultasi via WhatsApp"}
              </a>
              <Link
                href={`/${locale}/harga`}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/30 text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
              >
                {isEn ? "See Pricing" : "Lihat Harga"}
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  );
}
