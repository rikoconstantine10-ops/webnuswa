import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import AddonManager from "@/components/AddonManager";

export const dynamic = "force-dynamic";

export default async function AddonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { store } = await requireSeller();
  const { id } = await params;

  const product = await db.product.findFirst({
    where: { id, storeId: store.id },
    include: { addonLinks: true },
  });
  if (!product) notFound();

  // Kandidat add-on: produk aktif lain milik toko yang sama.
  const candidates = await db.product.findMany({
    where: { storeId: store.id, active: true, id: { not: id } },
    select: { id: true, name: true, price: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Link href="/dashboard/products" className="text-xs text-slate-400 hover:underline">
        ← Produk
      </Link>
      <h1 className="text-2xl font-extrabold mb-1">Order Bump / Add-on</h1>
      <p className="text-sm text-slate-500 mb-6">
        Produk utama: <b>{product.name}</b>
      </p>

      {candidates.length === 0 ? (
        <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-200 p-6">
          Belum ada produk lain yang bisa dijadikan add-on. Tambahkan produk aktif lain dulu.
        </p>
      ) : (
        <AddonManager
          productId={product.id}
          candidates={candidates}
          existing={product.addonLinks.map((a) => ({ addonProductId: a.addonProductId, addonPrice: a.addonPrice }))}
        />
      )}
    </div>
  );
}
