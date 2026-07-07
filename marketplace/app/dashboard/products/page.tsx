import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import {
  deleteProductAction,
  duplicateProductAction,
  bulkActivateAction,
  bulkDeactivateAction,
  bulkUpdatePriceAction,
} from "@/app/actions/products";
import BoostButton from "@/components/BoostButton";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { store } = await requireSeller();
  const { q, status } = await searchParams;

  const products = await db.product.findMany({
    where: {
      storeId: store.id,
      ...(status === "active" ? { active: true } : status === "inactive" ? { active: false } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Produk</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/products/import"
            className="border border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50"
          >
            ⬆ Impor CSV
          </Link>
          <Link
            href="/dashboard/products/new"
            className="bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700"
          >
            + Tambah Produk
          </Link>
        </div>
      </div>

      <form method="get" className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-2 items-center mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari nama produk..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <select name="status" defaultValue={status ?? ""} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700">
          Cari
        </button>
        {(q || status) && (
          <a href="/dashboard/products" className="text-sm text-slate-500 hover:underline">Reset</a>
        )}
      </form>

      {products.length === 0 ? (
        <p className="text-slate-500 text-center py-16 bg-white rounded-2xl border border-slate-200">
          {q || status ? "Tidak ada produk yang cocok." : "Belum ada produk. Tambahkan produk pertamamu!"}
        </p>
      ) : (
        <div className="space-y-3">
          <form id="bulk-products" />
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xs text-slate-500 mr-1">Aksi massal (centang produk lalu pilih):</span>
            <button form="bulk-products" formAction={bulkActivateAction} className="border border-emerald-300 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-50">
              Aktifkan
            </button>
            <button form="bulk-products" formAction={bulkDeactivateAction} className="border border-slate-300 text-slate-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50">
              Nonaktifkan
            </button>
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <select name="mode" form="bulk-products" defaultValue="percent" className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm">
              <option value="percent">Ubah harga %</option>
              <option value="fixed">Ubah harga (+/− Rp)</option>
              <option value="set">Set harga jadi</option>
            </select>
            <input
              type="number"
              name="value"
              form="bulk-products"
              placeholder="Nilai"
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm w-28"
            />
            <button form="bulk-products" formAction={bulkUpdatePriceAction} className="bg-teal-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-teal-700">
              Terapkan Harga
            </button>
            <span className="text-xs text-slate-400 w-full">Harga dasar saja — tidak mengubah harga varian/grosir.</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" name="ids" value={p.id} form="bulk-products" />
                  </td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.type === "DIGITAL" ? "💾 Digital" : "📦 Fisik"}</td>
                  <td className="px-4 py-3">{formatRupiah(p.price)}</td>
                  <td className="px-4 py-3">{p.type === "DIGITAL" ? "∞" : (p.stock ?? 0)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                    >
                      {p.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/dashboard/products/${p.id}/edit`}
                      className="text-teal-600 font-semibold hover:underline mr-3"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/dashboard/products/${p.id}/addons`}
                      className="text-teal-600 font-semibold hover:underline mr-3"
                    >
                      🎁 Add-on
                    </Link>
                    <span className="mr-3 inline-block">
                      <BoostButton productId={p.id} boostedUntil={p.boostedUntil} />
                    </span>
                    <form action={duplicateProductAction} className="inline mr-3">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-slate-500 font-semibold hover:underline cursor-pointer">
                        Duplikat
                      </button>
                    </form>
                    <form action={deleteProductAction} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-red-500 font-semibold hover:underline cursor-pointer">
                        Hapus
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
