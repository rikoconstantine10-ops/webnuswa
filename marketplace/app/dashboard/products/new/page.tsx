import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";

export default async function NewProductPage() {
  await requireSeller();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Tambah Produk</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
