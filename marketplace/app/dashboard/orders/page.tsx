import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { shipOrderAction } from "@/app/actions/seller";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Bayar",
  PAID: "Perlu Diproses",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Batal",
  EXPIRED: "Kedaluwarsa",
};

export default async function OrdersPage() {
  const { store } = await requireSeller();
  const orders = await db.order.findMany({
    where: { storeId: store.id, status: { not: "PENDING_PAYMENT" } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Pesanan</h1>
      {orders.length === 0 ? (
        <p className="text-slate-500 text-center py-16 bg-white rounded-2xl border border-slate-200">
          Belum ada pesanan masuk.
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
