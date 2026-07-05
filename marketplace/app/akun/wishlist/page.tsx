import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { removeWishlistAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";

export const metadata = { title: "Favorit — NuswaMart" };

export default async function WishlistPage() {
  const user = await requireUser();
  const items = await db.wishlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: { store: { select: { name: true, slug: true } } },
      },
    },
  });
  const visible = items.filter((w) => w.product.active);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Produk Favorit</h1>
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500 mb-4">Belum ada produk favorit. Tekan ❤️ di halaman produk untuk menyimpan.</p>
          <Link href="/market" className="inline-block bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700">
            Jelajahi Produk
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((w) => (
            <div key={w.id} className="relative">
              <ProductCard product={w.product} />
              <form action={removeWishlistAction} className="absolute top-2 right-2 z-10">
                <input type="hidden" name="productId" value={w.productId} />
                <button
                  title="Hapus dari favorit"
                  className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white cursor-pointer text-red-500"
                >
                  ✕
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
