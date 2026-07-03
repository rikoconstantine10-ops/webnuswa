import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { getLouvinBalance } from "@/lib/louvin";

export const dynamic = "force-dynamic";

const STATUSES = ["", "PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "EXPIRED"];

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const [orders, liability, heldWithdrawals, louvinBalance] = await Promise.all([
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
  ]);

  const totalLiability = (liability._sum.amount ?? 0) + (heldWithdrawals._sum.amount ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Transaksi & Rekonsiliasi</h1>

      {/* Rekonsiliasi */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Kewajiban ke Seller</p>
          <p className="text-xl font-extrabold text-amber-600">{formatRupiah(totalLiability)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Saldo semua toko + penarikan yang sedang diproses
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Saldo Louvin</p>
          <p className="text-xl font-extrabold">
            {louvinBalance !== null ? formatRupiah(louvinBalance) : "—"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {louvinBalance !== null
              ? louvinBalance >= totalLiability
                ? "✅ Cukup menutup kewajiban seller"
                : "⚠️ DI BAWAH kewajiban seller — periksa!"
              : "Tidak terbaca via API — cek dashboard Louvin dan bandingkan manual"}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Pendapatan Fee (semua waktu)</p>
          <p className="text-xl font-extrabold text-teal-600">
            {formatRupiah(
              -((await db.ledgerEntry.aggregate({ where: { type: "PLATFORM_FEE" }, _sum: { amount: true } }))._sum.amount ?? 0)
            )}
          </p>
        </div>
      </div>

      {/* Filter status */}
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

      {/* Tabel order */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100">
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-400">
                  {new Date(o.createdAt).toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-slate-400 py-10">
                  Tidak ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
