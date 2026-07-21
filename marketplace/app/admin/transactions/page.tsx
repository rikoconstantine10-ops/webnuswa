import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { getLouvinBalance } from "@/lib/louvin";
import { Card, PageHeader, StatCard, Badge, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const STATUSES = ["", "PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "EXPIRED"];

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const [orders, liability, heldWithdrawals, louvinBalance, feeSum] = await Promise.all([
    db.order.findMany({
      where: status ? { status } : {},
      include: { store: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    // Kewajiban ke seller = total saldo semua toko (sum seluruh ledger).
    db.ledgerEntry.aggregate({ _sum: { amount: true } }),
    db.withdrawal.aggregate({
      where: { status: { in: ["PENDING", "APPROVED"] } },
      _sum: { amount: true },
    }),
    getLouvinBalance(),
    db.ledgerEntry.aggregate({ where: { type: "PLATFORM_FEE" }, _sum: { amount: true } }),
  ]);

  const totalLiability = (liability._sum.amount ?? 0) + (heldWithdrawals._sum.amount ?? 0);
  const reconciled = louvinBalance !== null && louvinBalance >= totalLiability;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi & Rekonsiliasi"
        action={
          <a
            href={`/api/admin/transactions/export${status ? `?status=${status}` : ""}`}
            className="border border-slate-300 bg-white text-slate-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-slate-50"
          >
            ⬇ Export CSV
          </a>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon="⚠️" label="Kewajiban ke Seller" value={formatRupiah(totalLiability)} tone="amber" />
        <StatCard
          icon={reconciled ? "✅" : "🚨"}
          label="Saldo Louvin"
          value={louvinBalance !== null ? formatRupiah(louvinBalance) : "—"}
          tone={louvinBalance === null ? "slate" : reconciled ? "emerald" : "amber"}
        />
        <StatCard icon="💰" label="Pendapatan Fee (semua waktu)" value={formatRupiah(-(feeSum._sum.amount ?? 0))} tone="teal" />
      </div>
      {louvinBalance !== null && !reconciled && (
        <p className="text-xs bg-red-50 text-red-700 rounded-xl px-4 py-2.5">
          ⚠️ Saldo Louvin di bawah kewajiban seller — periksa segera!
        </p>
      )}
      {louvinBalance === null && (
        <p className="text-xs bg-slate-50 text-slate-500 rounded-xl px-4 py-2.5">
          Saldo Louvin tidak terbaca via API — cek dashboard Louvin dan bandingkan manual.
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/admin/transactions?status=${s}` : "/admin/transactions"}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
              (status ?? "") === s
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white border-slate-300 text-slate-600"
            }`}
          >
            {s || "Semua"}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState icon="🧾" title="Tidak ada transaksi" />
      ) : (
        <Card className="!p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Toko</th>
                <th className="px-4 py-3">Pembeli</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs">{o.code}</td>
                  <td className="px-4 py-2.5">{o.store.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{o.buyerName}</td>
                  <td className="px-4 py-2.5 font-bold">{formatRupiah(o.total)}</td>
                  <td className="px-4 py-2.5 text-teal-600">{o.platformFee ? formatRupiah(o.platformFee) : "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge>{o.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">
                    {new Date(o.createdAt).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
