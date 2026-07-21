import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { getAiCreditBalance, listActiveAiCreditPackages } from "@/lib/aiCredits";
import { checkAiQuota } from "@/lib/kieai";
import { purchaseAiCreditPackageAction } from "@/app/actions/aiCredits";
import { PAYMENT_TYPES, isPaymentTypeAllowed } from "@/lib/louvin";
import { Card, PageHeader, StatCard, Badge, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "amber" | "emerald" | "slate" | "red"> = {
  PENDING: "amber",
  PAID: "emerald",
  EXPIRED: "slate",
  CANCELLED: "red",
};

export default async function AiCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { store } = await requireSeller();
  const { error } = await searchParams;

  const [balance, packages, quota, history] = await Promise.all([
    getAiCreditBalance(store.id),
    listActiveAiCreditPackages(),
    checkAiQuota(store.id),
    db.aiCreditPurchase.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="💎 Kredit AI"
        description="Kuota gratis AI Studio habis? Beli kredit tambahan buat generate foto & caption — tidak hangus."
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{decodeURIComponent(error)}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon="🎟️"
          label="Kuota Gratis Bulan Ini"
          value={`${quota.used}/${quota.limit}`}
          tone={quota.ok ? "teal" : "amber"}
        />
        <StatCard
          icon="💎"
          label="Saldo Kredit Berbayar"
          value={`${balance} kredit`}
          tone={balance > 0 ? "violet" : "slate"}
        />
      </div>

      {packages.length === 0 ? (
        <EmptyState icon="🛒" title="Belum ada paket kredit tersedia" description="Admin belum mengaktifkan paket topup kredit AI." />
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const availableTypes = PAYMENT_TYPES.filter((pt) => isPaymentTypeAllowed(pt.id, pkg.priceRupiah));
            return (
              <Card key={pkg.id} className="space-y-3">
                <div>
                  <p className="font-bold text-sm">{pkg.name}</p>
                  <p className="text-2xl font-extrabold text-violet-600">
                    {pkg.credits} <span className="text-sm font-medium text-slate-400">kredit</span>
                  </p>
                  <p className="text-sm text-slate-500">{formatRupiah(pkg.priceRupiah)}</p>
                </div>
                <form action={purchaseAiCreditPackageAction} className="space-y-2">
                  <input type="hidden" name="packageId" value={pkg.id} />
                  <select
                    name="paymentType"
                    defaultValue={availableTypes[0]?.id}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    {availableTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>{pt.label}</option>
                    ))}
                  </select>
                  <button className="w-full bg-violet-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-violet-700">
                    Beli
                  </button>
                </form>
              </Card>
            );
          })}
        </div>
      )}

      <div>
        <h2 className="font-bold text-sm mb-2">Riwayat Pembelian</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada pembelian.</p>
        ) : (
          <Card className="!p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Paket</th>
                  <th className="px-4 py-3">Kredit</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-slate-50">
                    <td className="px-4 py-2.5">
                      {h.status === "PENDING" ? (
                        <Link href={`/dashboard/ai-credits/${h.id}`} className="text-violet-600 font-semibold hover:underline">
                          {h.packageName}
                        </Link>
                      ) : (
                        h.packageName
                      )}
                    </td>
                    <td className="px-4 py-2.5">{h.credits}</td>
                    <td className="px-4 py-2.5">{formatRupiah(h.priceRupiah)}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={STATUS_TONE[h.status] ?? "slate"}>{h.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
