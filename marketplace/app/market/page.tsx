import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Belanja — NuswaMart",
};

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string }>;
}) {
  const { q, kategori } = await searchParams;

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        active: true,
        moderation: "APPROVED",
        store: { status: "ACTIVE" },
        ...(q ? { name: { contains: q } } : {}),
        ...(kategori ? { category: { slug: kategori } } : {}),
      },
      include: { store: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 48,
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6">Jelajahi Produk</h1>

      <form className="mb-6 flex gap-2" action="/market">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Cari produk..."
          className="flex-1 bg-white border border-slate-300 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button className="bg-slate-900 text-white px-6 rounded-full text-sm font-semibold hover:bg-slate-700">
          Cari
        </button>
      </form>

      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <Link
            href="/market"
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${!kategori ? "bg-teal-600 text-white border-teal-600" : "bg-white border-slate-300 text-slate-600"}`}
          >
            Semua
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/market?kategori=${c.slug}`}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${kategori === c.slug ? "bg-teal-600 text-white border-teal-600" : "bg-white border-slate-300 text-slate-600"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-center text-slate-500 py-16">Belum ada produk.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
