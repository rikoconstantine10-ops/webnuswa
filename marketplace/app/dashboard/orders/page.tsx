import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { markProcessingAction, shipOrderAction, bulkMarkProcessingAction } from "@/app/actions/seller";
import { addDisputeMessageAction } from "@/app/actions/disputes";
import { Card, PageHeader, Badge, EmptyState } from "@/components/dashboard/ui";

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
  RETURN_TO_SENDER: "Gagal Kirim — Kembali",
};

const STATUS_TONE: Record<string, "amber" | "emerald" | "slate" | "red" | "blue" | "sky" | "orange"> = {
  PAID: "amber",
  PROCESSING: "blue",
  SHIPPED: "sky",
  COMPLETED: "emerald",
  CANCELLED: "red",
  EXPIRED: "slate",
  DISPUTED: "red",
  REFUNDED: "slate",
  RETURN_TO_SENDER: "orange",
};

const STATUS_OPTIONS = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "EXPIRED", "DISPUTED", "REFUNDED", "RETURN_TO_SENDER"];

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
    include: {
      items: true,
      dispute: { include: { messages: { orderBy: { createdAt: "asc" } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const bulkEligibleCount = orders.filter((o) => o.status === "PAID" && o.shippingAddress).length;

  return (
    <div>
      <form id="bulk-processing" action={bulkMarkProcessingAction} />
      <PageHeader
        title="Pesanan"
        action={
          <div className="flex gap-2">
            {bulkEligibleCount > 0 && (
              <button
                type="submit"
                form="bulk-processing"
                className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-700"
              >
                📦 Tandai Terpilih Diproses
              </button>
            )}
            <a
              href="/api/dashboard/orders/export"
              className="border border-slate-300 bg-white text-slate-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-slate-50"
            >
              ⬇ Export CSV
            </a>
          </div>
        }
      />

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap gap-2 items-center">
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
      </Card>

      {orders.length === 0 ? (
        <EmptyState icon="🧾" title={q || status ? "Tidak ada pesanan yang cocok" : "Belum ada pesanan masuk"} />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2">
                  {order.status === "PAID" && order.shippingAddress && (
                    <input
                      type="checkbox"
                      name="orderIds"
                      value={order.id}
                      form="bulk-processing"
                      className="w-4 h-4 mt-1 accent-blue-600 shrink-0"
                    />
                  )}
                  <div>
                    <p className="font-mono font-bold">{order.code}</p>
                    <p className="text-xs text-slate-500">
                      {order.buyerName} · {order.buyerEmail} ·{" "}
                      {new Date(order.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[order.status] ?? "slate"}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </Badge>
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

              {order.dispute && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-red-700 mb-2">
                    ⚠ Sengketa — {order.dispute.status === "OPEN" ? "menunggu keputusan admin" : "sudah diselesaikan"}
                  </p>
                  <div className="space-y-1.5 bg-slate-50 rounded-lg p-3 max-h-52 overflow-auto mb-2">
                    {order.dispute.messages.map((m) => (
                      <p key={m.id} className="text-sm">
                        <span className="font-semibold">
                          {m.author === "BUYER" ? "Pembeli" : m.author === "SELLER" ? "Kamu" : "Admin"}:
                        </span>{" "}
                        {m.body}
                      </p>
                    ))}
                  </div>
                  {order.dispute.resolution && (
                    <p className="text-xs text-slate-500 mb-2">
                      Keputusan admin: <span className="font-medium">{order.dispute.resolution}</span>
                    </p>
                  )}
                  {order.dispute.status === "OPEN" && (
                    <form action={addDisputeMessageAction} className="flex gap-2">
                      <input type="hidden" name="disputeId" value={order.dispute.id} />
                      <input type="hidden" name="role" value="SELLER" />
                      <input
                        type="text"
                        name="body"
                        required
                        placeholder="Balas / jelaskan sisi kamu ke pembeli & admin…"
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      <button className="bg-slate-700 text-white text-sm font-bold px-3 py-1.5 rounded-lg">
                        Kirim
                      </button>
                    </form>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
