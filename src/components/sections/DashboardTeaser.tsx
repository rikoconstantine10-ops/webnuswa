"use client";

const campaigns = [
  { name: "Ramadan Sale - Broad", status: "Active", spend: "Rp 4.2jt", roas: "5.1x", leads: 284 },
  { name: "Retargeting - Cart Drop", status: "Active", spend: "Rp 1.8jt", roas: "7.3x", leads: 156 },
  { name: "Lookalike - Top 3%", status: "Paused", spend: "Rp 2.1jt", roas: "3.2x", leads: 97 },
];

const weeklyData = [42, 58, 51, 73, 88, 95, 112];
const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const maxBar = Math.max(...weeklyData);

const chartPoints = [
  [0, 80], [60, 65], [120, 70], [180, 45], [240, 30], [300, 20], [360, 10],
];
const svgPath = chartPoints
  .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
  .join(" ");

export function DashboardTeaser() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold mb-4">
            📊 Transparansi Penuh
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pantau Progress Iklan Anda Real-time
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Setiap klien mendapat akses dashboard eksklusif — lihat performa iklan, pengeluaran, dan hasil kapan saja.
          </p>
        </div>

        {/* Browser Mockup */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
          style={{ animation: "float 4s ease-in-out infinite" }}
        >
          <style>{`@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }`}</style>

          {/* Browser Chrome */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 font-mono">
              dashboard.nuswalab.com/client/fashionid
            </div>
            <div className="w-4 h-4 text-gray-400">🔒</div>
          </div>

          {/* Dashboard Content */}
          <div className="bg-gray-950 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-gray-400 text-xs">FashionID — Dashboard Performa</p>
                <p className="text-white text-sm font-semibold">Periode: 1 Jun – 30 Jun 2025</p>
              </div>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                ● Update 2 jam lalu
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: "Total Spend", value: "Rp 28.4jt", change: "+12%", up: true },
                { label: "ROAS", value: "4.2x", change: "+0.4x", up: true },
                { label: "Total Leads", value: "847", change: "+23%", up: true },
                { label: "CPL", value: "Rp 33.5rb", change: "-18%", up: false },
              ].map((m, i) => (
                <div key={i} className="bg-gray-900 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">{m.label}</p>
                  <p className="text-white font-bold text-lg leading-tight">{m.value}</p>
                  <p className={`text-xs mt-1 ${m.up ? "text-green-400" : "text-green-400"}`}>
                    {m.change} vs bulan lalu
                  </p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-5 gap-3 mb-5">
              {/* Line Chart */}
              <div className="col-span-3 bg-gray-900 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-2">Revenue Trend (30 hari)</p>
                <svg viewBox="0 0 360 90" className="w-full" style={{ height: 70 }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={svgPath + " L 360 90 L 0 90 Z"} fill="url(#lineGrad)" />
                  <path d={svgPath} fill="none" stroke="#818cf8" strokeWidth="2" />
                </svg>
              </div>

              {/* Bar Chart */}
              <div className="col-span-2 bg-gray-900 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-2">Leads / Hari</p>
                <div className="flex items-end gap-1 h-14">
                  {weeklyData.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-sm bg-indigo-500"
                        style={{ height: `${(v / maxBar) * 48}px` }}
                      />
                      <span className="text-gray-600 text-[9px]">{days[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-gray-900 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-3">Kampanye Aktif</p>
              <div className="space-y-2">
                {campaigns.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${c.status === "Active" ? "bg-green-400" : "bg-yellow-400"}`}
                    />
                    <span className="text-gray-300 flex-1 truncate">{c.name}</span>
                    <span className="text-gray-500 w-16 text-right">{c.spend}</span>
                    <span className="text-green-400 w-10 text-right font-semibold">{c.roas}</span>
                    <span className="text-gray-400 w-16 text-right">{c.leads} leads</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overlay CTA */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent flex items-end justify-center pb-6">
            <div className="text-center">
              <p className="text-white font-semibold mb-3">Dapatkan Akses Dashboard Real-time</p>
              <a
                href="https://wa.me/6285181301622?text=Halo%2C+saya+ingin+tahu+lebih+lanjut+tentang+dashboard+reporting+nuswalab"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Mulai Sekarang →
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-4">
          🔄 Update setiap 24 jam · 🔒 Data 100% konfidensial · 📱 Akses via mobile & desktop
        </p>
      </div>
    </section>
  );
}

export default DashboardTeaser;
