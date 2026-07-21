import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import HeatmapCanvas from "@/components/admin/HeatmapCanvas";

export const dynamic = "force-dynamic";

const DEVICE_WIDTH: Record<string, number> = { desktop: 1280, mobile: 390 };
const DAY_OPTIONS = [7, 30, 90];
const SCROLL_BANDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function buildQuery(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

export default async function AdminHeatmapPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string; device?: string; days?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const device = sp.device === "mobile" ? "mobile" : "desktop";
  const days = DAY_OPTIONS.includes(Number(sp.days)) ? Number(sp.days) : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const topPaths = await db.heatmapClick.groupBy({
    by: ["path"],
    where: { createdAt: { gte: since } },
    _count: { path: true },
    orderBy: { _count: { path: "desc" } },
    take: 20,
  });

  const path = sp.path || topPaths[0]?.path || "/";

  const [clicks, scrolls] = await Promise.all([
    db.heatmapClick.findMany({
      where: { path, device, createdAt: { gte: since } },
      select: { xPct: true, yPct: true },
      take: 5000,
    }),
    db.heatmapScroll.findMany({
      where: { path, device, createdAt: { gte: since } },
      select: { depthPct: true },
    }),
  ]);

  const totalScroll = scrolls.length;
  const scrollFunnel = SCROLL_BANDS.map((b) => ({
    label: `${b}%`,
    pct: totalScroll ? Math.round((scrolls.filter((s) => s.depthPct >= b).length / totalScroll) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Heatmap Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Peta klik &amp; kedalaman scroll pengunjung di halaman publik (Home, Market, Produk, Toko).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <form method="get" className="flex flex-wrap gap-2 items-center">
          <input type="hidden" name="device" value={device} />
          <input type="hidden" name="days" value={String(days)} />
          <input
            type="text"
            name="path"
            defaultValue={path}
            placeholder="Path halaman, mis. /p/produk-saya atau /s/nama-toko"
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-64 font-mono"
          />
          <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700">
            Tampilkan
          </button>
        </form>

        {topPaths.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 mr-1 self-center">Halaman teratas:</span>
            {topPaths.map((p) => (
              <Link
                key={p.path}
                href={`/admin/analytics/heatmap?${buildQuery({ path: p.path, device, days: String(days) })}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  p.path === path ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-600"
                }`}
              >
                {p.path} ({p._count.path})
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500">Perangkat:</span>
            {(["desktop", "mobile"] as const).map((d) => (
              <Link
                key={d}
                href={`/admin/analytics/heatmap?${buildQuery({ path, device: d, days: String(days) })}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  device === d ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-600"
                }`}
              >
                {d === "desktop" ? "🖥 Desktop" : "📱 Mobile"}
              </Link>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500">Periode:</span>
            {DAY_OPTIONS.map((d) => (
              <Link
                key={d}
                href={`/admin/analytics/heatmap?${buildQuery({ path, device, days: String(d) })}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  days === d ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-600"
                }`}
              >
                {d} hari
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-2">
          <p className="text-sm font-semibold text-slate-700">
            {clicks.length} klik tercatat · {path} · {device}
          </p>
          {clicks.length === 0 ? (
            <p className="text-slate-500 text-center py-16 bg-white rounded-2xl border border-slate-200">
              Belum ada data klik untuk halaman &amp; periode ini.
            </p>
          ) : (
            <HeatmapCanvas path={path} points={clicks} width={DEVICE_WIDTH[device]} />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 h-fit">
          <p className="font-bold text-sm">Kedalaman Scroll</p>
          <p className="text-xs text-slate-500">{totalScroll} kunjungan tercatat</p>
          <div className="space-y-2">
            {scrollFunnel.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <span className="w-10 text-slate-500">{s.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: `${s.pct}%` }} />
                </div>
                <span className="w-10 text-right font-semibold text-slate-700">{s.pct}%</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            % pengunjung yang men-scroll setidaknya sejauh itu dari halaman.
          </p>
        </div>
      </div>
    </div>
  );
}
