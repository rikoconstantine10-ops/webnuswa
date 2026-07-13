import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { extractPaymentDisplay } from "@/lib/paymentDisplay";
import PaymentInstructions from "@/components/PaymentInstructions";

export const dynamic = "force-dynamic";

export default async function AiCreditPurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { store } = await requireSeller();
  const { id } = await params;
  const purchase = await db.aiCreditPurchase.findFirst({ where: { id, storeId: store.id } });
  if (!purchase) notFound();

  const pay = extractPaymentDisplay(purchase.paymentInfo);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Link href="/dashboard/ai-credits" className="text-xs text-slate-400 hover:underline">
        ← Kredit AI
      </Link>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-6">
        <p className="text-xs text-slate-500">Topup Kredit AI</p>
        <h1 className="text-xl font-extrabold">
          {purchase.packageName} — {purchase.credits} kredit
        </h1>
        <p className="text-2xl font-extrabold text-violet-600 mt-1">{formatRupiah(purchase.priceRupiah)}</p>

        {purchase.status === "PAID" && (
          <p className="mt-4 text-sm bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3">
            ✓ Pembayaran diterima — {purchase.credits} kredit sudah ditambahkan ke saldo tokomu.
          </p>
        )}

        {["EXPIRED", "CANCELLED"].includes(purchase.status) && (
          <p className="mt-4 text-sm bg-red-50 text-red-600 rounded-xl px-4 py-3">
            Pembayaran {purchase.status === "EXPIRED" ? "kedaluwarsa" : "dibatalkan"}.{" "}
            <Link href="/dashboard/ai-credits" className="underline font-bold">Coba beli lagi</Link>.
          </p>
        )}

        {purchase.status === "PENDING" && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <PaymentInstructions pay={pay} baseAmount={purchase.priceRupiah} paymentType={purchase.paymentType} />
          </div>
        )}
      </div>
    </div>
  );
}
