import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { kieAiEnabled } from "@/lib/kieai";
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
    include: {
      digitalAsset: { select: { fileName: true } },
      variants: { select: { name: true, price: true, stock: true } },
      wholesaleTiers: { select: { minQty: true, price: true } },
      images: { select: { url: true }, orderBy: { sort: "asc" } },
    },
  });
  if (!product) notFound();

  const [categories, aiEnabled] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    kieAiEnabled(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Edit Produk</h1>
      <ProductForm categories={categories} product={product} aiEnabled={aiEnabled} />
    </div>
  );
}
