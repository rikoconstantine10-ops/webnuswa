import { formatRupiah } from "@/lib/money";

type Point = { label: string; value: number };

// Bar chart penjualan harian — SVG server-rendered, satu seri (tanpa legend),
// hover tooltip native via <title>, label langsung hanya pada nilai tertinggi.
export default function SalesChart({ data, title }: { data: Point[]; title: string }) {
  const W = 720;
  const H = 200;
  const PAD_L = 56;
  const PAD_B = 24;
  const PAD_T = 16;
  const plotW = W - PAD_L - 8;
  const plotH = H - PAD_T - PAD_B;

  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = max <= 10000 ? Math.ceil(max / 1000) * 1000 : Math.ceil(max / 50000) * 50000;
  const barGap = 2;
  const barW = Math.max(2, plotW / data.length - barGap);
  const maxIdx = data.findIndex((d) => d.value === max && max > 0);

  const fmtShort = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0)}jt` : v >= 1000 ? `${Math.round(v / 1000)}rb` : String(v);

  const y = (v: number) => PAD_T + plotH - (v / niceMax) * plotH;
  const gridVals = [niceMax / 2, niceMax];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 overflow-x-auto">
      <h2 className="font-bold text-sm mb-3">{title}</h2>
      {data.every((d) => d.value === 0) ? (
        <p className="text-sm text-slate-400 py-8 text-center">Belum ada penjualan pada periode ini.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label={title}>
          {gridVals.map((v) => (
            <g key={v}>
              <line x1={PAD_L} x2={W - 8} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth="1" />
              <text x={PAD_L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                {fmtShort(v)}
              </text>
            </g>
          ))}
          <line x1={PAD_L} x2={W - 8} y1={PAD_T + plotH} y2={PAD_T + plotH} stroke="#cbd5e1" strokeWidth="1" />

          {data.map((d, i) => {
            const x = PAD_L + i * (barW + barGap);
            const h = Math.max(d.value > 0 ? 3 : 0, (d.value / niceMax) * plotH);
            return (
              <g key={d.label} className="group">
                {/* hit target lebih besar dari mark */}
                <rect x={x - barGap / 2} y={PAD_T} width={barW + barGap} height={plotH} fill="transparent">
                  <title>{`${d.label}: ${formatRupiah(d.value)}`}</title>
                </rect>
                {h > 0 && (
                  <path
                    d={`M${x},${PAD_T + plotH} L${x},${y(d.value) + 4} Q${x},${y(d.value)} ${x + 4},${y(d.value)} L${x + barW - 4},${y(d.value)} Q${x + barW},${y(d.value)} ${x + barW},${y(d.value) + 4} L${x + barW},${PAD_T + plotH} Z`}
                    fill="#0d9488"
                    className="group-hover:opacity-75"
                  >
                    <title>{`${d.label}: ${formatRupiah(d.value)}`}</title>
                  </path>
                )}
                {i === maxIdx && d.value > 0 && (
                  <text x={x + barW / 2} y={y(d.value) - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
                    {fmtShort(d.value)}
                  </text>
                )}
                {i % 5 === 0 && (
                  <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
