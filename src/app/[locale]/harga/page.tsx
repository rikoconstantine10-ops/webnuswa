"use client";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { useState } from "react";
import { useLocale } from "next-intl";
import { CheckCircle, MessageCircle, HelpCircle } from "lucide-react";

const WA = "6285181301622";

function PricingCard({ pkg, isEn }: { pkg: { name: string; price: string; period: string; features: string[]; popular: boolean; waText: string; badge?: string }; isEn: boolean }) {
  return (
    <div className="relative rounded-2xl p-8 flex flex-col" style={{ background: pkg.popular ? "rgba(74,124,89,0.12)" : "rgba(255,255,255,0.04)", border: pkg.popular ? "2px solid #4a7c59" : "1px solid rgba(255,255,255,0.1)", boxShadow: pkg.popular ? "0 0 40px rgba(74,124,89,0.15)" : "none" }}>
      {pkg.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: "#4a7c59", color: "#fff" }}>
          {pkg.badge || (isEn ? "POPULAR" : "POPULER")}
        </div>
      )}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{pkg.name}</h2>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: "#4a7c59" }}>{pkg.price}</span>
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
      <a href={`https://wa.me/${WA}?text=${pkg.waText}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5" style={{ background: pkg.popular ? "#4a7c59" : "transparent", color: pkg.popular ? "#fff" : "#4a7c59", border: pkg.popular ? "none" : "2px solid #4a7c59" }}>
        <MessageCircle className="w-4 h-4" />
        {isEn ? "Get Started" : "Mulai Sekarang"}
      </a>
    </div>
  );
}

const CATEGORIES = ["SEO Content", "Iklan Digital", "Social Media", "Branding & Web", "Performance", "AI Content"] as const;
type Category = typeof CATEGORIES[number];

export default function HargaPage() {
  const locale = useLocale();
  const isEn = locale === "en";
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Category>("SEO Content");

  const wa = (text: string) => encodeURIComponent(text);

  const allPackages: Record<Category, { name: string; price: string; period: string; features: string[]; popular: boolean; waText: string; badge?: string }[]> = {
    "SEO Content": [
      { name: "Starter", price: "Rp 750.000", period: isEn ? "/month" : "/bulan", popular: false, waText: wa("Halo, saya tertarik paket SEO Content Starter Nuswalab"), features: isEn ? ["4 SEO articles/month", "800-1000 words/article", "Keyword research included", "Published to your blog", "Monthly report"] : ["4 artikel SEO/bulan", "800-1000 kata/artikel", "Keyword research included", "Publish ke blog Anda", "Laporan bulanan"] },
      { name: "Growth", price: "Rp 1.500.000", period: isEn ? "/month" : "/bulan", popular: true, waText: wa("Halo, saya tertarik paket SEO Content Growth Nuswalab"), features: isEn ? ["8 SEO articles/month", "1000-1500 words/article", "Keyword research + competitor analysis", "Auto internal linking", "Weekly report", "Priority support"] : ["8 artikel SEO/bulan", "1000-1500 kata/artikel", "Keyword research + competitor analysis", "Internal linking otomatis", "Laporan mingguan", "Priority support"] },
      { name: "Agency", price: "Rp 3.000.000", period: isEn ? "/month" : "/bulan", popular: false, waText: wa("Halo, saya tertarik paket SEO Content Agency Nuswalab"), features: isEn ? ["20 SEO articles/month", "1500-2000 words/article", "Full keyword strategy", "Multi-website support", "White-label report", "Dedicated account manager"] : ["20 artikel SEO/bulan", "1500-2000 kata/artikel", "Full keyword strategy", "Multi-website support", "White-label report", "Dedicated account manager"] },
    ],
    "Iklan Digital": [
      { name: "Starter", price: "Rp 1.500.000", period: isEn ? "/month" : "/bulan", popular: false, waText: wa("Halo, saya tertarik paket Iklan Digital Starter Nuswalab"), features: isEn ? ["1 ad platform (Meta or Google)", "Ad budget up to Rp 5jt/month", "Creative 2x/month", "Weekly optimization", "Monthly report"] : ["1 platform iklan (Meta atau Google)", "Budget iklan hingga Rp 5jt/bulan", "Kreatif 2x/bulan", "Optimasi mingguan", "Laporan bulanan"] },
      { name: "Growth", price: "Rp 3.000.000", period: isEn ? "/month" : "/bulan", popular: true, waText: wa("Halo, saya tertarik paket Iklan Digital Growth Nuswalab"), features: isEn ? ["2 ad platforms (Meta + Google)", "Ad budget up to Rp 20jt/month", "Creative 4x/month", "Daily optimization", "Weekly report", "Landing page review"] : ["2 platform iklan (Meta + Google)", "Budget iklan hingga Rp 20jt/bulan", "Kreatif 4x/bulan", "Optimasi harian", "Laporan mingguan", "Review landing page"] },
      { name: "Agency", price: "Rp 6.000.000", period: isEn ? "/month" : "/bulan", popular: false, waText: wa("Halo, saya tertarik paket Iklan Digital Agency Nuswalab"), features: isEn ? ["All platforms (Meta+Google+TikTok)", "Unlimited budget management", "Creative 8x/month", "A/B testing", "White-label report", "Dedicated account manager"] : ["Semua platform (Meta+Google+TikTok)", "Manajemen budget tidak terbatas", "Kreatif 8x/bulan", "A/B testing", "White-label report", "Dedicated account manager"] },
    ],
    "Social Media": [
      { name: "Basic", price: "Rp 1.200.000", period: isEn ? "/month" : "/bulan", popular: false, waText: wa("Halo, saya tertarik paket Social Media Basic Nuswalab"), features: isEn ? ["12 posts/month", "1 platform", "Caption + hashtag", "Content calendar", "Monthly report"] : ["12 postingan/bulan", "1 platform", "Caption + hashtag", "Kalender konten", "Laporan bulanan"] },
      { name: "Pro", price: "Rp 2.500.000", period: isEn ? "/month" : "/bulan", popular: true, waText: wa("Halo, saya tertarik paket Social Media Pro Nuswalab"), features: isEn ? ["20 posts/month", "3 platforms", "Design + caption + hashtag", "Stories 2x/week", "Community management", "Weekly report"] : ["20 postingan/bulan", "3 platform", "Desain + caption + hashtag", "Stories 2x/minggu", "Community management", "Laporan mingguan"] },
      { name: "Agency", price: "Rp 5.000.000", period: isEn ? "/month" : "/bulan", popular: false, waText: wa("Halo, saya tertarik paket Social Media Agency Nuswalab"), features: isEn ? ["30 posts/month", "5 platforms", "Video Reels/TikTok included", "Daily stories", "Influencer coordination", "White-label report"] : ["30 postingan/bulan", "5 platform", "Video Reels/TikTok termasuk", "Stories harian", "Koordinasi influencer", "White-label report"] },
    ],
    "Branding & Web": [
      { name: "Starter", price: "Rp 3.500.000", period: isEn ? "one-time" : "sekali bayar", popular: false, waText: wa("Halo, saya tertarik paket Branding Starter Nuswalab"), features: isEn ? ["Logo design (3 concepts)", "Brand color palette", "Typography selection", "Business card design", "Brand guideline PDF"] : ["Desain logo (3 konsep)", "Palet warna brand", "Pemilihan tipografi", "Desain kartu nama", "Brand guideline PDF"] },
      { name: "Business", price: "Rp 7.500.000", period: isEn ? "one-time" : "sekali bayar", popular: true, waText: wa("Halo, saya tertarik paket Branding Business Nuswalab"), features: isEn ? ["Complete brand identity", "Website (5 pages)", "Social media templates", "Email template", "Presentation template", "6-month revisions"] : ["Identitas brand lengkap", "Website (5 halaman)", "Template sosial media", "Template email", "Template presentasi", "Revisi 6 bulan"] },
      { name: "Premium", price: "Rp 15.000.000", period: isEn ? "one-time" : "sekali bayar", popular: false, waText: wa("Halo, saya tertarik paket Branding Premium Nuswalab"), features: isEn ? ["Full brand strategy", "Website + landing pages", "Video brand story", "Photography direction", "Full asset library", "1-year support"] : ["Strategi brand penuh", "Website + landing pages", "Video brand story", "Arahan fotografi", "Library aset lengkap", "Support 1 tahun"] },
    ],
    "Performance": [
      { name: "Basic", price: "Rp 1.500.000", period: isEn ? "/month" : "/bulan", popular: false, waText: wa("Halo, saya tertarik paket Performance Dashboard Basic Nuswalab"), features: isEn ? ["1 platform integration", "Daily auto-report", "3 KPI metrics", "PDF export", "Email delivery"] : ["1 integrasi platform", "Auto-report harian", "3 metrik KPI", "Export PDF", "Kirim via email"] },
      { name: "Pro", price: "Rp 3.000.000", period: isEn ? "/month" : "/bulan", popular: true, waText: wa("Halo, saya tertarik paket Performance Dashboard Pro Nuswalab"), features: isEn ? ["Unlimited platforms", "Daily + weekly + monthly reports", "Unlimited KPI metrics", "Smart alerts", "Client portal access", "White-label export"] : ["Platform tak terbatas", "Laporan harian + mingguan + bulanan", "KPI tak terbatas", "Notifikasi cerdas", "Akses portal klien", "Export white-label"] },
      { name: "Agency", price: "Custom", period: isEn ? "contact us" : "hubungi kami", popular: false, waText: wa("Halo, saya tertarik paket Performance Dashboard Agency Nuswalab"), features: isEn ? ["Unlimited client dashboards", "Dedicated account manager", "Custom branding", "API access", "24/7 support"] : ["Dashboard klien tak terbatas", "Dedicated account manager", "Branding kustom", "Akses API", "Support 24/7"] },
    ],
    "AI Content": [
      { name: "Starter", price: "Rp 2.000.000", period: isEn ? "/month" : "/bulan", popular: false, waText: wa("Halo, saya tertarik paket AI Content Starter Nuswalab"), features: isEn ? ["20 articles/month", "60 social posts/month", "Basic SEO optimization", "1 platform", "Monthly report"] : ["20 artikel/bulan", "60 postingan sosial/bulan", "Optimasi SEO dasar", "1 platform", "Laporan bulanan"] },
      { name: "Growth", price: "Rp 4.500.000", period: isEn ? "/month" : "/bulan", popular: true, waText: wa("Halo, saya tertarik paket AI Content Growth Nuswalab"), features: isEn ? ["60 articles/month", "Unlimited social posts", "Advanced SEO + keywords", "5 platforms", "Ad copy included", "Weekly report"] : ["60 artikel/bulan", "Postingan sosial tak terbatas", "SEO lanjutan + keyword", "5 platform", "Copy iklan termasuk", "Laporan mingguan"] },
      { name: "Enterprise", price: "Custom", period: isEn ? "contact us" : "hubungi kami", popular: false, waText: wa("Halo, saya tertarik paket AI Content Enterprise Nuswalab"), features: isEn ? ["Unlimited articles", "Multi-brand management", "Custom AI model", "Dedicated content team", "API integration"] : ["Artikel tak terbatas", "Manajemen multi-brand", "Model AI kustom", "Tim konten dedikasi", "Integrasi API"] },
    ],
  };

  const faqs = isEn
    ? [
        { q: "Can I combine packages from different categories?", a: "Yes, we offer multi-service bundles. Contact us for a custom quote." },
        { q: "Is there a contract or long-term commitment?", a: "Monthly packages have no contract — cancel anytime. One-time packages are project-based." },
        { q: "How do I pay?", a: "Bank transfer (BCA/Mandiri/BRI). Invoice is sent monthly for recurring packages." },
        { q: "Can I request a trial before committing?", a: "Yes, we offer a free consultation and sample deliverables for most services." },
      ]
    : [
        { q: "Bisakah saya menggabungkan paket dari kategori yang berbeda?", a: "Ya, kami menawarkan bundle multi-layanan. Hubungi kami untuk penawaran kustom." },
        { q: "Apakah ada kontrak atau komitmen jangka panjang?", a: "Paket bulanan tidak ada kontrak — bisa cancel kapan saja. Paket sekali bayar bersifat berbasis proyek." },
        { q: "Bagaimana cara bayar?", a: "Transfer bank BCA/Mandiri/BRI. Invoice dikirim setiap bulan untuk paket berulang." },
        { q: "Apakah ada masa trial sebelum berkomitmen?", a: "Ya, kami menawarkan konsultasi gratis dan contoh deliverable untuk sebagian besar layanan." },
      ];

  return (
    <>
      <Nav />
      <div className="min-h-screen" style={{ background: "#0a1a0a", color: "#fff" }}>
        <section className="relative pt-36 pb-16 lg:pt-48 lg:pb-20 overflow-hidden">
          <div className="absolute w-[600px] h-[600px] rounded-full -top-40 left-1/4 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(74,124,89,0.18) 0%, transparent 70%)" }} />
          <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center relative">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs uppercase tracking-widest mb-6 border" style={{ color: "#4a7c59", borderColor: "rgba(74,124,89,0.3)", background: "rgba(74,124,89,0.08)" }}>
              {isEn ? "Pricing & Packages" : "Harga & Paket"}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              <span style={{ color: "#4a7c59" }}>{isEn ? "Transparent Pricing," : "Harga Transparan,"}</span>
              <br />
              <span className="text-white">{isEn ? "Real Results" : "Hasil Nyata"}</span>
            </h1>
            <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "#9ca3af" }}>
              {isEn
                ? "Choose from our range of digital marketing packages. All prices are transparent — no hidden fees."
                : "Pilih dari rangkaian paket digital marketing kami. Semua harga transparan — tidak ada biaya tersembunyi."}
            </p>
          </div>
        </section>

        {/* Tab navigation */}
        <div className="mx-auto max-w-7xl px-4 lg:px-8 mb-12">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
                style={{
                  background: activeTab === cat ? "#4a7c59" : "rgba(255,255,255,0.06)",
                  color: activeTab === cat ? "#fff" : "#9ca3af",
                  border: activeTab === cat ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <section className="pb-20 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8">
              {allPackages[activeTab].map((pkg) => (
                <PricingCard key={pkg.name} pkg={pkg} isEn={isEn} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4" style={{ background: "#071207" }}>
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {isEn ? <>Frequently <span style={{ color: "#4a7c59" }}>Asked Questions</span></> : <>Pertanyaan yang <span style={{ color: "#4a7c59" }}>Sering Ditanya</span></>}
              </h2>
              <p style={{ color: "#9ca3af" }}>{isEn ? "Find answers to your questions below" : "Temukan jawaban atas pertanyaan Anda di bawah ini"}</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <button className="w-full flex items-center justify-between p-6 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className="font-semibold flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#4a7c59" }} />
                      {faq.q}
                    </span>
                    <span className="ml-4 flex-shrink-0 text-xl font-bold transition-transform duration-200" style={{ color: "#4a7c59", transform: openFaq === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                  </button>
                  {openFaq === i && <div className="px-6 pb-6" style={{ color: "#9ca3af" }}>{faq.a}</div>}
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <p className="mb-4" style={{ color: "#9ca3af" }}>
                {isEn ? "Still have questions? Chat directly with our team." : "Masih ada pertanyaan? Chat langsung dengan tim kami."}
              </p>
              <a href={`https://wa.me/${WA}?text=${encodeURIComponent(isEn ? "Halo, I have a question about Nuswalab packages" : "Halo, saya ingin tanya tentang paket Nuswalab")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:opacity-90" style={{ background: "#4a7c59", color: "#fff" }}>
                <MessageCircle className="w-4 h-4" />
                {isEn ? "Chat via WhatsApp" : "Chat via WhatsApp"}
              </a>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
