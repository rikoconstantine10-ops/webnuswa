"use client";
import { useState } from "react";

const milestones = [
  {
    month: "Bulan 0",
    title: "Audit & Onboarding",
    icon: "🔍",
    metric: "Setup",
    metricValue: "100%",
    detail:
      "Analisis kompetitor mendalam, setup Facebook Pixel & Google Tag, riset audience persona, dan mapping customer journey lengkap.",
    color: "gray",
  },
  {
    month: "Bulan 1",
    title: "Setup & Launch",
    icon: "🚀",
    metric: "ROAS",
    metricValue: "1.4x",
    detail:
      "Kampanye pertama live dengan 3 ad set berbeda. ROAS awal 1.4x, mulai optimasi audience dan creative. CPA masih tinggi tapi data mulai terkumpul.",
    color: "blue",
  },
  {
    month: "Bulan 2",
    title: "Optimasi Agresif",
    icon: "⚡",
    metric: "ROAS",
    metricValue: "2.1x",
    detail:
      "A/B testing 12 variasi creative, ROAS naik ke 2.1x. CPA turun 34%. Temukan winning audience: perempuan 25-34, interest fashion premium.",
    color: "violet",
  },
  {
    month: "Bulan 3",
    title: "Scaling",
    icon: "📈",
    metric: "Revenue",
    metricValue: "Rp 87jt",
    detail:
      "Budget naik 50%, ROAS stabil di 2.8x. Revenue bulanan mencapai Rp 87jt. Launch Lookalike Audience dari data purchaser.",
    color: "blue",
  },
  {
    month: "Bulan 4",
    title: "Peak Performance",
    icon: "🏆",
    metric: "ROAS",
    metricValue: "4.2x",
    detail:
      "ROAS menembus 4.2x dengan launch koleksi baru. Retargeting cart abandoners conversion rate 18%. Total revenue Rp 142jt.",
    color: "amber",
  },
  {
    month: "Bulan 5",
    title: "Diversifikasi",
    icon: "🎯",
    metric: "Revenue",
    metricValue: "Rp 212jt",
    detail:
      "Expand ke TikTok Ads dengan strategi UGC. Omset gabungan Meta + TikTok + Google Rp 212jt/bulan. CPA turun ke titik terendah.",
    color: "pink",
  },
  {
    month: "Bulan 6",
    title: "Hasil Akhir",
    icon: "🎉",
    metric: "ROAS",
    metricValue: "4.8x",
    detail:
      "ROAS konsisten 4.8x, revenue naik 340% dari baseline, Cost Per Acquisition turun 81%. Client menaikkan budget 3x untuk Q4.",
    color: "green",
  },
];

const colorMap: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  gray: { bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-300", dot: "bg-gray-400" },
  blue: { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-400", dot: "bg-blue-500" },
  violet: { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-400", dot: "bg-violet-500" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-400", dot: "bg-amber-500" },
  pink: { bg: "bg-pink-100", text: "text-pink-700", ring: "ring-pink-400", dot: "bg-pink-500" },
  green: { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-400", dot: "bg-green-500" },
};

export function CaseStudyTimeline() {
  const [active, setActive] = useState(6);

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
            📖 Case Study FashionID
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Perjalanan Sukses Klien Kami
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dari ROAS 1.2x ke 4.8x dalam 6 bulan — ini transformasi nyata yang kami capai bersama FashionID.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Desktop horizontal line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gray-200 z-0" />

          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 relative z-10">
            {milestones.map((m, i) => {
              const col = colorMap[m.color];
              const isActive = active === i;
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 ${
                    isActive ? `${col.bg} ring-2 ${col.ring} shadow-lg scale-105` : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-4 border-white shadow-md ${
                      isActive ? col.dot + " text-white" : "bg-white"
                    }`}
                  >
                    {m.icon}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-semibold ${isActive ? col.text : "text-gray-500"}`}>{m.month}</p>
                    <p className="text-xs text-gray-600 hidden md:block">{m.title}</p>
                  </div>
                  {isActive && (
                    <span className={`text-sm font-bold ${col.text}`}>{m.metricValue}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail Card */}
        <div
          className={`mt-8 p-6 rounded-2xl border-2 transition-all duration-300 ${colorMap[milestones[active].color].bg} border-transparent shadow-lg`}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">{milestones[active].icon}</span>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">{milestones[active].title}</h3>
                <span className={`px-3 py-0.5 rounded-full text-sm font-bold ${colorMap[milestones[active].color].text} bg-white/70`}>
                  {milestones[active].metric}: {milestones[active].metricValue}
                </span>
              </div>
              <p className="text-gray-700">{milestones[active].detail}</p>
            </div>
          </div>
        </div>

        {/* Final Result */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { label: "Kenaikan Revenue", value: "+340%" },
            { label: "ROAS Akhir", value: "4.8x" },
            { label: "Penurunan CPA", value: "-81%" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 bg-gray-900 rounded-2xl text-white">
              <p className="text-2xl md:text-3xl font-bold text-green-400">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CaseStudyTimeline;
