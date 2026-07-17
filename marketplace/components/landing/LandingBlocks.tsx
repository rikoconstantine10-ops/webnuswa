import type { LandingBlock } from "@/lib/landingBlocks";
import { formatRupiah } from "@/lib/money";
import { isSaleActive, effectivePrice } from "@/lib/pricing";
import Stars from "@/components/Stars";
import LandingOrderForm from "./LandingOrderForm";
import CountdownTimer from "./CountdownTimer";

type ProductCtx = {
  id: string;
  name: string;
  type: string;
  price: number;
  salePrice: number | null;
  saleEndsAt: Date | null;
  stock: number | null;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  variants: { id: string; name: string; price: number; stock: number | null }[];
  wholesaleTiers: { minQty: number; price: number }[];
  addonLinks: { addonProductId: string; addonPrice: number; addonProduct: { name: string; active: boolean } }[];
};

type StoreCtx = {
  name: string;
  whatsapp: string | null;
  originAreaId: string | null;
  originLat: number | null;
  originLng: number | null;
  enabledPaymentTypes: string[];
};

export type LandingCtx = {
  product: ProductCtx;
  store: StoreCtx;
  landingPageId: string;
  refSource?: string;
  cryptoEnabled: boolean;
  defaultName?: string;
  defaultEmail?: string;
  userPoints?: number;
};

function youtubeEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function LandingBlockRenderer({ block, ctx }: { block: LandingBlock; ctx: LandingCtx }) {
  const { product, store } = ctx;

  switch (block.type) {
    case "hero":
      return (
        <div className="text-center space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {block.imageUrl && <img src={block.imageUrl} alt="" className="w-full rounded-2xl object-cover max-h-96" />}
          <h1 className="text-2xl font-extrabold">{block.heading}</h1>
          {block.subheading && <p className="text-slate-600">{block.subheading}</p>}
          <a href="#order-form" className="inline-block bg-teal-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-700">
            {block.ctaLabel || "Lihat Penawaran"}
          </a>
        </div>
      );

    case "product_info": {
      const saleActive = isSaleActive(product);
      const price = effectivePrice(product);
      return (
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-extrabold">{product.name}</h2>
          {saleActive ? (
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-2xl font-extrabold text-rose-600">{formatRupiah(price)}</span>
              <span className="text-slate-400 line-through">{formatRupiah(product.price)}</span>
            </p>
          ) : (
            <p className="text-2xl font-extrabold text-teal-600">{formatRupiah(price)}</p>
          )}
          {product.ratingCount > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-slate-500">
              <Stars rating={product.ratingAvg} /> {product.ratingAvg.toFixed(1)} · {product.ratingCount} ulasan · {product.soldCount} terjual
            </p>
          )}
        </div>
      );
    }

    case "media_text":
      return (
        <div className={`flex flex-col ${block.imagePosition === "right" ? "sm:flex-row-reverse" : "sm:flex-row"} gap-4 items-center`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.imageUrl} alt="" className="w-full sm:w-1/2 rounded-xl object-cover" />
          <div className="sm:w-1/2">
            {block.heading && <h3 className="font-extrabold text-lg mb-1.5">{block.heading}</h3>}
            <p className="text-slate-600 whitespace-pre-wrap">{block.body}</p>
          </div>
        </div>
      );

    case "benefits":
      return (
        <div>
          <h3 className="font-extrabold text-lg text-center mb-3">{block.heading}</h3>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {block.items.map((it, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white rounded-xl border border-slate-200 px-3 py-2.5">
                <span className="text-xl shrink-0">{it.icon}</span>
                <span className="text-sm font-medium">{it.text}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "steps":
      return (
        <div>
          <h3 className="font-extrabold text-lg text-center mb-3">{block.heading}</h3>
          <div className="space-y-2.5">
            {block.items.map((it, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="font-semibold text-sm">{it.title}</p>
                  {it.desc && <p className="text-xs text-slate-500">{it.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "trust_badges":
      return (
        <div className="flex flex-wrap justify-center gap-2">
          {block.items.map((label, i) => (
            <span key={i} className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full">
              🛡 {label}
            </span>
          ))}
        </div>
      );

    case "countdown":
      return (
        <div className="text-center space-y-2">
          {block.heading && <p className="font-bold text-slate-700">{block.heading}</p>}
          <CountdownTimer endAt={block.endAt} expiredText={block.expiredText} />
        </div>
      );

    case "divider":
      return <hr className="border-slate-200" />;

    case "text":
      return (
        <div>
          {block.heading && <h3 className="font-extrabold text-lg mb-1.5">{block.heading}</h3>}
          <p className="text-slate-600 whitespace-pre-wrap">{block.body}</p>
        </div>
      );

    case "faq":
      return (
        <div>
          <h3 className="font-extrabold text-lg text-center mb-3">{block.heading}</h3>
          <div className="space-y-2">
            {block.items.map((it, i) => (
              <details key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <summary className="font-semibold text-sm cursor-pointer">{it.question}</summary>
                <p className="text-sm text-slate-600 mt-2">{it.answer}</p>
              </details>
            ))}
          </div>
        </div>
      );

    case "testimonials":
      return (
        <div>
          <h3 className="font-extrabold text-lg text-center mb-3">{block.heading}</h3>
          <div className="space-y-2.5">
            {block.items.map((it, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{it.name}</span>
                  {it.rating && <Stars rating={it.rating} />}
                </div>
                <p className="text-sm text-slate-600">&ldquo;{it.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "gallery":
      return (
        <div>
          {block.heading && <h3 className="font-extrabold text-lg text-center mb-3">{block.heading}</h3>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {block.images.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-xl" />
            ))}
          </div>
        </div>
      );

    case "video": {
      const yt = youtubeEmbedUrl(block.videoUrl);
      return (
        <div>
          {block.heading && <h3 className="font-extrabold text-lg text-center mb-3">{block.heading}</h3>}
          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            {yt ? (
              <iframe src={yt} className="w-full h-full" allowFullScreen />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={block.videoUrl} controls className="w-full h-full" />
            )}
          </div>
        </div>
      );
    }

    case "whatsapp_cta": {
      if (!store.whatsapp) return null;
      const text = encodeURIComponent(block.messageTemplate || `Halo, saya tertarik dengan produk ${product.name}`);
      return (
        <div className="text-center space-y-2">
          {block.heading && <p className="font-bold text-slate-700">{block.heading}</p>}
          <a
            href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}?text=${text}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700"
          >
            💬 {block.buttonLabel}
          </a>
        </div>
      );
    }

    case "social_links":
      return (
        <div className="flex justify-center gap-3">
          {block.items.map((it, i) => (
            <a key={i} href={it.url} target="_blank" rel="noreferrer" className="text-sm font-bold bg-white border border-slate-300 px-4 py-2 rounded-full hover:border-teal-400 capitalize">
              {it.platform}
            </a>
          ))}
        </div>
      );

    case "pricing_plans":
      if (product.wholesaleTiers.length === 0) return null;
      return (
        <div>
          {block.heading && <h3 className="font-extrabold text-lg text-center mb-3">{block.heading}</h3>}
          <div className="grid sm:grid-cols-3 gap-2.5">
            {[...product.wholesaleTiers].sort((a, b) => a.minQty - b.minQty).map((t, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 px-3 py-3 text-center">
                <p className="text-xs text-slate-500">Beli ≥ {t.minQty}</p>
                <p className="font-extrabold text-teal-600">{formatRupiah(t.price)}/pcs</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "order_form": {
      const addons = product.addonLinks
        .filter((a) => a.addonProduct.active && block.addonIds.includes(a.addonProductId))
        .map((a) => ({ id: a.addonProductId, name: a.addonProduct.name, price: a.addonPrice }));
      return (
        <div id="order-form" className="bg-white rounded-2xl border border-slate-200 p-5">
          {block.heading && <h3 className="font-extrabold text-lg text-center mb-4">{block.heading}</h3>}
          <LandingOrderForm
            landingPageId={ctx.landingPageId}
            productId={product.id}
            productType={product.type}
            price={effectivePrice(product)}
            maxQty={product.stock}
            variants={product.variants}
            tiers={product.wholesaleTiers}
            addons={addons}
            storeCanShip={Boolean(store.originAreaId)}
            storeCanInstant={Boolean(store.originLat && store.originLng)}
            defaultName={ctx.defaultName}
            defaultEmail={ctx.defaultEmail}
            userPoints={ctx.userPoints}
            cryptoEnabled={ctx.cryptoEnabled}
            enabledPaymentTypes={store.enabledPaymentTypes}
            refSource={ctx.refSource}
          />
        </div>
      );
    }
  }
}
