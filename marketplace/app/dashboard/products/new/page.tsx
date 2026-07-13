import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { kieAiEnabled } from "@/lib/kieai";
import ProductForm from "@/components/ProductForm";

export default async function NewProductPage() {
  await requireSeller();
  const [categories, aiEnabled] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    kieAiEnabled(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Tambah Produk</h1>
      <ProductForm categories={categories} aiEnabled={aiEnabled} />
    </div>
  );
}
