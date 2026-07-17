import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeAiFeatureEnabled } from "@/lib/kieai";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import AiStudioCaptionPanel from "@/components/AiStudioCaptionPanel";

export const dynamic = "force-dynamic";

export default async function AiStudioCaptionPage() {
  const { store } = await requireSeller();
  const [enabled, products] = await Promise.all([
    storeAiFeatureEnabled(store.id, "caption"),
    db.product.findMany({
      where: { storeId: store.id },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="📝 Generate Caption" description="Generate caption/deskripsi produk pakai AI." />
      {!enabled ? (
        <EmptyState
          icon="📝"
          title="Fitur AI belum diaktifkan untuk tokomu"
          description="Hubungi admin platform untuk mengaktifkan generate caption AI di tokomu."
        />
      ) : (
        <AiStudioCaptionPanel products={products} />
      )}
    </div>
  );
}
