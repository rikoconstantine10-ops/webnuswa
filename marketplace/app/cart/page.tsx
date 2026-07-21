import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getGuestId } from "@/lib/guestCart";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { updateCartQtyAction, removeCartItemAction } from "@/app/actions/cart";

export const dynamic = "force-dynamic";

function unitPrice(
  p: { price: number; variants: { id: string; price: number }[]; wholesaleTiers: { minQty: number; price: number }[] },
  variantId: string | null,
  qty: number
): number {
  if (p.variants.length > 0) return p.variants.find((v) => v.id === variantId)?.price ?? p.price;
  const tier = [...p.wholesaleTiers].sort((a, b) => b.minQty - a.minQty).find((t) => qty >= t.minQty);
  return tier ? tier.price : p.price;
}

export default async function CartPage() {
  const user = await currentUser();
  const guestId = user ? null : await getGuestId();

  const items = user
    ? await db.cartItem.findMany({
        where: { userId: user.id },
        include: { product: { include: { store: true, variants: true, wholesaleTiers: true } } },
        orderBy: { createdAt: "desc" },
      })
    : guestId
    ? await db.cartItem.findMany({
        where: { guestId },
        include: { product: { include: { store: true, variants: true, wholesaleTiers: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Kelompokkan per toko.
  const groups = new Map<string, { storeName: string; storeId: string; items: typeof items }>();
  for (const it of items) {
    const g = groups.get(it.product.storeId) ?? { storeName: it.product.store.name, storeId: it.product.storeId, items: [] };
    g.items.push(it);
    groups.set(it.product.storeId, g);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6">Keranjang</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">Keranjangmu masih kosong.</p>
          <Link href="/market" className="text-teal-600 font-bold hover:underline">Mulai belanja →</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.values()].map((g) => {
            const subtotal = g.items.reduce((s, it) => s + unitPrice(it.product, it.variantId, it.qty) * it.qty, 0);
            return (
              <div key={g.storeId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 font-bold text-sm">🏪 {g.storeName}</div>
                <div className="divide-y divide-slate-50">
                  {g.items.map((it) => {
                    const price = unitPrice(it.product, it.variantId, it.qty);
                    const variant = it.product.variants.find((v) => v.id === it.variantId);
                    return (
                      <div key={it.id} className="flex items-center gap-3 p-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                          {it.product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.product.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{it.product.type === "DIGITAL" ? "💾" : "📦"}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{it.product.name}</p>
                          {variant && <p className="text-xs text-slate-500">{variant.name}</p>}
                          <p className="text-sm text-teal-600 font-bold">{formatRupiah(price)}</p>
                        </div>
                        <form action={updateCartQtyAction} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={it.id} />
                          <input
                            type="number"
                            name="qty"
                            defaultValue={it.qty}
                            min={1}
                            className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-sm"
                          />
                          <button className="text-xs text-slate-500 hover:underline">Ubah</button>
                        </form>
                        <form action={removeCartItemAction}>
                          <input type="hidden" name="id" value={it.id} />
                          <button className="text-red-500 text-lg px-1" title="Hapus">×</button>
                        </form>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm">
                    Subtotal: <span className="font-extrabold">{formatRupiah(subtotal)}</span>
                  </span>
                  <Link
                    href={`/cart/checkout/${g.storeId}`}
                    className="bg-teal-600 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-teal-700"
                  >
                    Checkout toko ini
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
