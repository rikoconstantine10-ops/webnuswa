import Link from "next/link";
import { formatRupiah } from "@/lib/money";
import Stars from "@/components/Stars";

type Props = {
  product: {
    slug: string;
    name: string;
    price: number;
    type: string;
    imageUrl: string | null;
    ratingAvg?: number;
    ratingCount?: number;
    salePrice?: number | null;
    saleEndsAt?: Date | string | null;
    boostedUntil?: Date | string | null;
    store: { name: string; slug: string };
  };
};

function activeDate(d: Date | string | null | undefined): boolean {
  return d ? new Date(d).getTime() > Date.now() : false;
}

export default function ProductCard({ product }: Props) {
  const onSale = product.salePrice != null && product.salePrice > 0 && activeDate(product.saleEndsAt);
  const boosted = activeDate(product.boostedUntil);
  return (
    <Link
      href={`/p/${product.slug}`}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
    >
      <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
        {boosted && (
          <span className="absolute top-2 left-2 z-10 text-[9px] font-bold uppercase tracking-wide bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full shadow">
            ⭐ Promoted
          </span>
        )}
        {onSale && (
          <span className="absolute top-2 right-2 z-10 text-[9px] font-bold uppercase tracking-wide bg-rose-600 text-white px-2 py-0.5 rounded-full shadow">
            Flash Sale
          </span>
        )}
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{product.type === "DIGITAL" ? "💾" : "📦"}</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <span
          className={`self-start text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            product.type === "DIGITAL"
              ? "bg-purple-100 text-purple-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {product.type === "DIGITAL" ? "Digital" : "Fisik"}
        </span>
        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
        {onSale ? (
          <p className="flex items-baseline gap-1.5">
            <span className="text-rose-600 font-bold">{formatRupiah(product.salePrice as number)}</span>
            <span className="text-xs text-slate-400 line-through">{formatRupiah(product.price)}</span>
          </p>
        ) : (
          <p className="text-teal-600 font-bold">{formatRupiah(product.price)}</p>
        )}
        {product.ratingCount ? (
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Stars rating={product.ratingAvg ?? 0} size="text-xs" />
            <span>({product.ratingCount})</span>
          </p>
        ) : null}
        <p className="text-xs text-slate-500 mt-auto">{product.store.name}</p>
      </div>
    </Link>
  );
}
