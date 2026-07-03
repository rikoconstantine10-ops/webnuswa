import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { store } = await requireSeller();
  const { id } = await params;

  const product = await db.product.findFirst({
    where: { id, storeId: store.id },
    include: { digitalAsset: { select: { fileName: true } } },
  });
  if (!product) notFound();

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Edit Produk</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
