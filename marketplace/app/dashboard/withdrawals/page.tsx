import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeBalance } from "@/lib/ledger";
import { formatRupiah } from "@/lib/money";
import WithdrawalForm from "@/components/WithdrawalForm";
import { Card, Badge } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const WD_STATUS: Record<string, { label: string; tone: "amber" | "blue" | "emerald" | "red" }> = {
  PENDING: { label: "Menunggu", tone: "amber" },
  APPROVED: { label: "Disetujui", tone: "blue" },
  PAID: { label: "Ditransfer", tone: "emerald" },
  REJECTED: { label: "Ditolak", tone: "red" },
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
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-teal-100 mb-1">Saldo Tersedia</p>
        <p className="text-4xl font-extrabold">{formatRupiah(balance)}</p>
      </div>

      <Card>
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
      </Card>

      <Card>
        <h2 className="font-bold mb-3">Riwayat Penarikan</h2>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada penarikan.</p>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => {
              const st = WD_STATUS[w.status] ?? { label: w.status, tone: "slate" as const };
              return (
                <div key={w.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold">{formatRupiah(w.amount)}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(w.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-bold mb-3">Mutasi Saldo</h2>
        {ledger.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada transaksi.</p>
        ) : (
          <div className="space-y-2">
            {ledger.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
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
      </Card>
    </div>
  );
}
