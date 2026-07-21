import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  direct: "Langsung / Ketik URL",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  google: "Google",
  x: "X (Twitter)",
};

export default async function AnalyticsPage() {
  const { store } = await requireSeller();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [events, abandoned, productViews] = await Promise.all([
    db.analyticsEvent.groupBy({
      by: ["type"],
      where: { storeId: store.id, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    db.order.findMany({
      where: {
        storeId: store.id,
        status: "PENDING_PAYMENT",
        createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000), gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: { select: { name: true, qty: true } } },
    }),
    db.analyticsEvent.groupBy({
      by: ["productId", "type"],
      where: { storeId: store.id, createdAt: { gte: since }, productId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const sources = await db.analyticsEvent.groupBy({
    by: ["source"],
    where: { storeId: store.id, type: "VIEW", createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { source: "desc" } },
  });

  const count = (type: string) => events.find((e) => e.type === type)?._count._all ?? 0;
  const views = count("VIEW");
  const checkouts = count("CHECKOUT");
  const purchases = count("PURCHASE");
  const totalViews = sources.reduce((s, x) => s + x._count._all, 0) || 1;

  // Per-produk: gabungkan view/checkout/purchase
  const productIds = [...new Set(productViews.map((p) => p.productId!))];
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const perProduct = productIds
    .map((id) => {
      const get = (type: string) =>
        productViews.find((p) => p.productId === id && p.type === type)?._count._all ?? 0;
      return {
        id,
        name: products.find((p) => p.id === id)?.name ?? "(produk terhapus)",
        views: get("VIEW"),
        checkouts: get("CHECKOUT"),
        purchases: get("PURCHASE"),
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const potentialLoss = abandoned.reduce((s, o) => s + o.total, 0);

  const funnel = [
    { label: "Dilihat", value: views, cls: "bg-teal-500" },
    { label: "Mulai Checkout", value: checkouts, cls: "bg-cyan-500" },
    { label: "Dibayar", value: purchases, cls: "bg-emerald-500" },
  ];
  const funnelMax = Math.max(views, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Analitik Toko</h1>
        <p className="text-sm text-slate-500">30 hari terakhir</p>
      </div>

      {/* Funnel konversi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-sm mb-4">Funnel Konversi</h2>
        <div className="space-y-3">
          {funnel.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-sm text-slate-500 w-32 shrink-0">{f.label}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full ${f.cls}`}
                  style={{ width: `${Math.max((f.value / funnelMax) * 100, f.value > 0 ? 3 : 0)}%` }}
                />
              </div>
              <span className="text-sm font-bold w-16 text-right">{f.value}</span>
            </div>
          ))}
        </div>
        {views > 0 && (
          <p className="text-xs text-slate-500 mt-3">
            Rasio konversi lihat → beli: <b>{((purchases / views) * 100).toFixed(1)}%</b>
          </p>
        )}
      </div>

      {/* Sumber traffic */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-sm mb-1">Sumber Pengunjung</h2>
        <p className="text-xs text-slate-400 mb-4">
          Tips: bagikan link produkmu dengan <code className="bg-slate-100 px-1 rounded">?ref=instagram</code> dll. agar sumbernya terlacak akurat.
        </p>
        {sources.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada kunjungan.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => {
              const key = s.source ?? "direct";
              const pct = (s._count._all / totalViews) * 100;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-40 shrink-0 truncate">
                    {SOURCE_LABEL[key] ?? key}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <span className="text-xs font-bold w-20 text-right">
                    {s._count._all} ({pct.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Funnel per produk */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 overflow-x-auto">
        <h2 className="font-bold text-sm mb-3">Performa per Produk</h2>
        {perProduct.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada data.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4">Produk</th>
                <th className="py-2 pr-4">Dilihat</th>
                <th className="py-2 pr-4">Checkout</th>
                <th className="py-2 pr-4">Dibeli</th>
                <th className="py-2">Konversi</th>
              </tr>
            </thead>
            <tbody>
              {perProduct.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-2 pr-4 font-medium">{p.name}</td>
                  <td className="py-2 pr-4">{p.views}</td>
                  <td className="py-2 pr-4">{p.checkouts}</td>
                  <td className="py-2 pr-4">{p.purchases}</td>
                  <td className="py-2 font-bold">
                    {p.views > 0 ? `${((p.purchases / p.views) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Checkout terbengkalai */}
      <div className="bg-white rounded-2xl border border-amber-200 p-5">
        <h2 className="font-bold text-sm mb-1">🛒 Checkout Terbengkalai</h2>
        <p className="text-xs text-slate-400 mb-3">
          Pembeli yang membuat pesanan tapi belum bayar lebih dari 1 jam. Potensi hilang:{" "}
          <b className="text-amber-600">{formatRupiah(potentialLoss)}</b>
        </p>
        {abandoned.length === 0 ? (
          <p className="text-sm text-slate-400">Tidak ada — bagus! 🎉</p>
        ) : (
          <div className="space-y-2">
            {abandoned.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                <div>
                  <p className="font-medium">
                    {o.buyerName} · <span className="text-slate-400">{o.buyerEmail}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {o.items.map((i) => `${i.name} x${i.qty}`).join(", ")} ·{" "}
                    {new Date(o.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <span className="font-bold">{formatRupiah(o.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
