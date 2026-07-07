import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseStoreBlocks } from "@/lib/storeBlocks";
import StoreBuilderForm from "@/components/StoreBuilderForm";

export const dynamic = "force-dynamic";

export default async function StoreBuilderPage() {
  const { store } = await requireSeller();
  const blocks = parseStoreBlocks(store.layoutBlocks);

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { storeId: store.id, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/store" className="text-sm text-teal-600 hover:underline">← Pengaturan Toko</Link>
        <h1 className="text-2xl font-extrabold mt-2 mb-1">Desain Halaman Toko</h1>
        <p className="text-sm text-slate-500">
          Susun blok tampilan halaman tokomu: <span className="font-mono text-teal-600">/s/{store.slug}</span>
        </p>
      </div>
      <StoreBuilderForm blocks={blocks} products={products} categories={categories} />
    </div>
  );
}
