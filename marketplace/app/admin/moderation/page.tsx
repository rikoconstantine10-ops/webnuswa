import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { bulkModerateProductsAction } from "@/app/actions/admin";
import { Card, PageHeader, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  await requireAdmin();

  const products = await db.product.findMany({
    where: { moderation: "PENDING" },
    include: { store: { select: { name: true, id: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <form id="bulk-moderate-products" action={bulkModerateProductsAction} />

      <PageHeader
        title="🔍 Moderasi Produk"
        description="Produk yang otomatis ditandai untuk ditinjau (mengandung kata kunci terlarang) sebelum tampil di marketplace."
        action={
          products.length > 0 ? (
            <div className="flex gap-2">
              <button type="submit" form="bulk-moderate-products" name="decision" value="REJECT" className="bg-red-50 text-red-600 text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-100">
                ✕ Tolak Terpilih
              </button>
              <button type="submit" form="bulk-moderate-products" name="decision" value="APPROVE" className="bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-emerald-700">
                ✓ Setujui Terpilih
              </button>
            </div>
          ) : undefined
        }
      />

      {products.length === 0 ? (
        <EmptyState icon="✅" title="Tidak ada produk menunggu tinjauan" />
      ) : (
        <Card className="!p-0 divide-y divide-slate-50">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
              <input
                type="checkbox"
                name="productIds"
                value={p.id}
                form="bulk-moderate-products"
                className="w-4 h-4 accent-emerald-600 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <Link href={`/p/${p.slug}`} target="_blank" className="font-medium text-sm hover:text-teal-600">
                  {p.name}
                </Link>
                <p className="text-xs text-slate-400">
                  Toko: <Link href={`/admin/sellers/${p.store.id}`} className="hover:underline">{p.store.name}</Link>
                  {" · "}{formatRupiah(p.price)}
                  {" · "}{new Date(p.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
