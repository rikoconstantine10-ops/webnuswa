"use client";

import { useState, use, useEffect, useRef } from "react";

const INDUSTRIES = [
  { id: "ecommerce", label_id: "E-commerce", label_en: "E-commerce" },
  { id: "fashion", label_id: "Fashion", label_en: "Fashion" },
  { id: "fnb", label_id: "F&B (Makanan & Minuman)", label_en: "F&B (Food & Beverage)" },
  { id: "property", label_id: "Properti", label_en: "Property" },
  { id: "education", label_id: "Pendidikan", label_en: "Education" },
  { id: "health", label_id: "Kesehatan", label_en: "Health" },
  { id: "saas", label_id: "SaaS / Tech", label_en: "SaaS / Tech" },
];

const BUDGET_RANGES = [
  { id: "lt5", label_id: "< Rp 5 juta / bulan", label_en: "< Rp 5M / month" },
  { id: "5to20", label_id: "Rp 5 – 20 juta / bulan", label_en: "Rp 5–20M / month" },
  { id: "20to50", label_id: "Rp 20 – 50 juta / bulan", label_en: "Rp 20–50M / month" },
  { id: "gt50", label_id: "> Rp 50 juta / bulan", label_en: "> Rp 50M / month" },
];

type AnswerValue = "yes" | "partial" | "no" | null;

const QUESTIONS_ID = [
  "Apakah kamu punya website yang mobile-friendly?",
  "Apakah kamu aktif beriklan di Meta/Google?",
  "Apakah kamu tracking konversi dengan pixel/tag?",
  "Apakah kamu punya konten reguler (blog/video)?",
  "Apakah kamu punya email list / CRM?",
  "Apakah kamu melakukan A/B testing iklan?",
  "Apakah kamu memiliki strategi retargeting?",
  "Apakah kamu tahu cost per lead saat ini?",
];

const QUESTIONS_EN = [
  "Do you have a mobile-friendly website?",
  "Are you actively running ads on Meta/Google?",
  "Are you tracking conversions with pixel/tag?",
  "Do you have regular content (blog/video)?",
  "Do you have an email list / CRM?",
  "Are you running A/B tests on your ads?",
  "Do you have a retargeting strategy?",
  "Do you know your current cost per lead?",
];

const RECOMMENDATIONS_ID: Record<number, string> = {
  0: "Optimalkan website kamu agar mobile-friendly — lebih dari 70% traffic datang dari HP.",
  1: "Mulai iklan di Meta atau Google Ads untuk menjangkau audiens yang lebih luas secara terarah.",
  2: "Pasang Facebook Pixel dan Google Tag untuk tracking konversi agar data iklan lebih akurat.",
  3: "Buat konten reguler (minimal 2x/minggu) untuk membangun kepercayaan dan SEO organik.",
  4: "Bangun email list dan CRM untuk nurture leads dan meningkatkan repeat purchase.",
  5: "Terapkan A/B testing pada iklan untuk menemukan kombinasi creative & copy terbaik.",
  6: "Buat kampanye retargeting untuk menjangkau ulang pengunjung yang belum konversi.",
  7: "Ukur cost per lead secara berkala — ini adalah metrik kunci efisiensi iklanmu.",
};

const RECOMMENDATIONS_EN: Record<number, string> = {
  0: "Optimize your website to be mobile-friendly — over 70% of traffic comes from smartphones.",
  1: "Start running ads on Meta or Google Ads to reach a larger, targeted audience.",
  2: "Install Facebook Pixel and Google Tag to track conversions and get accurate ad data.",
  3: "Create regular content (at least 2x/week) to build trust and improve organic SEO.",
  4: "Build an email list and CRM to nurture leads and increase repeat purchases.",
  5: "Implement A/B testing on your ads to find the best creative and copy combinations.",
  6: "Create retargeting campaigns to re-engage visitors who haven't converted yet.",
  7: "Measure your cost per lead regularly — it's the key metric for ad efficiency.",
};

function CircleScore({ score, isEn }: { score: number; isEn: boolean }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    const duration = 1200;
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  const strokeDashoffset = circumference - (displayed / 100) * circumference;

  let color = "#ef4444";
  let label_id = "Perlu Perhatian";
  let label_en = "Needs Attention";
  if (score > 70) {
    color = "#22c55e";
    label_id = "Sudah Bagus";
    label_en = "Looking Good";
  } else if (score > 40) {
    color = "#f59e0b";
    label_id = "Berkembang";
    label_en = "Developing";
  }

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
      </svg>
      <div className="mt-[-84px] mb-[60px] text-center">
        <p className="text-4xl font-black" style={{ color }}>
          {displayed}
        </p>
        <p className="text-xs text-gray-400">/100</p>
      </div>
      <span
        className="px-3 py-1 rounded-full text-sm font-semibold"
        style={{ background: color + "22", color }}
      >
        {isEn ? label_en : label_id}
      </span>
    </div>
  );
}

