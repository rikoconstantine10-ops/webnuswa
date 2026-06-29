'use client';
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Star, Quote } from "lucide-react";
import { useLocale } from "next-intl";

const TESTIMONIALS = [
  {
    name: "Budi Santoso",
    role: "Owner",
    company: "Toko Fashion Online",
    avatar: "BS",
    color: "#4a7c59",
    rating: 5,
    result: "+340% traffic organik",
    id: { text: "Sebelum pakai Nuswalab, website kami hampir tidak ada di Google. Setelah 4 bulan SEO, traffic naik 340% dan kami dapat 15-20 leads baru per minggu dari pencarian organik saja.", service: "Jasa SEO" },
    en: { text: "Before Nuswalab, our website was almost invisible on Google. After 4 months of SEO, traffic went up 340% and we now get 15–20 new leads per week from organic search.", service: "SEO Services" },
  },
  {
    name: "Sari Dewi",
    role: "Marketing Manager",
    company: "Klinik Kecantikan",
    avatar: "SD",
    color: "#7c4a6e",
    rating: 5,
    result: "ROAS 6.2x Meta Ads",
    id: { text: "Tim Nuswalab benar-benar paham target market kami. Campaign Meta Ads yang mereka kelola menghasilkan ROAS 6.2x — jauh lebih baik dari agency sebelumnya yang cuma 2x.", service: "Meta Ads" },
    en: { text: "Nuswalab's team truly understands our target market. Their Meta Ads campaign generated 6.2x ROAS — far better than the previous agency that only got 2x.", service: "Meta Ads" },
  },
  {
    name: "Ahmad Fauzi",
    role: "CEO",
    company: "Property Developer",
    avatar: "AF",
    color: "#4a5f7c",
    rating: 5,
    result: "Cost per lead turun 65%",
    id: { text: "Dashboard performance yang mereka buat memudahkan saya memantau semua iklan real-time. Cost per lead kami turun dari Rp 180.000 menjadi Rp 63.000 dalam 2 bulan.", service: "Performance Dashboard + Google Ads" },
    en: { text: "The performance dashboard they built makes monitoring all ads effortless in real-time. Our cost per lead dropped from Rp 180K to Rp 63K in just 2 months.", service: "Performance Dashboard + Google Ads" },
  },
  {
    name: "Maya Kusuma",
    role: "Founder",
    company: "Brand Fashion Lokal",
    avatar: "MK",
    color: "#7c6a4a",
    rating: 5,
    result: "+10K follower/bulan",
    id: { text: "Konten kami dulu tidak konsisten dan engagement rendah. Sekarang dengan Nuswalab, kami menambah 10.000+ follower baru tiap bulan dan engagement rate naik 4x.", service: "Social Media Management" },
    en: { text: "Our content was inconsistent with low engagement. Now with Nuswalab, we gain 10,000+ new followers per month and our engagement rate is up 4x.", service: "Social Media Management" },
  },
  {
    name: "Hendra Wijaya",
    role: "Direktur",
    company: "Distributor FMCG",
    avatar: "HW",
    color: "#4a7c75",
    rating: 5,
    result: "Revenue naik 45%",
    id: { text: "Implementasi CRM dari Nuswalab mengubah cara kerja tim sales kami. Follow-up leads jadi otomatis, waktu admin berkurang 70%, dan revenue naik 45% dalam 6 bulan.", service: "CRM Implementation" },
    en: { text: "Nuswalab's CRM implementation transformed our sales team. Lead follow-up is automated, admin time down 70%, and revenue is up 45% in 6 months.", service: "CRM Implementation" },
  },
  {
    name: "Rina Puspita",
    role: "Marketing Director",
    company: "E-commerce B2C",
    avatar: "RP",
    color: "#7c4a4a",
    rating: 5,
    result: "Konversi naik 280%",
    id: { text: "AI content system mereka menghasilkan 60+ artikel SEO per bulan dengan kualitas setara penulis manusia. Trafik blog naik 4x dan konversi produk meningkat 280%.", service: "AI Content System" },
    en: { text: "Their AI content system produces 60+ SEO articles per month matching human writer quality. Blog traffic is up 4x and product conversion increased 280%.", service: "AI Content System" },
  },
];

interface Props {
  title?: string;
  subtitle?: string;
  limit?: number;
}

export function TestimonialsSection({ title, subtitle, limit }: Props) {
  const locale = useLocale();
  const isEn = locale === "en";
  const items = limit ? TESTIMONIALS.slice(0, limit) : TESTIMONIALS;

  return (
    <section className="section-padding" style={{ background: "oklch(0.98 0.003 265)" }}>
      <div className="container-custom">
        <AnimateOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
              {title ?? (isEn ? <>Hasil <span className="text-gradient">Nyata</span> Klien Kami</> : <>Hasil <span className="text-gradient">Nyata</span> Klien Kami</>)}
            </h2>
            <p className="text-muted-foreground">
              {subtitle ?? (isEn ? "Real numbers from real clients across industries." : "Angka nyata dari klien nyata di berbagai industri.")}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t, i) => {
            const content = isEn ? t.en : t.id;
            return (
              <AnimateOnScroll key={t.name} delay={i * 80}>
                <div className="shimmer-card rounded-2xl p-6 h-full flex flex-col group hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: t.color }}>
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.role} · {t.company}</div>
                      </div>
                    </div>
                    <Quote className="w-6 h-6 opacity-20 flex-shrink-0" />
                  </div>

                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-4 self-start" style={{ background: `${t.color}18`, color: t.color }}>
                    {t.result}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{content.text}"</p>

                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">{content.service}</span>
                  </div>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
