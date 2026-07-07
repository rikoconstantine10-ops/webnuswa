import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import SalesChart from "@/components/SalesChart";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [storeCount, newStores7d, orderCount, feeSum, pendingWithdrawals, gmv, feeEntries] =
    await Promise.all([
      db.store.count(),
      db.store.count({ where: { createdAt: { gte: since7 } } }),
      db.order.count({ where: { status: { notIn: ["PENDING_PAYMENT", "EXPIRED", "CANCELLED"] } } }),
      db.ledgerEntry.aggregate({ where: { type: "PLATFORM_FEE" }, _sum: { amount: true } }),
      db.withdrawal.count({ where: { status: "PENDING" } }),
      db.order.aggregate({
        where: { status: { notIn: ["PENDING_PAYMENT", "EXPIRED", "CANCELLED"] } },
        _sum: { total: true },
      }),
      db.ledgerEntry.findMany({
        where: { type: "PLATFORM_FEE", createdAt: { gte: since30 } },
        select: { amount: true, createdAt: true },
      }),
    ]);

  const stats = [
    { label: "Pendapatan Platform (Fee)", value: formatRupiah(-(feeSum._sum.amount ?? 0)), accent: "text-teal-600" },
    { label: "Total Transaksi (GMV)", value: formatRupiah(gmv._sum.total ?? 0) },
    { label: "Order Berbayar", value: String(orderCount) },
    { label: "Total Toko", value: String(storeCount) },
    { label: "Toko Baru (7 Hari)", value: String(newStores7d), accent: newStores7d > 0 ? "text-teal-600" : undefined },
    { label: "Penarikan Menunggu", value: String(pendingWithdrawals), accent: pendingWithdrawals > 0 ? "text-amber-600" : undefined },
  ];

  // Agregasi fee platform per hari, 30 hari terakhir.
  const days: { label: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const value = feeEntries
      .filter((e) => e.createdAt.toISOString().slice(0, 10) === key)
      .reduce((sum, e) => sum - e.amount, 0);
    days.push({ label, value });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Ringkasan Platform</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-extrabold ${s.accent ?? ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <SalesChart data={days} title="Pendapatan Fee Platform 30 Hari Terakhir (Rp)" />
    </div>
  );
}
