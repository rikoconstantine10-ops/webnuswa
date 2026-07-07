import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { markProcessingAction, shipOrderAction } from "@/app/actions/seller";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Bayar",
  PAID: "Perlu Diproses",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Batal",
  EXPIRED: "Kedaluwarsa",
  DISPUTED: "Sengketa",
  REFUNDED: "Refund",
};

const STATUS_OPTIONS = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "EXPIRED", "DISPUTED", "REFUNDED"];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { store } = await requireSeller();
  const { q, status } = await searchParams;

  const orders = await db.order.findMany({
    where: {
      storeId: store.id,
      status: status && STATUS_OPTIONS.includes(status) ? status : { not: "PENDING_PAYMENT" },
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { buyerName: { contains: q, mode: "insensitive" } },
              { buyerEmail: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-extrabold">Pesanan</h1>
        <a
          href="/api/dashboard/orders/export"
          className="border border-slate-300 text-slate-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-slate-50"
        >
          ⬇ Export CSV
        </a>
      </div>

      <form method="get" className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-2 items-center mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari kode, nama, atau email pembeli..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <select name="status" defaultValue={status ?? ""} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
          ))}
        </select>
        <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700">
          Cari
        </button>
        {(q || status) && (
          <Link href="/dashboard/orders" className="text-sm text-slate-500 hover:underline">Reset</Link>
        )}
      </form>

      {orders.length === 0 ? (
        <p className="text-slate-500 text-center py-16 bg-white rounded-2xl border border-slate-200">
          {q || status ? "Tidak ada pesanan yang cocok." : "Belum ada pesanan masuk."}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-mono font-bold">{order.code}</p>
                  <p className="text-xs text-slate-500">
                    {order.buyerName} · {order.buyerEmail} ·{" "}
                    {new Date(order.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    order.status === "PAID"
                      ? "bg-amber-100 text-amber-700"
                      : order.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              <div className="text-sm text-slate-700 mb-2">
                {order.items.map((i) => (
                  <p key={i.id}>
                    {i.name} × {i.qty} — {formatRupiah(i.price * i.qty)}
                  </p>
                ))}
                <p className="font-bold mt-1">Total: {formatRupiah(order.total)}</p>
              </div>

              {order.shippingAddress && (
                <p className="text-xs bg-slate-50 rounded-lg px-3 py-2 mb-3">
                  📍 {order.shippingAddress}
                </p>
              )}

              {order.status === "PAID" && order.shippingAddress && (
                <form action={markProcessingAction} className="mb-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <button className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700">
                    Tandai Diproses
                  </button>
                </form>
              )}
              {["PAID", "PROCESSING"].includes(order.status) && order.shippingAddress && (
                <form action={shipOrderAction} className="flex flex-wrap gap-2 items-center">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input
                    type="text"
                    name="courier"
                    placeholder="Kurir (JNE/J&T/...)"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-36"
                  />
                  <input
                    type="text"
                    name="trackingNumber"
                    required
                    placeholder="Nomor resi"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-40"
                  />
                  <button className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700">
                    Tandai Dikirim
                  </button>
                </form>
              )}

              {order.trackingNumber && (
                <p className="text-xs text-slate-500">
                  Resi: {order.courier ? `${order.courier} — ` : ""}
                  <span className="font-mono font-bold">{order.trackingNumber}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
