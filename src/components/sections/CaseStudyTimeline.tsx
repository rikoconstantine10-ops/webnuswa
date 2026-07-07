"use client";

import { useEffect, useRef, useState } from "react";

interface Milestone {
  month: string;
  title: string;
  iconPath: string; // SVG path data
  metric: string;
  metricValue: string;
  detail: string;
}

const MILESTONES: Milestone[] = [
  {
    month: "Bulan 0",
    title: "Audit & Onboarding",
    iconPath:
      "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
    metric: "Setup",
    metricValue: "Selesai",
    detail:
      "Analisis kompetitor mendalam, setup Facebook Pixel & Google Tag Manager, riset audience persona, dan mapping customer journey lengkap untuk menentukan strategi kampanye.",
  },
  {
    month: "Bulan 1",
    title: "Setup & Launch",
    iconPath:
      "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z",
    metric: "ROAS",
    metricValue: "1.4x",
    detail:
      "Kampanye pertama live dengan 3 ad set berbeda. ROAS awal 1.4x — data mulai terkumpul. Optimasi audience dan creative awal dilakukan, CPA masih tinggi namun tren positif.",
  },
  {
    month: "Bulan 2",
    title: "Optimasi Agresif",
    iconPath: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    metric: "ROAS",
    metricValue: "2.1x",
    detail:
      "A/B testing 12 variasi creative — video vs. carousel vs. static. ROAS naik ke 2.1x, CPA turun 34%. Winning audience ditemukan: perempuan 25–34 tahun, interest fashion premium.",
  },
  {
    month: "Bulan 3",
    title: "Scaling",
    iconPath:
      "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
    metric: "Revenue",
    metricValue: "Rp 87jt",
    detail:
      "Budget naik 50%, ROAS stabil di 2.8x. Revenue bulanan mencapai Rp 87jt. Launch Lookalike Audience berbasis data purchaser terbukti meningkatkan kualitas leads secara signifikan.",
  },
  {
    month: "Bulan 4",
    title: "Peak Performance",
    iconPath:
      "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0",
    metric: "ROAS",
    metricValue: "4.2x",
    detail:
      "ROAS menembus 4.2x bersamaan dengan launch koleksi baru musim panas. Retargeting cart abandoners conversion rate 18%. Total revenue melonjak ke Rp 142jt bulan ini.",
  },
  {
    month: "Bulan 5",
    title: "Diversifikasi",
    iconPath:
      "M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z",
    metric: "Revenue",
    metricValue: "Rp 212jt",
    detail:
      "Expand ke TikTok Ads dengan strategi konten UGC (User Generated Content). Omset gabungan Meta + TikTok + Google Ads tembus Rp 212jt/bulan. CPA turun ke titik terendah sepanjang kampanye.",
  },
  {
    month: "Bulan 6",
    title: "Hasil Akhir",
    iconPath:
      "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    metric: "ROAS",
    metricValue: "4.8x",
    detail:
      "ROAS konsisten 4.8x, revenue naik 340% dari baseline awal, Cost Per Acquisition turun 81%. Klien menaikkan budget 3x untuk memasuki Q4 dengan kepercayaan penuh.",
  },
];

const FINAL_STATS = [
  { label: "Kenaikan Revenue", value: "+340%" },
  { label: "ROAS Akhir", value: "4.8x" },
  { label: "Penurunan CPA", value: "-81%" },
];

function MilestoneIcon({ path }: { path: string }) {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

interface DetailCardProps {
  milestone: Milestone;
  index: number;
}

function DetailCard({ milestone, index }: DetailCardProps) {
  const isLast = index === MILESTONES.length - 1;

  return (
    <div
      className="rounded-2xl p-6 transition-all duration-400"
      style={{
        background: isLast
          ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.12))"
          : "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(15,23,42,0.8))",
        border: isLast
          ? "1px solid rgba(16,185,129,0.3)"
          : "1px solid rgba(99,102,241,0.2)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Icon circle */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: isLast
              ? "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(59,130,246,0.3))"
              : "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
            border: isLast
              ? "1px solid rgba(16,185,129,0.4)"
              : "1px solid rgba(99,102,241,0.3)",
            color: isLast ? "#34d399" : "#818cf8",
          }}
        >
          <MilestoneIcon path={milestone.iconPath} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-white">{milestone.title}</h3>
            <span
              className="inline-block px-3 py-0.5 rounded-full text-sm font-bold"
              style={{
                background: isLast
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(99,102,241,0.15)",
                border: isLast
                  ? "1px solid rgba(16,185,129,0.3)"
                  : "1px solid rgba(99,102,241,0.3)",
                color: isLast ? "#34d399" : "#a5b4fc",
              }}
            >
              {milestone.metric}: {milestone.metricValue}
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">{milestone.detail}</p>
        </div>
      </div>
    </div>
  );
}

