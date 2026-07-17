import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import KnowledgeList from "@/components/KnowledgeList";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const { store } = await requireSeller();
  const items = await db.waKnowledgeItem.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold mb-2">Basis Pengetahuan</h1>
      <p className="text-sm text-slate-500 mb-6">
        Topik tanya-jawab tambahan untuk chatbot WA-mu (cara pesan, kebijakan retur, jam operasional,
        dll). Cukup teks — foto produk untuk balasan bot sudah otomatis diambil dari katalog aktifmu.
      </p>
      <KnowledgeList items={items} />
    </div>
  );
}
