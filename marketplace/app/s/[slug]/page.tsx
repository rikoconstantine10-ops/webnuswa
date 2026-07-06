import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import VerifiedBadge from "@/components/VerifiedBadge";

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
        where: { active: true, moderation: "APPROVED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!store || store.status !== "ACTIVE") notFound();

  const appUrl = process.env.APP_URL || "";
  const shareText = encodeURIComponent(`Cek toko ${store.name}!\n${appUrl}/s/${store.slug}`);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
        {store.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.bannerUrl} alt="" className="w-full h-40 md:h-56 object-cover" />
        ) : (
          <div className="w-full h-24 bg-gradient-to-r from-teal-500 to-cyan-600" />
        )}
        <div className="p-6 flex flex-wrap items-center gap-4 -mt-12">
          <div className="w-20 h-20 rounded-full bg-teal-100 border-4 border-white shadow flex items-center justify-center text-3xl overflow-hidden shrink-0">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              "🏪"
            )}
          </div>
          <div className="pt-10 flex-1 min-w-48">
            <h1 className="text-2xl font-extrabold flex items-center gap-2 flex-wrap">
              {store.name}
              {store.verified && <VerifiedBadge />}
            </h1>
            {store.description && <p className="text-sm text-slate-500">{store.description}</p>}
          </div>
          <div className="pt-10 flex gap-2">
            {store.whatsapp && (
              <a
                href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(`Halo ${store.name}!`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700"
              >
                💬 Chat Penjual
              </a>
            )}
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-bold bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-full hover:border-emerald-400"
            >
              📤 Bagikan
            </a>
          </div>
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
