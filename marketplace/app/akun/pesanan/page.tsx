import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pesanan Saya — NuswaMart" };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Bayar", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Dibayar", cls: "bg-sky-100 text-sky-700" },
  PROCESSING: { label: "Diproses", cls: "bg-sky-100 text-sky-700" },
  SHIPPED: { label: "Dikirim", cls: "bg-indigo-100 text-indigo-700" },
  COMPLETED: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", cls: "bg-slate-200 text-slate-600" },
  EXPIRED: { label: "Kedaluwarsa", cls: "bg-slate-200 text-slate-600" },
  DISPUTED: { label: "Sengketa", cls: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Dikembalikan", cls: "bg-red-100 text-red-700" },
};

export default async function MyOrdersPage() {
  const user = await requireUser();
  const orders = await db.order.findMany({
    where: { OR: [{ buyerId: user.id }, { buyerEmail: user.email }] },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      store: { select: { name: true, slug: true } },
      items: { where: { isAddon: false }, select: { name: true, qty: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Pesanan Saya</h1>
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500 mb-4">Belum ada pesanan.</p>
          <Link href="/market" className="inline-block bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700">
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const st = STATUS_LABEL[o.status] ?? { label: o.status, cls: "bg-slate-200 text-slate-600" };
            return (
              <Link
                key={o.id}
                href={`/order/${o.code}`}
                className="block bg-white rounded-2xl border border-slate-200 p-4 hover:border-teal-300 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs text-slate-400">{o.code}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                </div>
                <p className="text-sm font-semibold line-clamp-1">
                  {o.items.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ")}
                </p>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                  <span>{o.store.name} · {o.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="font-bold text-slate-800">{formatRupiah(o.total)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
