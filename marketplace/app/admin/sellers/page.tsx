import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { setStoreStatusAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["PENDING", "ACTIVE", "SUSPENDED"];

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q, status } = await searchParams;

  const stores = await db.store.findMany({
    where: {
      ...(status && STATUS_OPTIONS.includes(status) ? { status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { owner: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      owner: { select: { email: true } },
      _count: { select: { products: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Seller / Toko</h1>

      <form method="get" className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-2 items-center mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari nama toko, slug, atau email pemilik..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <select name="status" defaultValue={status ?? ""} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700">
          Cari
        </button>
        {(q || status) && (
          <Link href="/admin/sellers" className="text-sm text-slate-500 hover:underline">Reset</Link>
        )}
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-4 py-3">Toko</th>
              <th className="px-4 py-3">Pemilik</th>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="border-b border-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/sellers/${s.id}`} className="hover:text-teal-600">
                    {s.name}
                  </Link>
                  <span className="block text-xs text-slate-400 font-mono">/s/{s.slug}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{s.owner.email}</td>
                <td className="px-4 py-3">{s._count.products}</td>
                <td className="px-4 py-3">{s._count.orders}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : s.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {s.status !== "ACTIVE" && (
                    <form action={setStoreStatusAction} className="inline">
                      <input type="hidden" name="storeId" value={s.id} />
                      <input type="hidden" name="status" value="ACTIVE" />
                      <button className="text-emerald-600 font-semibold hover:underline mr-3 cursor-pointer">
                        Aktifkan
                      </button>
                    </form>
                  )}
                  {s.status !== "SUSPENDED" && (
                    <form action={setStoreStatusAction} className="inline">
                      <input type="hidden" name="storeId" value={s.id} />
                      <input type="hidden" name="status" value="SUSPENDED" />
                      <button className="text-red-500 font-semibold hover:underline cursor-pointer">
                        Tangguhkan
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
