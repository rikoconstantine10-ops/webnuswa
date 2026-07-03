import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();

  const [storeCount, pendingStores, orderCount, feeSum, pendingWithdrawals, gmv] =
    await Promise.all([
      db.store.count(),
      db.store.count({ where: { status: "PENDING" } }),
      db.order.count({ where: { status: { notIn: ["PENDING_PAYMENT", "EXPIRED", "CANCELLED"] } } }),
      db.ledgerEntry.aggregate({ where: { type: "PLATFORM_FEE" }, _sum: { amount: true } }),
      db.withdrawal.count({ where: { status: "PENDING" } }),
      db.order.aggregate({
        where: { status: { notIn: ["PENDING_PAYMENT", "EXPIRED", "CANCELLED"] } },
        _sum: { total: true },
      }),
    ]);

  const stats = [
    { label: "Pendapatan Platform (Fee)", value: formatRupiah(-(feeSum._sum.amount ?? 0)), accent: "text-teal-600" },
    { label: "Total Transaksi (GMV)", value: formatRupiah(gmv._sum.total ?? 0) },
    { label: "Order Berbayar", value: String(orderCount) },
    { label: "Total Toko", value: String(storeCount) },
    { label: "Toko Menunggu Persetujuan", value: String(pendingStores), accent: pendingStores > 0 ? "text-amber-600" : undefined },
    { label: "Penarikan Menunggu", value: String(pendingWithdrawals), accent: pendingWithdrawals > 0 ? "text-amber-600" : undefined },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Ringkasan Platform</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-extrabold ${s.accent ?? ""}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
