import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeAiEnabled, checkAiQuota } from "@/lib/kieai";
import { getAiCreditBalance } from "@/lib/aiCredits";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import AiStudioPanel from "@/components/AiStudioPanel";

export const dynamic = "force-dynamic";

export default async function AiStudioPage() {
  const { store } = await requireSeller();
  const [enabled, products, quota, creditBalance] = await Promise.all([
    storeAiEnabled(store.id),
    db.product.findMany({
      where: { storeId: store.id },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { createdAt: "desc" },
    }),
    checkAiQuota(store.id),
    getAiCreditBalance(store.id),
  ]);

  return (
    <div>
      <PageHeader
        title="✨ AI Studio"
        description="Generate foto studio & caption produk pakai AI."
        action={
          enabled ? (
            <Link
              href="/dashboard/ai-credits"
              className="text-xs bg-violet-50 text-violet-700 font-bold px-3 py-2 rounded-lg hover:bg-violet-100"
            >
              💎 {creditBalance} kredit · Kuota gratis {quota.used}/{quota.limit} · Beli Kredit →
            </Link>
          ) : undefined
        }
      />
      {!enabled ? (
        <EmptyState
          icon="✨"
          title="Fitur AI belum diaktifkan untuk tokomu"
          description="Hubungi admin platform untuk mengaktifkan generate foto & caption AI di tokomu."
        />
      ) : (
        <AiStudioPanel products={products} />
      )}
    </div>
  );
}
