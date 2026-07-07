import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getGuestId } from "@/lib/guestCart";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import CartCheckoutForm from "@/components/CartCheckoutForm";
import { isPaymentoConfigured } from "@/lib/paymento";

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

export default async function CartCheckoutPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const user = await currentUser();
  const guestId = user ? null : await getGuestId();
  if (!user && !guestId) redirect("/cart");

  const items = await db.cartItem.findMany({
    where: user ? { userId: user.id, product: { storeId } } : { guestId, product: { storeId } },
    include: { product: { include: { store: true, variants: true, wholesaleTiers: true } } },
  });
  if (items.length === 0) redirect("/cart");
  const store = items[0].product.store;
  if (store.status !== "ACTIVE") notFound();

  const subtotal = items.reduce((s, it) => s + unitPrice(it.product, it.variantId, it.qty) * it.qty, 0);
  const hasPhysical = items.some((it) => it.product.type === "PHYSICAL");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/cart" className="text-sm text-teal-600 hover:underline">← Kembali ke keranjang</Link>
      <h1 className="text-2xl font-extrabold mt-2 mb-1">Checkout — {store.name}</h1>
      <p className="text-sm text-slate-500 mb-5">{items.length} produk</p>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 space-y-2">
        {items.map((it) => {
          const price = unitPrice(it.product, it.variantId, it.qty);
          const variant = it.product.variants.find((v) => v.id === it.variantId);
          return (
            <div key={it.id} className="flex justify-between text-sm">
              <span>
                {it.product.name}
                {variant ? ` (${variant.name})` : ""} × {it.qty}
              </span>
              <span className="font-semibold">{formatRupiah(price * it.qty)}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <CartCheckoutForm
          storeId={storeId}
          itemsSubtotal={subtotal}
          hasPhysical={hasPhysical}
          storeCanShip={Boolean(store.originAreaId)}
          storeCanInstant={Boolean(store.originLat && store.originLng)}
          productIdForVoucher={items[0].productId}
          defaultName={user?.name ?? undefined}
          defaultEmail={user?.email}
          cryptoEnabled={isPaymentoConfigured()}
        />
      </div>
    </div>
  );
}