export default function AuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isEn = locale === "en";

  const [step, setStep] = useState(1);

  // Step 1 state
  const [bizName, setBizName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [industry, setIndustry] = useState("ecommerce");
  const [budgetRange, setBudgetRange] = useState("lt5");

  // Step 2 state
  const [answers, setAnswers] = useState<AnswerValue[]>(Array(8).fill(null));

  const score = answers.reduce((acc, a) => {
    if (a === "yes") return acc + 12.5;
    if (a === "partial") return acc + 6.25;
    return acc;
  }, 0);

  const recommendations = answers
    .map((a, i) => (a === "no" || a === "partial" ? i : null))
    .filter((i): i is number => i !== null)
    .slice(0, 5);

  const step1Valid = bizName.trim() && email.trim();
  const step2Valid = answers.every((a) => a !== null);

  const waMessage = isEn
    ? `Halo Nuswalab, saya sudah coba Marketing Audit Tool. Nama bisnis: ${bizName}. Skor marketing saya: ${Math.round(score)}/100. Saya ingin mendapatkan strategi lengkap untuk bisnis saya.`
    : `Halo Nuswalab, saya sudah coba Audit Marketing gratis. Nama bisnis: ${bizName}. Skor marketing saya: ${Math.round(score)}/100. Saya ingin mendapatkan strategi lengkap untuk bisnis saya.`;

  const waUrl = `https://wa.me/6285181301622?text=${encodeURIComponent(waMessage)}`;

  function setAnswer(index: number, value: AnswerValue) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const questions = isEn ? QUESTIONS_EN : QUESTIONS_ID;
  const recommendations_map = isEn ? RECOMMENDATIONS_EN : RECOMMENDATIONS_ID;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-violet-900 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block bg-blue-500/30 text-blue-200 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            {isEn ? "Free Tool" : "Alat Gratis"}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {isEn ? "Free Marketing Audit" : "Audit Marketing Gratis"}
          </h1>
          <p className="text-blue-200">
            {isEn
              ? "Answer 8 quick questions to get your Marketing Health Score and personalized recommendations."
              : "Jawab 8 pertanyaan singkat untuk mendapat Marketing Health Score dan rekomendasi personal kamu."}
          </p>
        </div>
      </section>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  step >= s ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-right">
          {isEn ? `Step ${step} of 3` : `Langkah ${step} dari 3`}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {isEn ? "Tell us about your business" : "Ceritakan bisnis kamu"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  {isEn ? "Business Name" : "Nama Bisnis"}{" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder={isEn ? "e.g. Toko Maju Jaya" : "mis. Toko Maju Jaya"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.namabisnis.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Email <span className="text-red-400">*</span>
                  <span className="font-normal text-gray-400 ml-1">
                    ({isEn ? "to receive the report" : "untuk menerima laporan"})
                  </span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEn ? "your@email.com" : "kamu@email.com"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
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
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  {isEn ? "Monthly Marketing Budget" : "Budget Marketing per Bulan"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_RANGES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudgetRange(b.id)}
                      className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                        budgetRange === b.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {isEn ? b.label_en : b.label_id}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="mt-8 w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isEn ? "Next →" : "Lanjut →"}
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {isEn ? "Your Current Marketing Situation" : "Kondisi Marketing Kamu Saat Ini"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isEn
                ? "Answer honestly — the more accurate, the better your score."
                : "Jawab jujur ya — semakin akurat, semakin valid skormu."}
            </p>

            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">{q}</p>
                  <div className="flex gap-2">
                    {(["yes", "partial", "no"] as AnswerValue[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAnswer(i, v)}
                        className={`flex-1 text-sm py-2 rounded-lg border font-semibold transition-colors ${
                          answers[i] === v
                            ? v === "yes"
                              ? "bg-green-500 text-white border-green-500"
                              : v === "partial"
                              ? "bg-amber-400 text-white border-amber-400"
                              : "bg-red-400 text-white border-red-400"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {v === "yes"
                          ? isEn ? "Yes" : "Ya"
                          : v === "partial"
                          ? isEn ? "Partial" : "Sebagian"
                          : isEn ? "No" : "Belum"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                ← {isEn ? "Back" : "Kembali"}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!step2Valid}
                className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isEn ? "See My Score →" : "Lihat Skor Saya →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Results */}
        {step === 3 && (
          <div className="mt-4 space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {isEn ? "Your Marketing Health Score" : "Marketing Health Score Kamu"}
              </h2>
              <p className="text-sm text-gray-500 mb-8">
                {isEn
                  ? `Based on ${bizName}'s marketing audit`
                  : `Berdasarkan audit marketing ${bizName}`}
              </p>

              <div className="flex justify-center mb-6">
                <CircleScore score={Math.round(score)} isEn={isEn} />
              </div>

              <p className="text-sm text-gray-500">
                {isEn
                  ? "A detailed report will be sent to your email."
                  : "Laporan detail akan dikirim ke email kamu."}
                <span className="font-semibold text-blue-600"> {email}</span>
              </p>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="font-bold text-gray-800 mb-4">
                  {isEn ? "Personalized Recommendations" : "Rekomendasi Personal"}
                </h3>
                <ul className="space-y-3">
                  {recommendations.map((i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                        {recommendations.indexOf(i) + 1}
                      </span>
                      <p className="text-sm text-gray-600">{recommendations_map[i]}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-2xl p-8 text-white text-center">
              <h3 className="text-xl font-bold mb-2">
                {isEn
                  ? "Want a Complete Strategy?"
                  : "Mau Strategi Lengkap?"}
              </h3>
              <p className="text-blue-200 text-sm mb-6">
                {isEn
                  ? "Our team will analyze your business deeper and create a custom marketing plan."
                  : "Tim kami akan menganalisa bisnismu lebih dalam dan membuat rencana marketing yang disesuaikan."}
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
              >
                {isEn ? "Get Full Strategy" : "Dapatkan Strategi Lengkap"} →
              </a>
              <p className="text-xs text-blue-300 mt-4">
                {isEn
                  ? "Detailed report will be sent to your email"
                  : "Laporan detail akan dikirim ke email kamu"}
              </p>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setAnswers(Array(8).fill(null));
                setBizName("");
                setWebsite("");
                setEmail("");
              }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              {isEn ? "Start over" : "Mulai ulang"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
