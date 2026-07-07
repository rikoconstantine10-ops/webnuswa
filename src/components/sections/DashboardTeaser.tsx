"use client";

interface MetricCard {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

interface Campaign {
  name: string;
  status: "Active" | "Paused";
  spend: string;
  roas: string;
  leads: number;
}

const METRICS: MetricCard[] = [
  { label: "Total Spend", value: "Rp 28.4jt", change: "+12%", isPositive: true },
  { label: "ROAS", value: "4.2x", change: "+0.4x", isPositive: true },
  { label: "Leads", value: "847", change: "+23%", isPositive: true },
  { label: "CPL", value: "Rp 33.5rb", change: "-18%", isPositive: true },
];

const CAMPAIGNS: Campaign[] = [
  { name: "Ramadan Sale — Broad Audience", status: "Active", spend: "Rp 4.2jt", roas: "5.1x", leads: 284 },
  { name: "Retargeting — Cart Abandoners", status: "Active", spend: "Rp 1.8jt", roas: "7.3x", leads: 156 },
  { name: "Lookalike — Top 3% Purchasers", status: "Paused", spend: "Rp 2.1jt", roas: "3.2x", leads: 97 },
];

const WEEKLY_LEADS = [42, 58, 51, 73, 88, 95, 112];
const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MAX_BAR = Math.max(...WEEKLY_LEADS);

// SVG line chart points — rising trend (y is inverted in SVG: lower = higher on screen)
const LINE_POINTS: [number, number][] = [
  [0, 78],
  [60, 70],
  [120, 62],
  [180, 50],
  [240, 35],
  [300, 22],
  [360, 10],
];

const LINE_PATH = LINE_POINTS.map(([x, y], i) =>
  `${i === 0 ? "M" : "L"} ${x} ${y}`
).join(" ");

const FILL_PATH = `${LINE_PATH} L 360 90 L 0 90 Z`;

export function DashboardTeaser() {
  return (
    <section
      className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 65%)",
        }}
      />

      {/* Floating keyframe animation via style tag */}
      <style>{`
        @keyframes nuswa-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .nuswa-float {
          animation: nuswa-float 5s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-5">
            Transparansi Penuh
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
            Pantau Progress Iklan Anda{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #a78bfa, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Real-time
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Setiap klien mendapat akses dashboard eksklusif — lihat performa
            iklan, pengeluaran, dan hasil kapan saja dari perangkat apapun.
          </p>
        </div>

        {/* Browser mockup wrapper with float animation */}
        <div className="nuswa-float">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(16,185,129,0.4) 100%)",
              padding: "1px",
              boxShadow:
                "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.15)",
            }}
          >
            <div className="rounded-2xl overflow-hidden">
              {/* Browser chrome bar */}
              <div
                className="flex items-center gap-3 px-5 py-3 border-b"
                style={{
                  background: "#1e293b",
                  borderColor: "rgba(99,102,241,0.2)",
                }}
              >
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>

                {/* URL bar */}
                <div
                  className="flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5"
                  style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <svg
                    className="w-3 h-3 text-emerald-400 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs text-slate-400 font-mono">
                    dashboard.nuswalab.com/client
                  </span>
                </div>

                {/* Update badge */}
                <span
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "#34d399",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    style={{ animation: "pulse 2s ease-in-out infinite" }}
                  />
                  Update setiap 24 jam
                </span>
              </div>

              {/* Dashboard interior */}
              <div className="p-5" style={{ background: "#0a0f1e" }}>
                {/* Dashboard header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">
                      FashionID — Laporan Performa Iklan
                    </p>
                    <p className="text-white text-sm font-semibold">
                      1 Jun – 30 Jun 2025
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.3)",
                        color: "#34d399",
                      }}
                    >
                      Live
                    </span>
                  </div>
                </div>

                {/* Top metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {METRICS.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-3"
                      style={{
                        background: "rgba(15,23,42,0.8)",
                        border: "1px solid rgba(99,102,241,0.12)",
                      }}
                    >
                      <p className="text-slate-500 text-xs mb-1">{m.label}</p>
                      <p className="text-white font-bold text-lg leading-tight">
                        {m.value}
                      </p>
                      <p className="text-xs mt-1 text-emerald-400">
                        {m.change} vs bln lalu
                      </p>
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-5">
                  {/* Line chart — revenue trend */}
                  <div
                    className="sm:col-span-3 rounded-xl p-4"
                    style={{
                      background: "rgba(15,23,42,0.8)",
                      border: "1px solid rgba(99,102,241,0.12)",
                    }}
                  >
                    <p className="text-slate-500 text-xs mb-3">
                      Revenue Trend (30 hari)
                    </p>
                    <svg
                      viewBox="0 0 360 90"
                      className="w-full"
                      style={{ height: 72 }}
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="dteaser-line-grad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#6366f1"
                            stopOpacity="0.35"
                          />
                          <stop
                            offset="100%"
                            stopColor="#6366f1"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      {/* Fill area */}
                      <path
                        d={FILL_PATH}
                        fill="url(#dteaser-line-grad)"
                      />
                      {/* Line */}
                      <path
                        d={LINE_PATH}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {/* Dots at each data point */}
                      {LINE_POINTS.map(([x, y], i) => (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#6366f1"
                          stroke="#0a0f1e"
                          strokeWidth="1.5"
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Bar chart — weekly leads */}
                  <div
                    className="sm:col-span-2 rounded-xl p-4"
                    style={{
                      background: "rgba(15,23,42,0.8)",
                      border: "1px solid rgba(99,102,241,0.12)",
                    }}
                  >
                    <p className="text-slate-500 text-xs mb-3">
                      Leads Mingguan
                    </p>
                    <div className="flex items-end gap-1.5 h-16">
                      {WEEKLY_LEADS.map((v, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div
                            className="w-full rounded-sm"
                            style={{
                              height: `${(v / MAX_BAR) * 52}px`,
                              background:
                                i === WEEKLY_LEADS.length - 1
                                  ? "linear-gradient(180deg, #34d399, #10b981)"
                                  : "linear-gradient(180deg, #6366f1, #4f46e5)",
                            }}
                          />
                          <span className="text-slate-600 text-[9px] leading-none">
                            {DAY_LABELS[i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent campaigns mini table */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(15,23,42,0.8)",
                    border: "1px solid rgba(99,102,241,0.12)",
                  }}
                >
                  <p className="text-slate-500 text-xs mb-3">
                    Recent Campaigns
                  </p>
                  <div className="space-y-2.5">
                    {CAMPAIGNS.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-xs"
                      >
                        {/* Status badge */}
                        <span
                          className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold"
                          style={
                            c.status === "Active"
                              ? {
                                  background: "rgba(16,185,129,0.15)",
                                  border: "1px solid rgba(16,185,129,0.3)",
                                  color: "#34d399",
                                }
                              : {
                                  background: "rgba(234,179,8,0.15)",
                                  border: "1px solid rgba(234,179,8,0.3)",
                                  color: "#fbbf24",
                                }
                          }
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background:
                                c.status === "Active" ? "#34d399" : "#fbbf24",
                            }}
                          />
                          {c.status}
                        </span>

                        {/* Campaign name */}
                        <span className="flex-1 text-slate-300 truncate">
                          {c.name}
                        </span>

                        {/* Stats */}
                        <span className="text-slate-500 w-14 text-right tabular-nums">
                          {c.spend}
                        </span>
                        <span className="text-emerald-400 w-8 text-right font-bold tabular-nums">
                          {c.roas}
                        </span>
                        <span className="hidden sm:block text-slate-400 w-16 text-right tabular-nums">
                          {c.leads} leads
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Overlay CTA — gradient fade from bottom */}
              <div
                className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-7 pt-20"
                style={{
                  background:
                    "linear-gradient(to top, rgba(10,15,30,0.97) 0%, rgba(10,15,30,0.85) 40%, transparent 100%)",
                }}
              >
                <p className="text-white font-semibold text-base sm:text-lg mb-4 text-center px-4">
                  Dapatkan Akses Dashboard Real-time
                </p>
                <a
                  href="https://wa.me/6285181301622?text=Halo%2C+saya+ingin+tahu+lebih+lanjut+tentang+dashboard+reporting+nuswalab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                  }}
                >
                  Konsultasi Gratis
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Below-mockup trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          {[
            { icon: "🔄", text: "Update setiap 24 jam" },
            { icon: "🔒", text: "Data 100% konfidensial" },
            { icon: "📱", text: "Akses mobile & desktop" },
          ].map((b, i) => (
            <span key={i} className="text-slate-400 text-sm flex items-center gap-2">
              <span>{b.icon}</span>
              {b.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DashboardTeaser;
