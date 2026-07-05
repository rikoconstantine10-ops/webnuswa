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
    store: { name: string; slug: string };
  };
};

export default function ProductCard({ product }: Props) {
  return (
    <Link
      href={`/p/${product.slug}`}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
    >
      <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
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
        <p className="text-teal-600 font-bold">{formatRupiah(product.price)}</p>
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
