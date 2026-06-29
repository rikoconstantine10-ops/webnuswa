'use client';
import { Link } from "@/navigation";
import { ArrowRight, FileText, Sparkles, Share2, Globe, RefreshCw, Clock } from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { FAQSection } from "@/components/ui/FAQSection";
import { PricingSection } from "@/components/ui/PricingSection";
import { RelatedServices } from "@/components/ui/RelatedServices";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { useLocale } from "next-intl";

export default function AIContentSystemPage() {
  const locale = useLocale();
  const isEn = locale === 'en';

  const features = [
    { icon: <Sparkles className="w-6 h-6" />, title: isEn ? "AI Blog Writing" : "Penulisan Blog AI", desc: isEn ? "Generate SEO-optimized articles at scale — 10x faster than manual writing." : "Buat artikel teroptimasi SEO dalam skala besar — 10x lebih cepat dari penulisan manual." },
    { icon: <Share2 className="w-6 h-6" />, title: isEn ? "Social Media Content" : "Konten Media Sosial", desc: isEn ? "Automated daily posts for Instagram, TikTok, Facebook, Twitter, and LinkedIn." : "Postingan harian otomatis untuk Instagram, TikTok, Facebook, Twitter, dan LinkedIn." },
    { icon: <FileText className="w-6 h-6" />, title: isEn ? "Ad Copywriting" : "Copywriting Iklan", desc: isEn ? "High-converting ad copy generated with AI — tested against proven frameworks." : "Copywriting iklan berkonversi tinggi dibuat dengan AI — diuji dengan framework terbukti." },
    { icon: <Globe className="w-6 h-6" />, title: isEn ? "Product Descriptions" : "Deskripsi Produk", desc: isEn ? "Generate hundreds of unique product descriptions for your e-commerce catalog." : "Buat ratusan deskripsi produk unik untuk katalog e-commerce Anda." },
    { icon: <RefreshCw className="w-6 h-6" />, title: isEn ? "Content Repurposing" : "Repurposing Konten", desc: isEn ? "Turn one blog post into 10 social posts, emails, and ad copy automatically." : "Ubah satu artikel blog menjadi 10 postingan sosial, email, dan copy iklan secara otomatis." },
    { icon: <Clock className="w-6 h-6" />, title: isEn ? "Auto Scheduling" : "Penjadwalan Otomatis", desc: isEn ? "Content is auto-published at peak engagement times across all platforms." : "Konten dipublikasikan otomatis di waktu engagement terbaik di semua platform." },
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "Rp 2.000.000",
      period: isEn ? "/month" : "/bulan",
      desc: isEn ? "AI content for 1 brand." : "Konten AI untuk 1 brand.",
      features: [
        isEn ? "20 articles/month" : "20 artikel/bulan",
        isEn ? "60 social posts/month" : "60 postingan sosial/bulan",
        isEn ? "Basic SEO optimization" : "Optimasi SEO dasar",
        isEn ? "1 platform" : "1 platform",
        isEn ? "Monthly report" : "Laporan bulanan",
      ],
      cta: isEn ? "Get Started" : "Mulai",
      highlight: false,
    },
    {
      name: "Growth",
      price: "Rp 4.500.000",
      period: isEn ? "/month" : "/bulan",
      desc: isEn ? "Full content machine for growing brands." : "Mesin konten lengkap untuk brand yang berkembang.",
      features: [
        isEn ? "60 articles/month" : "60 artikel/bulan",
        isEn ? "Unlimited social posts" : "Postingan sosial tak terbatas",
        isEn ? "Advanced SEO + keywords" : "SEO lanjutan + keyword",
        isEn ? "5 platforms" : "5 platform",
        isEn ? "Ad copy included" : "Copy iklan termasuk",
        isEn ? "Weekly report" : "Laporan mingguan",
      ],
      cta: isEn ? "Choose Growth" : "Pilih Growth",
      highlight: true,
      badge: isEn ? "Popular" : "Populer",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: isEn ? "contact us" : "hubungi kami",
      desc: isEn ? "Full-scale content operation for agencies." : "Operasi konten skala penuh untuk agensi.",
      features: [
        isEn ? "Unlimited articles" : "Artikel tak terbatas",
        isEn ? "Multi-brand management" : "Manajemen multi-brand",
        isEn ? "Custom AI model fine-tuning" : "Fine-tuning model AI kustom",
        isEn ? "Dedicated content team" : "Tim konten dedikasi",
        isEn ? "API integration" : "Integrasi API",
      ],
      cta: isEn ? "Contact Us" : "Hubungi Kami",
      highlight: false,
    },
  ];

  return (
    <main>
      <Nav />
      <section className="relative pt-36 pb-16 lg:pt-48 lg:pb-24 overflow-hidden">
        <div className="orb orb-primary w-[600px] h-[600px] -top-40 -right-40 animate-orb" />
        <div className="container-custom relative">
          <div className="max-w-3xl">
            <AnimateOnScroll>
              <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                <Link href="/service" className="hover:text-primary">{isEn ? "Services" : "Layanan"}</Link>
                <span>/</span><span className="text-foreground font-medium">AI Content System</span>
              </nav>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 shimmer-card" style={{color:"var(--color-primary)"}}>
                <Sparkles className="w-4 h-4" /><span>AI-Powered Content</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{fontFamily:"var(--font-display)"}}>
                {isEn
                  ? <>Sistem Konten <span className="text-gradient">Berbasis AI</span> untuk Skala Bisnis Anda</>
                  : <>Sistem Konten <span className="text-gradient">Berbasis AI</span> untuk Skala Bisnis Anda</>}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {isEn
                  ? "Stop manually writing content. Let our AI content system produce SEO articles, social media posts, and ad copy at scale — consistent, on-brand, and always published on time."
                  : "Berhenti menulis konten secara manual. Biarkan sistem AI kami memproduksi artikel SEO, postingan media sosial, dan copy iklan dalam skala besar — konsisten, sesuai brand, dan selalu terbit tepat waktu."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contact" className="btn-primary">Konsultasi Gratis <ArrowRight className="w-4 h-4" /></Link>
                <Link href="/service/jasa-seo" className="btn-ghost">Lihat Jasa SEO <ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="flex items-center gap-6 mt-10">
                {[
                  {val:"10x", label: isEn ? "Faster" : "Lebih Cepat"},
                  {val:"60+", label: isEn ? "Posts/Month" : "Post/Bulan"},
                  {val:"100%", label: "On-brand"},
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl font-bold text-gradient">{s.val}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      <section className="section-padding" style={{background:"oklch(0.98 0.003 265)"}}>
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{fontFamily:"var(--font-display)"}}>
                {isEn ? <>Fitur <span className="text-gradient">AI Content</span></> : <>Fitur <span className="text-gradient">AI Content</span></>}
              </h2>
              <p className="text-muted-foreground">
                {isEn ? "Everything you need to run a full content operation on autopilot." : "Semua yang Anda butuhkan untuk menjalankan operasi konten penuh di autopilot."}
              </p>
            </div>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <AnimateOnScroll key={f.title} delay={i * 80}>
                <div className="shimmer-card rounded-2xl p-6 h-full group hover:scale-[1.02] transition-transform duration-300">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{background:"oklch(0.92 0.04 265)", color:"var(--color-primary)"}}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <PricingSection
        title={isEn ? "AI Content Packages" : "Paket AI Content"}
        subtitle={isEn ? "Choose a plan that matches your content needs." : "Pilih paket yang sesuai kebutuhan konten Anda."}
        tiers={pricingTiers}
      />
      <RelatedServices items={[
        {label:"AI Automation", href:"/service/ai-automation", desc:"Otomasi proses bisnis dengan AI"},
        {label:"Jasa SEO", href:"/service/jasa-seo", desc:"Dominasi pencarian Google"},
        {label:"Social Media Management", href:"/service/social-media-management", desc:"Kelola semua sosmed dalam satu tempat"},
        {label:"Performance Dashboard", href:"/service/performance-dashboard", desc:"Pantau semua performa iklan"},
      ]} />
      <FAQSection title="FAQ" faqs={[
        {q:"Konten AI apa kualitasnya? Apakah terdeteksi AI?", a:"Konten kami melalui proses editorial manusia sebelum dipublikasikan. Kami pastikan tone, gaya, dan fakta sesuai brand Anda."},
        {q:"Berapa lama setup sistem AI content?", a:"Biasanya 7-14 hari kerja untuk onboarding, brief brand, dan konfigurasi pipeline konten."},
        {q:"Apakah saya bisa review konten sebelum dipublikasikan?", a:"Ya, ada opsi approval workflow di mana Anda bisa review dan approve setiap konten sebelum publish."},
        {q:"Platform apa saja yang didukung?", a:"Instagram, TikTok, Facebook, Twitter/X, LinkedIn, WordPress, Blogspot, Tokopedia, dan Shopee."},
      ]} />
      <Footer />
    </main>
  );
}
