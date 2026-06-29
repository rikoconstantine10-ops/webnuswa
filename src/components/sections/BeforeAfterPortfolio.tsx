"use client";

import { useEffect, useRef, useState } from "react";

interface CaseStudy {
  id: number;
  industry: string;
  metricName: string;
  beforeValue: string;
  afterValue: string;
  improvementLabel: string;
  improvementPercent: number;
  /** true = higher is better (growth), false = lower is better (cost reduction) */
  isGrowth: boolean;
  duration: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 1,
    industry: "E-commerce Fashion",
    metricName: "ROAS",
    beforeValue: "1.2x",
    afterValue: "4.8x",
    improvementLabel: "+300%",
    improvementPercent: 300,
    isGrowth: true,
    duration: "dalam 2 bulan",
  },
  {
    id: 2,
    industry: "Property Developer",
    metricName: "Cost Per Lead",
    beforeValue: "Rp 450rb",
    afterValue: "Rp 87rb",
    improvementLabel: "-81%",
    improvementPercent: 81,
    isGrowth: false,
    duration: "dalam 3 bulan",
  },
  {
    id: 3,
    industry: "Klinik Kecantikan",
    metricName: "Booking Bulanan",
    beforeValue: "45",
    afterValue: "312",
    improvementLabel: "+593%",
    improvementPercent: 593,
    isGrowth: true,
    duration: "dalam 4 bulan",
  },
  {
    id: 4,
    industry: "F&B Chain",
    metricName: "Omset Online",
    beforeValue: "Rp 32jt",
    afterValue: "Rp 187jt",
    improvementLabel: "+484%",
    improvementPercent: 484,
    isGrowth: true,
    duration: "dalam 3 bulan",
  },
  {
    id: 5,
    industry: "SaaS Platform",
    metricName: "Trial Signups",
    beforeValue: "120/bln",
    afterValue: "890/bln",
    improvementLabel: "+641%",
    improvementPercent: 641,
    isGrowth: true,
    duration: "dalam 6 bulan",
  },
  {
    id: 6,
    industry: "Pendidikan Online",
    metricName: "CPA",
    beforeValue: "Rp 280rb",
    afterValue: "Rp 68rb",
    improvementLabel: "-76%",
    improvementPercent: 76,
    isGrowth: false,
    duration: "dalam 2 bulan",
  },
];

function useAnimatedCounter(target: number, isVisible: boolean, durationMs = 1400): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    startRef.current = null;

    const tick = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible, target, durationMs]);

  return value;
}

interface CaseCardProps {
  caseStudy: CaseStudy;
  index: number;
}

function CaseCard({ caseStudy, index }: CaseCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const animatedPercent = useAnimatedCounter(caseStudy.improvementPercent, isVisible);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sign = caseStudy.isGrowth ? "+" : "-";

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
      style={{
        transitionDelay: `${index * 70}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${index * 70}ms, transform 0.6s ease ${index * 70}ms, box-shadow 0.3s ease, translateY 0.3s ease`,
      }}
    >
      {/* Gradient border layer */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(16,185,129,0.5) 100%)",
          padding: "1px",
        }}
      >
        <div className="h-full w-full rounded-2xl bg-slate-900" />
      </div>

      {/* Card content */}
      <div className="relative z-10 p-6">
        {/* Top row: industry tag + duration */}
        <div className="flex items-center justify-between mb-5">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
            {caseStudy.industry}
          </span>
          <span className="text-xs text-slate-500">{caseStudy.duration}</span>
        </div>

        {/* Metric name */}
        <p className="text-sm font-medium text-slate-400 mb-4 tracking-wide">
          {caseStudy.metricName}
        </p>

        {/* Before → After */}
        <div className="flex items-center gap-2 mb-5">
          {/* Before box */}
          <div className="flex-1 rounded-xl p-3 text-center bg-red-500/8 border border-red-500/20">
            <p className="text-xs text-red-400/70 uppercase tracking-wider mb-1">Sebelum</p>
            <p className="text-base font-bold text-red-400 leading-tight">{caseStudy.beforeValue}</p>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>

          {/* After box */}
          <div className="flex-1 rounded-xl p-3 text-center bg-emerald-500/8 border border-emerald-500/25">
            <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-1">Sesudah</p>
            <p className="text-base font-bold text-emerald-400 leading-tight">{caseStudy.afterValue}</p>
          </div>
        </div>

        {/* Improvement badge */}
        <div className="flex justify-center">
          <span
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-extrabold tracking-wide"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))",
              border: "1px solid rgba(16,185,129,0.35)",
              color: "#34d399",
            }}
          >
            <span>
              {sign}
              {animatedPercent}%
            </span>
          </span>
        </div>
      </div>

      {/* Subtle hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(99,102,241,0.05) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

export function BeforeAfterPortfolio() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #020617 0%, #0f172a 60%, #020617 100%)",
        }}
      />

      {/* Ambient blobs */}
      <div
        className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full pointer-events-none blur-3xl"
        style={{ background: "rgba(99,102,241,0.06)" }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none blur-3xl"
        style={{ background: "rgba(16,185,129,0.05)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-5">
            Hasil Terverifikasi
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
            Hasil Nyata{" "}
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
            Bukan sekadar janji — ini adalah angka nyata dari klien yang sudah
            mempercayakan pertumbuhan bisnis mereka kepada kami.
          </p>
        </div>

        {/* Cards grid: 1 col mobile, 2 tablet, 3 desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CASE_STUDIES.map((cs, i) => (
            <CaseCard key={cs.id} caseStudy={cs} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default BeforeAfterPortfolio;
