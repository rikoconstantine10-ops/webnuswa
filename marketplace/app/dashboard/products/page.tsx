import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { deleteProductAction, duplicateProductAction } from "@/app/actions/products";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { store } = await requireSeller();
  const products = await db.product.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Produk</h1>
        <Link
          href="/dashboard/products/new"
          className="bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700"
        >
          + Tambah Produk
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-slate-500 text-center py-16 bg-white rounded-2xl border border-slate-200">
          Belum ada produk. Tambahkan produk pertamamu!
        </p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
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
      )}
    </div>
  );
}
