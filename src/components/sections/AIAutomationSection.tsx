"use client";
import Link from "next/link";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import {
  ArrowRight, Bot, BarChart3, Zap, TrendingUp, Globe2, Clock,
} from "lucide-react";

const SELLING_POINTS = [
  {
    Icon: Bot,
    title: "WhatsApp Bot 24 Jam",
    desc: "Balas pesan pelanggan otomatis, follow-up lead, kirim katalog, dan konfirmasi order — tanpa admin manual, terasa seperti CS manusia.",
    hasil: "Follow-up rate +340%, response time < 3 detik",
  },
  {
    Icon: BarChart3,
    title: "CRM Automation",
    desc: "Pipeline sales otomatis dari lead masuk hingga closing. Reminder follow-up, dashboard performa real-time, tidak ada prospek yang terlewat.",
    hasil: "Konversi lead naik rata-rata 65%",
  },
  {
    Icon: Zap,
    title: "Workflow Automation",
    desc: "Integrasi Tokopedia/Shopee/GoFood → stok → laporan penjualan dalam satu alur tanpa input manual. Zero human error, zero missed order.",
    hasil: "Hemat 15–20 jam kerja admin per minggu",
  },
  {
    Icon: Bot,
    title: "AI Agent Development",
    desc: "Tim virtual yang tangani email, form leads, pertanyaan produk, dan booking 24 jam tanpa henti — tanpa gaji, tanpa cuti, tanpa absen.",
    hasil: "Biaya operasional turun rata-rata 70%",
  },
  {
    Icon: TrendingUp,
    title: "ROI Cepat untuk UMKM",
    desc: "Payback period AI automation rata-rata < 3 bulan. Hemat Rp 5–10 juta/bulan dari biaya admin dan operasional repetitif.",
    hasil: "ROI 3× dalam 6 bulan pertama",
  },
  {
    Icon: Globe2,
    title: "Integrasi Multi-Platform",
    desc: "Hubungkan WhatsApp, Instagram, email, marketplace, dan Google Sheets dalam satu ekosistem otomatis. Semua data tersinkron real-time.",
    hasil: "Zero manual data entry, 100% terintegrasi",
  },
];

interface Props {
  kota?: string;
}

export function AIAutomationSection({ kota }: Props) {
  const kotaLabel = kota ? ` di ${kota}` : "";

  return (
    <section className="py-20" style={{ background: "oklch(0.98 0.003 265)" }}>
      <div className="container-custom">
        <AnimateOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs uppercase tracking-widest mb-4"
              style={{ color: "var(--color-primary)" }}
            >
              <Zap className="w-3.5 h-3.5" />
              AI Agent & Automation
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold text-gradient mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Otomasi Bisnis{kotaLabel} dengan AI
            </h2>
            <p style={{ color: "var(--color-muted-foreground)" }}>
              Hemat 60–80% waktu operasional, follow-up lead otomatis 24 jam, dan scale bisnis tanpa nambah tim.
              Cocok untuk UMKM dan bisnis menengah yang ingin efisiensi nyata.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {SELLING_POINTS.map((item, i) => (
            <AnimateOnScroll key={i} delay={i * 70}>
              <div
                className="glass rounded-2xl p-6 h-full flex flex-col hover:-translate-y-1 transition-all duration-300"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 flex-shrink-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <item.Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-4 flex-1"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {item.desc}
                </p>
                <div
                  className="flex items-center gap-1.5 text-xs p-2.5 rounded-xl"
                  style={{ background: "oklch(0.95 0.02 265)" }}
                >
                  <TrendingUp
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: "var(--color-primary)" }}
                  />
                  <span className="font-medium" style={{ color: "oklch(0.35 0.03 265)" }}>
                    {item.hasil}
                  </span>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Comparison row */}
        <AnimateOnScroll>
          <div
            className="glass rounded-2xl p-6 md:p-8 mb-10"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h3
              className="text-xl font-bold text-gradient mb-6 text-center"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Bisnis Tanpa vs Dengan AI Automation
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.55 0.15 30)" }}>
                  ❌ Tanpa Automation
                </p>
                <ul className="space-y-2 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  {[
                    "Admin manual balas WA, bisa miss lead",
                    "Follow-up tidak konsisten, prospek dingin",
                    "Laporan stok & penjualan manual, rawan error",
                    "Tim terus bertambah seiring bisnis scale",
                    "Operasional hanya jam kerja (8 jam/hari)",
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-primary)" }}>
                  ✅ Dengan Nuswa Lab AI
                </p>
                <ul className="space-y-2 text-sm" style={{ color: "oklch(0.3 0.03 265)" }}>
                  {[
                    "WhatsApp Bot balas lead < 3 detik, 24 jam",
                    "Follow-up otomatis, konversi naik 65%",
                    "Data terintegrasi real-time, zero error",
                    "Bisnis scale tanpa tambah headcount",
                    "Operasi 24/7 — pagi, malam, weekend, libur",
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </AnimateOnScroll>

        {/* CTA */}
        <AnimateOnScroll>
          <div className="glass rounded-3xl p-8 md:p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex justify-center mb-4">
              <Clock className="w-10 h-10" style={{ color: "var(--color-primary)" }} />
            </div>
            <h3
              className="text-2xl md:text-3xl font-bold text-gradient mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Audit Proses Bisnis Gratis
            </h3>
            <p className="mb-6 max-w-xl mx-auto" style={{ color: "var(--color-muted-foreground)" }}>
              Ceritakan operasional bisnis Anda — tim Nuswa Lab akan identifikasi titik mana yang bisa diotomasi dan
              proyeksikan penghematan yang bisa didapat. Gratis, tanpa komitmen.
            </p>
            <Link href="/contact" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
              Konsultasi AI Automation Gratis <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
