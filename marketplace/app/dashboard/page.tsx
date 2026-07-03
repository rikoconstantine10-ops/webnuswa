import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeBalance } from "@/lib/ledger";
import { formatRupiah } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const { store } = await requireSeller();

  const [balance, productCount, pendingOrders, totalSales] = await Promise.all([
    storeBalance(store.id),
    db.product.count({ where: { storeId: store.id, active: true } }),
    db.order.count({ where: { storeId: store.id, status: { in: ["PAID", "PROCESSING"] } } }),
    db.ledgerEntry.aggregate({
      where: { storeId: store.id, type: "SALE_CREDIT" },
      _sum: { amount: true },
    }),
  ]);

  const stats = [
    { label: "Saldo Tersedia", value: formatRupiah(balance), accent: "text-teal-600" },
    { label: "Total Penjualan", value: formatRupiah(totalSales._sum.amount ?? 0) },
    { label: "Produk Aktif", value: String(productCount) },
    { label: "Pesanan Perlu Diproses", value: String(pendingOrders), accent: pendingOrders > 0 ? "text-amber-600" : undefined },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Ringkasan Toko</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-extrabold ${s.accent ?? ""}`}>{s.value}</p>
          </div>
        ))}
      </div>
      {store.status === "PENDING" && (
        <p className="mt-6 text-sm bg-amber-50 text-amber-700 rounded-xl px-4 py-3">
          Tokomu sedang menunggu persetujuan admin. Produk belum tampil di marketplace sampai toko disetujui.
        </p>
      )}
    </div>
  );
}
