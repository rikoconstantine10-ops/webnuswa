import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await db.store.findUnique({
    where: { slug },
    include: {
      products: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!store || store.status !== "ACTIVE") notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-2xl overflow-hidden">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            "🏪"
          )}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{store.name}</h1>
          {store.description && <p className="text-sm text-slate-500">{store.description}</p>}
        </div>
      </div>

      {store.products.length === 0 ? (
        <p className="text-center text-slate-500 py-16">Toko ini belum punya produk.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {store.products.map((p) => (
            <ProductCard
              key={p.id}
              product={{ ...p, store: { name: store.name, slug: store.slug } }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
