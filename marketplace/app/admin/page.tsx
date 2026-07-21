import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import SalesChart from "@/components/SalesChart";
import { PageHeader, StatCard, Card } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const stuckSince = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const [
    storeCount,
    newStores7d,
    orderCount,
    feeSum,
    pendingWithdrawals,
    gmv,
    feeEntries,
    stuckOrders,
    pendingModeration,
    openDisputes,
    openReports,
    errors24h,
  ] =
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
      db.order.count({
        where: { status: { in: ["PAID", "PROCESSING"] }, shippingAddress: { not: null }, paidAt: { lt: stuckSince } },
      }),
      db.product.count({ where: { moderation: "PENDING" } }),
      db.dispute.count({ where: { status: "OPEN" } }),
      db.productReport.count({ where: { status: "OPEN" } }),
      db.errorLog.count({ where: { level: "error", createdAt: { gt: new Date(Date.now() - 86400000) } } }),
    ]);

  const alerts = [
    { count: stuckOrders, label: "Order fisik macet >3 hari belum dikirim", href: "/admin/transactions", tone: "border-red-400 bg-red-50/60 text-red-700" },
    { count: pendingModeration, label: "Produk menunggu moderasi", href: "/admin/moderation", tone: "border-amber-400 bg-amber-50/60 text-amber-700" },
    { count: openDisputes, label: "Sengketa terbuka", href: "/admin/disputes", tone: "border-orange-400 bg-orange-50/60 text-orange-700" },
    { count: openReports, label: "Laporan produk belum ditinjau", href: "/admin/reports", tone: "border-amber-400 bg-amber-50/60 text-amber-700" },
    { count: pendingWithdrawals, label: "Penarikan dana menunggu diproses", href: "/admin/withdrawals", tone: "border-amber-400 bg-amber-50/60 text-amber-700" },
    { count: errors24h, label: "Error server dalam 24 jam terakhir", href: "/admin/errors", tone: "border-red-400 bg-red-50/60 text-red-700" },
  ].filter((a) => a.count > 0);

  const stats: { icon: string; label: string; value: string; tone: "teal" | "amber" | "emerald" | "slate" }[] = [
    { icon: "💰", label: "Pendapatan Platform (Fee)", value: formatRupiah(-(feeSum._sum.amount ?? 0)), tone: "teal" },
    { icon: "📊", label: "Total Transaksi (GMV)", value: formatRupiah(gmv._sum.total ?? 0), tone: "slate" },
    { icon: "🧾", label: "Order Berbayar", value: String(orderCount), tone: "slate" },
    { icon: "🏪", label: "Total Toko", value: String(storeCount), tone: "slate" },
    { icon: "🆕", label: "Toko Baru (7 Hari)", value: String(newStores7d), tone: newStores7d > 0 ? "teal" : "slate" },
    { icon: "💸", label: "Penarikan Menunggu", value: String(pendingWithdrawals), tone: pendingWithdrawals > 0 ? "amber" : "slate" },
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
      <PageHeader title="Ringkasan Platform" />

      {alerts.length > 0 && (
        <Card>
          <h2 className="font-bold text-sm mb-3">🚨 Perlu Perhatian</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {alerts.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={`flex items-center justify-between gap-2 rounded-xl border-l-4 px-4 py-2.5 text-sm hover:brightness-95 ${a.tone}`}
              >
                <span>{a.label}</span>
                <span className="font-extrabold text-base shrink-0">{a.count}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <SalesChart data={days} title="Pendapatan Fee Platform 30 Hari Terakhir (Rp)" />
    </div>
  );
}
