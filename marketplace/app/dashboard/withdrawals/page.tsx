import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeBalance } from "@/lib/ledger";
import { formatRupiah } from "@/lib/money";
import WithdrawalForm from "@/components/WithdrawalForm";

export const dynamic = "force-dynamic";

const WD_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Menunggu", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Disetujui", cls: "bg-blue-100 text-blue-700" },
  PAID: { label: "Ditransfer", cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
};

export default async function WithdrawalsPage() {
  const { store } = await requireSeller();
  const [balance, withdrawals, ledger] = await Promise.all([
    storeBalance(store.id),
    db.withdrawal.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.ledgerEntry.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-2xl p-6">
        <p className="text-sm text-teal-100 mb-1">Saldo Tersedia</p>
        <p className="text-4xl font-extrabold">{formatRupiah(balance)}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold mb-3">Request Penarikan</h2>
        {store.bankName ? (
          <>
            <p className="text-xs text-slate-500 mb-3">
              Tujuan: {store.bankName} · {store.bankAccountNumber} a.n. {store.bankAccountName}
            </p>
            <WithdrawalForm />
          </>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            Lengkapi rekening bank di <b>Pengaturan Toko</b> dulu sebelum menarik dana.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold mb-3">Riwayat Penarikan</h2>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada penarikan.</p>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => {
              const st = WD_STATUS[w.status] ?? { label: w.status, cls: "bg-slate-100" };
              return (
                <div key={w.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                  <div>
                    <p className="font-bold">{formatRupiah(w.amount)}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(w.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold mb-3">Mutasi Saldo</h2>
        {ledger.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada transaksi.</p>
        ) : (
          <div className="space-y-2">
            {ledger.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                <div>
                  <p className="text-slate-700">{entry.note ?? entry.type}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(entry.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <span className={`font-bold ${entry.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {entry.amount >= 0 ? "+" : ""}
                  {formatRupiah(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
