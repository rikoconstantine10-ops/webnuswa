import ProductCard from "@/components/ProductCard";
import type { StoreBlock } from "@/lib/storeBlocks";

type RawProduct = {
  id: string;
  categoryId: string | null;
  slug: string;
  name: string;
  price: number;
  type: string;
  imageUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  salePrice: number | null;
  saleEndsAt: Date | null;
  boostedUntil: Date | null;
};

export default function StoreBlocks({
  blocks,
  products,
  storeName,
  storeSlug,
}: {
  blocks: StoreBlock[];
  products: RawProduct[];
  storeName: string;
  storeSlug: string;
}) {
  if (blocks.length === 0) return null;

  const byId = new Map(products.map((p) => [p.id, p]));
  const store = { name: storeName, slug: storeSlug };

  return (
    <div className="space-y-10 mb-10">
      {blocks.map((b) => {
        if (b.type === "banner") {
          return (
            <a
              key={b.id}
              href={b.linkUrl || undefined}
              className="block rounded-2xl overflow-hidden border border-slate-200 relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.imageUrl} alt={b.heading} className="w-full h-40 md:h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-5 text-white">
                <h3 className="text-xl md:text-2xl font-extrabold">{b.heading}</h3>
                {b.subheading && <p className="text-sm text-white/80">{b.subheading}</p>}
              </div>
            </a>
          );
        }

        if (b.type === "featured_products") {
          const items = b.productIds.map((id) => byId.get(id)).filter((p): p is RawProduct => Boolean(p));
          if (items.length === 0) return null;
          return (
            <section key={b.id}>
              <h2 className="text-xl font-extrabold mb-4">{b.heading}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map((p) => (
                  <ProductCard key={p.id} product={{ ...p, store }} />
                ))}
              </div>
            </section>
          );
        }

        if (b.type === "category") {
          const items = products.filter((p) => p.categoryId === b.categoryId);
          if (items.length === 0) return null;
          return (
            <section key={b.id}>
              <h2 className="text-xl font-extrabold mb-4">{b.heading}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map((p) => (
                  <ProductCard key={p.id} product={{ ...p, store }} />
                ))}
              </div>
            </section>
          );
        }

        if (b.type === "testimonials") {
          return (
            <section key={b.id}>
              <h2 className="text-xl font-extrabold mb-4">{b.heading}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {b.items.map((t, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
                    {t.rating && <p className="text-amber-400 mb-1">{"⭐".repeat(t.rating)}</p>}
                    <p className="text-sm text-slate-600 italic mb-2">&ldquo;{t.quote}&rdquo;</p>
                    <p className="text-sm font-bold">{t.name}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // text
        return (
          <section key={b.id} className="bg-white rounded-2xl border border-slate-200 p-6">
            {b.heading && <h2 className="text-xl font-extrabold mb-2">{b.heading}</h2>}
            <p className="text-sm text-slate-600 whitespace-pre-line">{b.body}</p>
          </section>
        );
      })}
    </div>
  );
}
