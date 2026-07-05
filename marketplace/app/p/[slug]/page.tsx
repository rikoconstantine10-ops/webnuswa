import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/money";
import { detectSource, trackEvent } from "@/lib/analytics";
import BuyForm from "@/components/BuyForm";
import MetaPixel from "@/components/MetaPixel";
import Stars from "@/components/Stars";
import { addToCartAction } from "@/app/actions/cart";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    select: { name: true, description: true, imageUrl: true, price: true, store: { select: { name: true } } },
  });
  if (!product) return { title: "Produk tidak ditemukan — NuswaMart" };
  const desc = (product.description || `${product.name} dari ${product.store.name} di NuswaMart.`).slice(0, 160);
  return {
    title: `${product.name} — NuswaMart`,
    description: desc,
    openGraph: {
      title: product.name,
      description: desc,
      images: product.imageUrl ? [product.imageUrl] : [],
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; utm_source?: string }>;
}) {
  const { slug } = await params;
  const { ref, utm_source } = await searchParams;
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      store: true,
      category: true,
      images: { orderBy: { sort: "asc" } },
      variants: true,
      wholesaleTiers: { orderBy: { minQty: "asc" } },
      addonLinks: { include: { addonProduct: { select: { id: true, name: true, active: true, imageUrl: true } } } },
      reviews: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!product || !product.active || product.moderation !== "APPROVED" || product.store.status !== "ACTIVE") notFound();

  const hdrs = await headers();
  trackEvent({
    type: "VIEW",
    storeId: product.storeId,
    productId: product.id,
    source: detectSource(ref ?? utm_source, hdrs.get("referer")),
  });

  const user = await currentUser();
  const outOfStock =
    product.type === "PHYSICAL" &&
    (product.variants.length > 0
      ? product.variants.every((v) => v.stock !== null && v.stock <= 0)
      : product.stock !== null && product.stock <= 0);

  const appUrl = process.env.APP_URL || "";
  const shareText = encodeURIComponent(
    `${product.name} — ${formatRupiah(product.price)}\n${appUrl}/p/${product.slug}`
  );
  const gallery = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...product.images.map((i) => i.url),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: gallery[0] || undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "IDR",
      availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    ...(product.ratingCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratingAvg.toFixed(1), reviewCount: product.ratingCount },
    }),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {product.store.metaPixelId && (
        <MetaPixel pixelId={product.store.metaPixelId} event="ViewContent" value={product.price} />
      )}
      <div>
        <div className="aspect-square bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden">
          {gallery[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gallery[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">{product.type === "DIGITAL" ? "💾" : "📦"}</span>
          )}
        </div>
        {gallery.length > 1 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {gallery.slice(1).map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div>
        <span
          className={`inline-block text-xs font-bold uppercase px-2.5 py-1 rounded-full mb-3 ${
            product.type === "DIGITAL" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {product.type === "DIGITAL" ? "Produk Digital" : "Produk Fisik"}
        </span>
        <h1 className="text-2xl font-extrabold mb-2">{product.name}</h1>
        <p className="text-3xl font-extrabold text-teal-600 mb-4">
          {product.variants.length > 0
            ? `${formatRupiah(Math.min(...product.variants.map((v) => v.price)))}${product.variants.length > 1 ? " +" : ""}`
            : formatRupiah(product.price)}
        </p>

        {product.ratingCount > 0 && (
          <p className="flex items-center gap-2 mb-1">
            <Stars rating={product.ratingAvg} />
            <span className="text-sm text-slate-500">
              {product.ratingAvg.toFixed(1)} · {product.ratingCount} ulasan
            </span>
          </p>
        )}
        <p className="text-sm text-slate-500 mb-1">
          Dijual oleh{" "}
          <Link href={`/s/${product.store.slug}`} className="text-teal-600 font-semibold hover:underline">
            {product.store.name}
          </Link>
        </p>
        {product.type === "PHYSICAL" && product.variants.length === 0 && (
          <p className="text-sm text-slate-500 mb-2">
            Stok: {product.stock ?? "∞"}
            {product.weightGrams ? ` · Berat: ${product.weightGrams} gram` : ""}
          </p>
        )}

        <div className="flex gap-2 mb-4">
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100"
          >
            📤 Bagikan ke WhatsApp
          </a>
          {product.store.whatsapp && (
            <a
              href={`https://wa.me/${product.store.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Halo, saya tanya produk ${product.name}`)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold bg-white text-slate-600 border border-slate-300 px-3 py-1.5 rounded-full hover:border-emerald-400"
            >
              💬 Chat Penjual
            </a>
          )}
        </div>

        {product.description && (
          <div className="prose prose-sm text-slate-700 whitespace-pre-wrap mb-6">{product.description}</div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          {outOfStock ? (
            <p className="text-center text-red-600 font-semibold">Stok habis</p>
          ) : (
            <BuyForm
              productId={product.id}
              productType={product.type}
              price={product.price}
              maxQty={product.stock}
              variants={product.variants}
              tiers={product.wholesaleTiers.map((t) => ({ minQty: t.minQty, price: t.price }))}
              addons={product.addonLinks
                .filter((a) => a.addonProduct.active)
                .map((a) => ({ id: a.addonProductId, name: a.addonProduct.name, price: a.addonPrice }))}
              storeCanShip={Boolean(product.store.originAreaId)}
              storeCanInstant={Boolean(product.store.originLat && product.store.originLng)}
              defaultName={user?.name ?? undefined}
              defaultEmail={user?.email}
            />
          )}
          {!outOfStock && (
            <form action={addToCartAction} className="mt-3">
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="variantId" value={product.variants[0]?.id ?? ""} />
              <input type="hidden" name="qty" value={1} />
              <button className="w-full border border-teal-600 text-teal-700 font-bold py-2.5 rounded-xl hover:bg-teal-50">
                🛒 Masukkan Keranjang
              </button>
            </form>
          )}
        </div>
      </div>

      {product.reviews.length > 0 && (
        <div className="md:col-span-2">
          <h2 className="text-lg font-extrabold mb-3">Ulasan Pembeli ({product.ratingCount})</h2>
          <div className="space-y-3">
            {product.reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{r.buyerName}</span>
                  <Stars rating={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                {r.sellerReply && (
                  <div className="mt-2 ml-3 pl-3 border-l-2 border-teal-200 text-sm">
                    <span className="font-semibold text-teal-700">Balasan penjual:</span>{" "}
                    <span className="text-slate-600">{r.sellerReply}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