export function CaseStudyTimeline() {
  const [activeIndex, setActiveIndex] = useState(6);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #020617 50%, #0f172a 100%)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(99,102,241,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-5">
            Case Study — FashionID
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
            Perjalanan Sukses{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #818cf8, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Klien Kami
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Dari ROAS 1.2x menjadi 4.8x dalam 6 bulan — transformasi nyata yang
            kami capai bersama FashionID, brand fashion lokal premium.
          </p>
        </div>

        {/* Timeline — horizontal on desktop, vertical on mobile */}
        <div className="relative mb-10">
          {/* Desktop: horizontal connecting line */}
          <div
            className="hidden md:block absolute top-7 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(99,102,241,0.3) 10%, rgba(99,102,241,0.3) 90%, transparent)",
            }}
          />

          {/* Mobile: vertical connecting line */}
          <div
            className="md:hidden absolute top-0 bottom-0 left-7 w-px"
            style={{
              background:
                "linear-gradient(180deg, transparent, rgba(99,102,241,0.3) 5%, rgba(99,102,241,0.3) 95%, transparent)",
            }}
          />

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-7 gap-2 relative">
            {MILESTONES.map((m, i) => {
              const isActive = activeIndex === i;
              const isLast = i === MILESTONES.length - 1;
              return (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className="flex flex-col items-center gap-2 group focus:outline-none"
                  style={{
                    transitionDelay: `${i * 60}ms`,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(12px)",
                    transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms`,
                  }}
                >
                  {/* Node circle */}
                  <div
                    className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2"
                    style={{
                      background: isActive
                        ? isLast
                          ? "linear-gradient(135deg, #10b981, #3b82f6)"
                          : "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : "rgba(15,23,42,0.9)",
                      borderColor: isActive
                        ? isLast
                          ? "#34d399"
                          : "#818cf8"
                        : "rgba(99,102,241,0.25)",
                      color: isActive ? "#fff" : "#64748b",
                      boxShadow: isActive
                        ? isLast
                          ? "0 0 20px rgba(16,185,129,0.4)"
                          : "0 0 20px rgba(99,102,241,0.4)"
                        : "none",
                      transform: isActive ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    <MilestoneIcon path={m.iconPath} />
                    {isActive && (
                      <span
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900"
                        style={{
                          background: isLast ? "#34d399" : "#818cf8",
                        }}
                      />
                    )}
                  </div>

                  {/* Labels */}
                  <div className="text-center">
                    <p
                      className="text-xs font-bold mb-0.5"
                      style={{
                        color: isActive
                          ? isLast
                            ? "#34d399"
                            : "#a5b4fc"
                          : "#64748b",
                      }}
                    >
                      {m.month}
                    </p>
                    <p
                      className="text-xs leading-tight transition-colors"
                      style={{ color: isActive ? "#cbd5e1" : "#475569" }}
                    >
                      {m.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mobile: vertical layout */}
          <div className="md:hidden flex flex-col gap-4 relative pl-16">
            {MILESTONES.map((m, i) => {
              const isActive = activeIndex === i;
              const isLast = i === MILESTONES.length - 1;
              return (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className="flex items-center gap-3 text-left focus:outline-none"
                >
                  {/* Node */}
                  <div
                    className="absolute left-0 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300"
                    style={{
                      background: isActive
                        ? isLast
                          ? "linear-gradient(135deg, #10b981, #3b82f6)"
                          : "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : "rgba(15,23,42,0.9)",
                      borderColor: isActive
                        ? isLast
                          ? "#34d399"
                          : "#818cf8"
                        : "rgba(99,102,241,0.25)",
                      color: isActive ? "#fff" : "#64748b",
                    }}
                  >
                    <MilestoneIcon path={m.iconPath} />
                  </div>

                  <div
                    className="rounded-xl px-4 py-2 flex-1 transition-all duration-300"
                    style={{
                      background: isActive
                        ? "rgba(99,102,241,0.1)"
                        : "transparent",
                      border: isActive
                        ? "1px solid rgba(99,102,241,0.2)"
                        : "1px solid transparent",
                    }}
                  >
                    <p
                      className="text-xs font-bold"
                      style={{ color: isActive ? "#a5b4fc" : "#64748b" }}
                    >
                      {m.month}
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: isActive ? "#e2e8f0" : "#94a3b8" }}
                    >
                      {m.title}
                    </p>
                    {isActive && (
                      <p className="text-xs mt-0.5" style={{ color: "#34d399" }}>
                        {m.metric}: {m.metricValue}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail card */}
        <div className="mb-8">
          <DetailCard
            milestone={MILESTONES[activeIndex]}
            index={activeIndex}
          />
        </div>

        {/* Final result summary */}
        <div className="grid grid-cols-3 gap-4">
          {FINAL_STATS.map((stat, i) => (
            <div
              key={i}
              className="text-center rounded-2xl p-5"
              style={{
                background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <p
                className="text-2xl sm:text-3xl font-extrabold mb-1"
                style={{
                  background: "linear-gradient(90deg, #34d399, #60a5fa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CaseStudyTimeline;
