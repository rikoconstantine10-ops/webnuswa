import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string }>;
}) {
  const { q, kategori } = await searchParams;

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        active: true,
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
      <section className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-2xl p-8 md:p-12 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
          Jual & Beli Produk Digital maupun Fisik
        </h1>
        <p className="text-teal-50 mb-6 max-w-xl">
          Marketplace dengan pembayaran QRIS & Virtual Account. Buka toko gratis,
          dana penjualan langsung tercatat di saldo kamu.
        </p>
        <Link
          href="/register-seller"
          className="inline-block bg-white text-teal-700 font-bold px-6 py-3 rounded-full hover:bg-teal-50"
        >
          Buka Toko Gratis
        </Link>
      </section>

      <form className="mb-6 flex gap-2">
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
            href="/"
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${!kategori ? "bg-teal-600 text-white border-teal-600" : "bg-white border-slate-300 text-slate-600"}`}
          >
            Semua
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?kategori=${c.slug}`}
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
