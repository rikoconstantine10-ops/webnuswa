import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeBalance, storeHeldBalance } from "@/lib/ledger";
import { formatRupiah } from "@/lib/money";
import { waStatus } from "@/lib/wa";
import SalesChart from "@/components/SalesChart";
import { markProcessingAction } from "@/app/actions/seller";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const { store } = await requireSeller();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [balance, heldBalance, productCount, pendingOrders, totalSales, paidOrders, topItems, announcements, actionableOrders, wa] =
    await Promise.all([
      storeBalance(store.id),
      storeHeldBalance(store.id),
      db.product.count({ where: { storeId: store.id, active: true } }),
      db.order.count({ where: { storeId: store.id, status: { in: ["PAID", "PROCESSING"] } } }),
      db.ledgerEntry.aggregate({
        where: { storeId: store.id, type: "SALE_CREDIT" },
        _sum: { amount: true },
      }),
      db.order.findMany({
        where: { storeId: store.id, paidAt: { gte: since } },
        select: { paidAt: true, subtotal: true },
      }),
      db.orderItem.groupBy({
        by: ["productId", "name"],
        where: { order: { storeId: store.id, paidAt: { not: null } } },
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 5,
      }),
      db.announcement.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 3 }),
      db.order.findMany({
        where: { storeId: store.id, status: { in: ["PAID", "PROCESSING"] } },
        orderBy: { paidAt: "desc" },
        take: 5,
      }),
      waStatus(store.id),
    ]);

  const checklist = [
    { done: productCount > 0, label: "Tambah produk pertama", href: "/dashboard/products/new" },
    { done: Boolean(store.bankName && store.bankAccountNumber), label: "Atur rekening bank", href: "/dashboard/store" },
    { done: Boolean(store.originAreaId), label: "Atur alamat asal pengiriman", href: "/dashboard/store" },
    { done: wa.status === "connected", label: "Sambungkan WhatsApp", href: "/dashboard/whatsapp" },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;

  // Agregasi penjualan per hari, 30 hari terakhir
  const days: { label: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const value = paidOrders
      .filter((o) => o.paidAt && o.paidAt.toISOString().slice(0, 10) === key)
      .reduce((sum, o) => sum + o.subtotal, 0);
    days.push({ label, value });
  }

  const stats = [
    { label: "Saldo Tersedia", value: formatRupiah(balance), accent: "text-teal-600" },
    { label: "Saldo Tertahan (Escrow)", value: formatRupiah(heldBalance), accent: heldBalance > 0 ? "text-amber-600" : undefined },
    { label: "Total Penjualan", value: formatRupiah(totalSales._sum.amount ?? 0) },
    { label: "Produk Aktif", value: String(productCount) },
    { label: "Pesanan Perlu Diproses", value: String(pendingOrders), accent: pendingOrders > 0 ? "text-amber-600" : undefined },
  ];

  return (
    <div className="space-y-6">
      {announcements.map((a) => (
        <p key={a.id} className="text-sm bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl px-4 py-3">
          📢 {a.message}
        </p>
      ))}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">Ringkasan Toko</h1>
        <Link
          href="/dashboard/withdrawals"
          className="bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700"
        >
          💸 Tarik Dana
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-extrabold ${s.accent ?? ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {store.status === "PENDING" && (
        <p className="text-sm bg-amber-50 text-amber-700 rounded-xl px-4 py-3">
          Tokomu sedang menunggu persetujuan admin. Produk belum tampil di marketplace sampai toko disetujui.
        </p>
      )}

      {checklistDone < checklist.length && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">Lengkapi Setup Toko</h2>
            <span className="text-xs text-slate-400">{checklistDone}/{checklist.length} selesai</span>
          </div>
          <div className="space-y-2">
            {checklist.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                  c.done ? "text-slate-400 line-through" : "text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                }`}
              >
                <span>{c.done ? "✅" : "⬜"}</span>
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {actionableOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">Perlu Diproses</h2>
            <Link href="/dashboard/orders" className="text-teal-600 text-xs font-bold hover:underline">
              Lihat Semua Pesanan →
            </Link>
          </div>
          <div className="space-y-2">
            {actionableOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 text-sm border-b border-slate-50 pb-2">
                <div className="min-w-0">
                  <p className="font-mono font-bold">{o.code}</p>
                  <p className="text-xs text-slate-500 truncate">{o.buyerName} · {formatRupiah(o.total)}</p>
                </div>
                {o.status === "PAID" ? (
                  <form action={markProcessingAction}>
                    <input type="hidden" name="orderId" value={o.id} />
                    <button className="bg-teal-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-teal-700 shrink-0">
                      Proses
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/dashboard/orders"
                    className="text-amber-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-300 shrink-0"
                  >
                    Diproses
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <SalesChart data={days} title="Penjualan 30 Hari Terakhir (Rp)" />

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">Produk Terlaris</h2>
          <Link href="/dashboard/analytics" className="text-teal-600 text-xs font-bold hover:underline">
            Analitik Lengkap →
          </Link>
        </div>
        {topItems.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada penjualan.</p>
        ) : (
          <div className="space-y-2">
            {topItems.map((t, i) => (
              <div key={t.productId} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                <span>
                  <span className="text-slate-400 font-mono mr-2">#{i + 1}</span>
                  {t.name}
                </span>
                <span className="font-bold">{t._sum.qty} terjual</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
