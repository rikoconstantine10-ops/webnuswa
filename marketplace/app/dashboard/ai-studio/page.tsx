import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeAiEnabled } from "@/lib/kieai";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import AiStudioPanel from "@/components/AiStudioPanel";

export const dynamic = "force-dynamic";

export default async function AiStudioPage() {
  const { store } = await requireSeller();
  const [enabled, products] = await Promise.all([
    storeAiEnabled(store.id),
    db.product.findMany({
      where: { storeId: store.id },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="✨ AI Studio" description="Generate foto studio & caption produk pakai AI." />
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
