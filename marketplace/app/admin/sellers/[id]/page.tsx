import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeBalance } from "@/lib/ledger";
import { formatRupiah } from "@/lib/money";
import { setStoreStatusAction, takedownProductAction, setStoreVerifiedAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const store = await db.store.findUnique({
    where: { id },
    include: {
      owner: { select: { email: true, createdAt: true } },
      products: { orderBy: { createdAt: "desc" } },
      orders: {
        where: { status: { notIn: ["PENDING_PAYMENT", "EXPIRED", "CANCELLED"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!store) notFound();

  const balance = await storeBalance(store.id);
  const totalRevenue = store.orders.reduce((s, o) => s + o.subtotal, 0);

  // Kecepatan kirim rata-rata: PAID → SHIPPED (order fisik yang sudah dikirim)
  const shipped = store.orders.filter((o) => o.paidAt && o.trackingNumber);
  const avgShipHours =
    shipped.length > 0
      ? shipped.reduce((s, o) => s + (o.completedAt ?? new Date()).getTime() - o.paidAt!.getTime(), 0) /
        shipped.length /
        3600000
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/sellers" className="text-xs text-slate-400 hover:underline">
            ← Semua seller
          </Link>
          <h1 className="text-2xl font-extrabold">{store.name}</h1>
          <p className="text-sm text-slate-500">
            {store.owner.email} · bergabung {new Date(store.createdAt).toLocaleDateString("id-ID")} ·{" "}
            <Link href={`/s/${store.slug}`} className="text-teal-600 hover:underline">/s/{store.slug}</Link>
          </p>
        </div>
        <div className="flex gap-2">
          {store.status !== "ACTIVE" && (
            <form action={setStoreStatusAction}>
              <input type="hidden" name="storeId" value={store.id} />
              <input type="hidden" name="status" value="ACTIVE" />
              <button className="bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-lg">Aktifkan</button>
            </form>
          )}
          {store.status !== "SUSPENDED" && (
            <form action={setStoreStatusAction}>
              <input type="hidden" name="storeId" value={store.id} />
              <input type="hidden" name="status" value="SUSPENDED" />
              <button className="bg-red-100 text-red-600 text-sm font-bold px-4 py-2 rounded-lg">Tangguhkan</button>
            </form>
          )}
          <form action={setStoreVerifiedAction}>
            <input type="hidden" name="storeId" value={store.id} />
            <input type="hidden" name="verified" value={store.verified ? "false" : "true"} />
            <button className={`text-sm font-bold px-4 py-2 rounded-lg ${store.verified ? "bg-slate-100 text-slate-600" : "bg-sky-600 text-white"}`}>
              {store.verified ? "Cabut Verifikasi" : "✓ Verifikasi Toko"}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Saldo", value: formatRupiah(balance) },
          { label: "Omzet (order dibayar)", value: formatRupiah(totalRevenue) },
          { label: "Order Dibayar", value: String(store.orders.length) },
          {
            label: "Rata-rata Kirim",
            value: avgShipHours !== null ? `${avgShipHours.toFixed(0)} jam` : "—",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-lg font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <h2 className="font-bold text-sm px-5 pt-4 pb-2">Produk ({store.products.length})</h2>
        <table className="w-full text-sm">
          <tbody>
            {store.products.map((p) => (
              <tr key={p.id} className="border-t border-slate-50">
                <td className="px-5 py-2.5 font-medium">
                  <Link href={`/p/${p.slug}`} className="hover:text-teal-600">{p.name}</Link>
                </td>
                <td className="px-3 py-2.5">{p.type === "DIGITAL" ? "💾" : "📦"}</td>
                <td className="px-3 py-2.5">{formatRupiah(p.price)}</td>
                <td className="px-3 py-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {p.active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-right">
                  {p.active && (
                    <form action={takedownProductAction} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-red-500 text-xs font-bold hover:underline cursor-pointer">
                        Takedown
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {store.products.length === 0 && (
              <tr><td className="px-5 py-6 text-slate-400 text-center">Belum ada produk.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <h2 className="font-bold text-sm px-5 pt-4 pb-2">Order Terakhir</h2>
        <table className="w-full text-sm">
          <tbody>
            {store.orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-50">
                <td className="px-5 py-2.5 font-mono text-xs">{o.code}</td>
                <td className="px-3 py-2.5">{o.buyerName}</td>
                <td className="px-3 py-2.5 font-bold">{formatRupiah(o.total)}</td>
                <td className="px-3 py-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100">{o.status}</span>
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-400">
                  {new Date(o.createdAt).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
            {store.orders.length === 0 && (
              <tr><td className="px-5 py-6 text-slate-400 text-center">Belum ada order.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
