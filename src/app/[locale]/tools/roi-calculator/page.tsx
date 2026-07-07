"use client";

import { useState, useEffect, use } from "react";

const INDUSTRIES = [
  { id: "ecommerce", label_id: "E-commerce", label_en: "E-commerce", roas: 3.2 },
  { id: "fashion", label_id: "Fashion", label_en: "Fashion", roas: 2.8 },
  { id: "fnb", label_id: "F&B (Makanan & Minuman)", label_en: "F&B (Food & Beverage)", roas: 2.5 },
  { id: "property", label_id: "Properti", label_en: "Property", roas: 4.1 },
  { id: "education", label_id: "Pendidikan", label_en: "Education", roas: 3.5 },
  { id: "health", label_id: "Kesehatan", label_en: "Health", roas: 3.0 },
  { id: "saas", label_id: "SaaS / Tech", label_en: "SaaS / Tech", roas: 3.8 },
];

function formatRp(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)}jt`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

interface Results {
  optimizedRoas: number;
  monthlyRevenue: number;
  annualIncrease: number;
  cplReduction: number;
  paybackMonths: number;
}

export default function ROICalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isEn = locale === "en";

  const [budget, setBudget] = useState(10_000_000);
  const [industry, setIndustry] = useState("ecommerce");
  const [currentRoas, setCurrentRoas] = useState(1.5);
  const [targetGrowth, setTargetGrowth] = useState(100);
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    const ind = INDUSTRIES.find((i) => i.id === industry) ?? INDUSTRIES[0];
    const optimizedRoas = ind.roas;
    const currentRevenue = budget * currentRoas;
    const monthlyRevenue = budget * optimizedRoas;
    const annualIncrease = (monthlyRevenue - currentRevenue) * 12;
    const cplReduction = Math.round(
      ((optimizedRoas - currentRoas) / optimizedRoas) * 100
    );
    const managementFee = budget * 0.15;
    const paybackMonths =
      annualIncrease > 0
        ? Math.ceil((managementFee * 12) / annualIncrease * 12)
        : 99;

    setResults({
      optimizedRoas,
      monthlyRevenue,
      annualIncrease,
      cplReduction: Math.max(0, Math.min(cplReduction, 80)),
      paybackMonths: Math.max(1, Math.min(paybackMonths, 24)),
    });
  }, [budget, industry, currentRoas, targetGrowth]);

  const waMessage = isEn
    ? `Halo Nuswalab, saya sudah coba ROI Calculator. Budget iklan saya Rp ${(budget / 1_000_000).toFixed(0)}jt/bulan di industri ${INDUSTRIES.find((i) => i.id === industry)?.[isEn ? "label_en" : "label_id"]}. Potensi revenue bulanan: ${results ? formatRp(results.monthlyRevenue) : ""}. Saya tertarik konsultasi lebih lanjut.`
    : `Halo Nuswalab, saya sudah coba Kalkulator ROI Marketing. Budget iklan saya Rp ${(budget / 1_000_000).toFixed(0)}jt/bulan di industri ${INDUSTRIES.find((i) => i.id === industry)?.[isEn ? "label_en" : "label_id"]}. Potensi revenue bulanan: ${results ? formatRp(results.monthlyRevenue) : ""}. Saya tertarik konsultasi lebih lanjut.`;

  const waUrl = `https://wa.me/6285181301622?text=${encodeURIComponent(waMessage)}`;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-violet-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-blue-500/30 text-blue-200 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            {isEn ? "Free Tool" : "Alat Gratis"}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isEn ? "Marketing ROI Calculator" : "Kalkulator ROI Marketing"}
          </h1>
          <p className="text-lg text-blue-200 max-w-xl mx-auto">
            {isEn
              ? "See how much revenue you could generate after optimizing your ad spend with our data-driven approach."
              : "Lihat seberapa besar pendapatan yang bisa kamu raih setelah mengoptimasi iklan dengan pendekatan berbasis data kami."}
          </p>
        </div>
      </section>

      {/* Calculator + Results */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {isEn ? "Your Business Details" : "Detail Bisnis Kamu"}
            </h2>

            {/* Budget */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                {isEn ? "Monthly Ad Budget" : "Budget Iklan per Bulan"}
              </label>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-blue-700 font-bold text-lg w-28">
                  {formatRp(budget)}
                </span>
              </div>
              <input
                type="range"
                min={1_000_000}
                max={100_000_000}
                step={1_000_000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Rp 1jt</span>
                <span>Rp 100jt</span>
              </div>
            </div>

            {/* Industry */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                {isEn ? "Industry" : "Industri"}
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {isEn ? ind.label_en : ind.label_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Current ROAS */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                {isEn ? "Current ROAS" : "ROAS Saat Ini"}
              </label>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-blue-700 font-bold text-lg w-20">
                  {currentRoas.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.1}
                value={currentRoas}
                onChange={(e) => setCurrentRoas(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.5x</span>
                <span>10x</span>
              </div>
            </div>

            {/* Target Growth */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                {isEn ? "Target Revenue Growth" : "Target Pertumbuhan Revenue"}
              </label>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-blue-700 font-bold text-lg w-20">
                  {targetGrowth}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={targetGrowth}
                onChange={(e) => setTargetGrowth(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10%</span>
                <span>500%</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex flex-col gap-4">
            {results && (
              <>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                  <p className="text-sm font-semibold text-green-700 mb-1">
                    {isEn ? "Estimated ROAS After Optimization" : "Estimasi ROAS Setelah Optimasi"}
                  </p>
                  <p className="text-4xl font-black text-green-600">
                    {results.optimizedRoas.toFixed(1)}x
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {isEn
                      ? `Industry benchmark for ${INDUSTRIES.find((i) => i.id === industry)?.label_en}`
                      : `Benchmark industri ${INDUSTRIES.find((i) => i.id === industry)?.label_id}`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">
                      {isEn ? "Monthly Revenue Potential" : "Potensi Revenue Bulanan"}
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatRp(results.monthlyRevenue)}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">
                      {isEn ? "Annual Revenue Increase" : "Peningkatan Revenue Tahunan"}
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatRp(results.annualIncrease)}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">
                      {isEn ? "Est. Cost Per Lead Reduction" : "Estimasi Penurunan CPL"}
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      -{results.cplReduction}%
                    </p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">
                      {isEn ? "Payback Period" : "Periode Balik Modal"}
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {results.paybackMonths}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        {isEn ? "months" : "bulan"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-blue-600 rounded-2xl p-6 text-white">
                  <p className="font-bold text-lg mb-1">
                    {isEn
                      ? "Ready to achieve these numbers?"
                      : "Siap capai angka-angka ini?"}
                  </p>
                  <p className="text-blue-200 text-sm mb-4">
                    {isEn
                      ? "Our team will create a custom strategy to hit your growth targets."
                      : "Tim kami akan buat strategi khusus untuk mencapai target pertumbuhan kamu."}
                  </p>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    {isEn ? "Free Consultation" : "Konsultasi Gratis"} →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          {isEn
            ? "* Estimates are based on industry benchmarks from our campaign data. Actual results may vary."
            : "* Estimasi berdasarkan benchmark industri dari data kampanye kami. Hasil aktual bisa berbeda."}
        </p>
      </section>
    </main>
  );
}
