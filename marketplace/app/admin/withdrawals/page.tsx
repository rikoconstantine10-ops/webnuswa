import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { processWithdrawalAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  await requireAdmin();
  const withdrawals = await db.withdrawal.findMany({
    include: { store: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-2">Penarikan Dana Seller</h1>
      <p className="text-sm text-slate-500 mb-6">
        Dana di-hold dari saldo seller saat request. Bila auto-payout (disbursement) aktif, pencairan
        diproses otomatis; status <b>PROCESSING</b> menunggu callback provider. Untuk mode manual:
        transfer ke rekening tujuan lalu tandai <b>Ditransfer</b>. Menolak/gagal mengembalikan dana ke saldo seller.
      </p>

      <div className="space-y-3">
        {withdrawals.length === 0 && (
          <p className="text-slate-500 text-center py-16 bg-white rounded-2xl border border-slate-200">
            Belum ada request penarikan.
          </p>
        )}
        {withdrawals.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-lg">{formatRupiah(w.amount)}</p>
              <p className="text-sm text-slate-600">{w.store.name}</p>
              <p className="text-xs text-slate-500">
                {w.bankName} · {w.bankAccountNumber} a.n. {w.bankAccountName}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(w.createdAt).toLocaleString("id-ID")}
              </p>
              {(w.autoProcessed || w.provider) && (
                <p className="text-xs text-sky-600 mt-0.5">
                  ⚙️ Auto-payout{w.provider ? ` via ${w.provider}` : ""}{w.providerRef ? ` · ref ${w.providerRef}` : ""}
                </p>
              )}
              {w.failureReason && <p className="text-xs text-red-500 mt-0.5">Gagal: {w.failureReason}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  w.status === "PENDING"
                    ? "bg-amber-100 text-amber-700"
                    : w.status === "PAID"
                      ? "bg-emerald-100 text-emerald-700"
                      : w.status === "APPROVED"
                        ? "bg-blue-100 text-blue-700"
                        : w.status === "PROCESSING"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-red-100 text-red-700"
                }`}
              >
                {w.status}
              </span>
              {["PENDING", "APPROVED"].includes(w.status) && (
                <>
                  <form action={processWithdrawalAction}>
                    <input type="hidden" name="id" value={w.id} />
                    <input type="hidden" name="decision" value="PAID" />
                    <button className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-700">
                      ✓ Ditransfer
                    </button>
                  </form>
                  {w.status === "PENDING" && (
                    <form action={processWithdrawalAction}>
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="decision" value="REJECTED" />
                      <button className="bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-200">
                        Tolak
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
