'use client';
import { Link } from "@/navigation";
import { ArrowRight, Users, Settings, GitMerge, BookOpen, CheckCircle, Layers } from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { FAQSection } from "@/components/ui/FAQSection";
import { PricingSection } from "@/components/ui/PricingSection";
import { RelatedServices } from "@/components/ui/RelatedServices";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { useLocale } from "next-intl";

export default function CRMImplementationPage() {
  const locale = useLocale();
  const isEn = locale === 'en';

  const features = [
    { icon: <CheckCircle className="w-6 h-6" />, title: isEn ? "Needs Analysis" : "Analisis Kebutuhan", desc: isEn ? "Deep audit of your current workflow to identify the best CRM fit for your business." : "Audit mendalam workflow saat ini untuk menemukan CRM yang paling tepat bagi bisnis Anda." },
    { icon: <Layers className="w-6 h-6" />, title: isEn ? "Platform Selection" : "Pemilihan Platform", desc: isEn ? "We help you choose between HubSpot, Salesforce, Zoho, Pipedrive, or custom CRM." : "Kami bantu pilih antara HubSpot, Salesforce, Zoho, Pipedrive, atau CRM kustom." },
    { icon: <Settings className="w-6 h-6" />, title: isEn ? "Custom Configuration" : "Konfigurasi Kustom", desc: isEn ? "Full CRM setup tailored to your sales pipeline, deal stages, and team structure." : "Setup CRM penuh disesuaikan dengan pipeline penjualan, tahap deal, dan struktur tim Anda." },
    { icon: <GitMerge className="w-6 h-6" />, title: isEn ? "System Integration" : "Integrasi Sistem", desc: isEn ? "Connect CRM to your WhatsApp, email, website, marketplace, and accounting tools." : "Hubungkan CRM ke WhatsApp, email, website, marketplace, dan tools akuntansi Anda." },
    { icon: <BookOpen className="w-6 h-6" />, title: isEn ? "Team Training" : "Pelatihan Tim", desc: isEn ? "Hands-on training sessions so your team can use CRM confidently from day one." : "Sesi pelatihan langsung agar tim Anda bisa menggunakan CRM dengan percaya diri dari hari pertama." },
    { icon: <Users className="w-6 h-6" />, title: isEn ? "Ongoing Support" : "Dukungan Berkelanjutan", desc: isEn ? "3-month post-implementation support to ensure adoption and resolve any issues." : "Dukungan 3 bulan pasca implementasi untuk memastikan adopsi dan menyelesaikan masalah apa pun." },
  ];

  const pricingTiers = [
    {
      name: "Basic",
      price: "Rp 5.000.000",
      period: isEn ? "one-time" : "sekali bayar",
      desc: isEn ? "CRM setup for small teams (up to 5 users)." : "Setup CRM untuk tim kecil (hingga 5 pengguna).",
      features: [
        isEn ? "Needs analysis" : "Analisis kebutuhan",
        isEn ? "Platform recommendation" : "Rekomendasi platform",
        isEn ? "Basic CRM configuration" : "Konfigurasi CRM dasar",
        isEn ? "1 integration" : "1 integrasi",
        isEn ? "1-day team training" : "Pelatihan tim 1 hari",
        isEn ? "1-month support" : "Support 1 bulan",
      ],
      cta: isEn ? "Get Started" : "Mulai",
      highlight: false,
    },
    {
      name: "Business",
      price: "Rp 12.000.000",
      period: isEn ? "one-time" : "sekali bayar",
      desc: isEn ? "Full CRM implementation for growing teams." : "Implementasi CRM penuh untuk tim yang berkembang.",
      features: [
        isEn ? "Full needs analysis" : "Analisis kebutuhan penuh",
        isEn ? "Platform selection + licensing" : "Pemilihan platform + lisensi",
        isEn ? "Advanced CRM configuration" : "Konfigurasi CRM lanjutan",
        isEn ? "Up to 5 integrations" : "Hingga 5 integrasi",
        isEn ? "3-day team training" : "Pelatihan tim 3 hari",
        isEn ? "3-month support" : "Support 3 bulan",
        isEn ? "Custom reports & dashboards" : "Laporan & dashboard kustom",
      ],
      cta: isEn ? "Choose Business" : "Pilih Business",
      highlight: true,
      badge: isEn ? "Popular" : "Populer",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: isEn ? "contact us" : "hubungi kami",
      desc: isEn ? "Enterprise CRM for large organizations." : "CRM enterprise untuk organisasi besar.",
      features: [
        isEn ? "Custom CRM development" : "Pengembangan CRM kustom",
        isEn ? "Unlimited integrations" : "Integrasi tak terbatas",
        isEn ? "Data migration" : "Migrasi data",
        isEn ? "Dedicated implementation team" : "Tim implementasi dedikasi",
        isEn ? "12-month support" : "Support 12 bulan",
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
                <span>/</span><span className="text-foreground font-medium">CRM Implementation</span>
              </nav>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 shimmer-card" style={{color:"var(--color-primary)"}}>
                <Users className="w-4 h-4" /><span>Customer Relationship</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{fontFamily:"var(--font-display)"}}>
                {isEn
                  ? <>Implementasi <span className="text-gradient">CRM</span> yang Tepat untuk Tim Sales Anda</>
                  : <>Implementasi <span className="text-gradient">CRM</span> yang Tepat untuk Tim Sales Anda</>}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {isEn
                  ? "Stop losing leads in WhatsApp chats and spreadsheets. We implement and configure the right CRM system so your sales team can close more deals, faster."
                  : "Berhenti kehilangan leads di chat WhatsApp dan spreadsheet. Kami implementasi dan konfigurasi sistem CRM yang tepat agar tim sales Anda bisa closing lebih banyak deal, lebih cepat."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contact" className="btn-primary">Konsultasi Gratis <ArrowRight className="w-4 h-4" /></Link>
                <Link href="/service/whatsapp-business" className="btn-ghost">Lihat WhatsApp Business <ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="flex items-center gap-6 mt-10">
                {[
                  {val:"3x", label: isEn ? "More Deals" : "Lebih Banyak Deal"},
                  {val:"50%", label: isEn ? "Less Admin" : "Admin Berkurang"},
                  {val:"100%", label: isEn ? "Adoption" : "Adopsi"},
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
                {isEn ? <>Layanan <span className="text-gradient">CRM</span> Kami</> : <>Layanan <span className="text-gradient">CRM</span> Kami</>}
              </h2>
              <p className="text-muted-foreground">
                {isEn ? "End-to-end CRM implementation — from selection to adoption." : "Implementasi CRM end-to-end — dari pemilihan hingga adopsi."}
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
        title={isEn ? "CRM Implementation Packages" : "Paket Implementasi CRM"}
        subtitle={isEn ? "One-time investment for a system that works for years." : "Investasi sekali untuk sistem yang bekerja selama bertahun-tahun."}
        tiers={pricingTiers}
      />
      <RelatedServices items={[
        {label:"WhatsApp Business", href:"/service/whatsapp-business", desc:"Setup WA Business & otomasi chat"},
        {label:"AI Automation", href:"/service/ai-automation", desc:"Otomasi proses bisnis dengan AI"},
        {label:"Performance Dashboard", href:"/service/performance-dashboard", desc:"Pantau performa bisnis real-time"},
        {label:"AI Content System", href:"/service/ai-content-system", desc:"Sistem konten AI otomatis"},
      ]} />
      <FAQSection title="FAQ" faqs={[
        {q:"CRM apa yang paling direkomendasikan untuk bisnis UKM?", a:"Untuk UKM, kami sering merekomendasikan HubSpot (versi gratis tersedia) atau Zoho CRM yang lebih terjangkau. Tergantung skala dan kebutuhan tim Anda."},
        {q:"Berapa lama proses implementasi CRM?", a:"Tergantung kompleksitas. Basic 2-4 minggu, Business 4-8 minggu, Enterprise bisa 3-6 bulan."},
        {q:"Apakah bisa integrasi dengan sistem yang sudah ada?", a:"Ya, kami berpengalaman mengintegrasikan CRM dengan berbagai sistem: website, marketplace, akuntansi, WhatsApp, dan tools marketing."},
        {q:"Bagaimana jika tim tidak mau pakai CRM?", a:"Training kami dirancang untuk mendorong adopsi. Kami juga bantu buat workflow yang simpel agar tim tidak merasa terbebani."},
      ]} />
      <Footer />
    </main>
  );
}
