import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCategoryAction, deleteCategoryAction } from "@/app/actions/admin";
import { Card, PageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Kategori" />

      <form action={createCategoryAction} className="flex gap-2 mb-6">
        <input
          type="text"
          name="name"
          required
          placeholder="Nama kategori baru"
          className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm"
        />
        <button className="bg-teal-600 text-white text-sm font-bold px-5 rounded-lg hover:bg-teal-700">
          + Tambah
        </button>
      </form>

      <Card className="!p-0">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
            <div>
              <p className="font-medium text-sm">{c.name}</p>
              <p className="text-xs text-slate-400 font-mono">
                /{c.slug} · {c._count.products} produk
              </p>
            </div>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={c.id} />
              <button className="text-red-500 text-sm font-semibold hover:underline cursor-pointer">
                Hapus
              </button>
            </form>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">Belum ada kategori.</p>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-3">
        Menghapus kategori tidak menghapus produknya — produk hanya menjadi &quot;tanpa kategori&quot;.
      </p>
    </div>
  );
}
