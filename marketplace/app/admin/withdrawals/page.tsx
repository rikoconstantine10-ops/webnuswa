import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { processWithdrawalAction } from "@/app/actions/admin";
import { Card, PageHeader, Badge, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["PENDING", "APPROVED", "PROCESSING", "PAID", "REJECTED"];
const STATUS_TONE: Record<string, "amber" | "emerald" | "blue" | "sky" | "red"> = {
  PENDING: "amber",
  PAID: "emerald",
  APPROVED: "blue",
  PROCESSING: "sky",
  REJECTED: "red",
};

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const withdrawals = await db.withdrawal.findMany({
    where: status && STATUS_OPTIONS.includes(status) ? { status } : {},
    include: { store: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Penarikan Dana Seller"
        description="Dana di-hold dari saldo seller saat request. Bila auto-payout aktif, pencairan diproses otomatis (status PROCESSING menunggu callback provider). Mode manual: transfer ke rekening tujuan lalu tandai Ditransfer. Menolak/gagal mengembalikan dana ke saldo seller."
        action={
          <a
            href="/api/admin/withdrawals/export"
            className="border border-slate-300 bg-white text-slate-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-slate-50"
          >
            ⬇ Export CSV
          </a>
        }
      />

      <div className="flex gap-2 flex-wrap mb-4">
        <Link
          href="/admin/withdrawals"
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${!status ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-600"}`}
        >
          Semua
        </Link>
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={`/admin/withdrawals?status=${s}`}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${status === s ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-600"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      {withdrawals.length === 0 ? (
        <EmptyState icon="💰" title="Belum ada request penarikan" />
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <Card key={w.id} className="flex flex-wrap items-center justify-between gap-3">
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
                <Badge tone={STATUS_TONE[w.status] ?? "slate"}>{w.status}</Badge>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
