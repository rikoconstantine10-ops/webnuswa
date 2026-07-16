import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { confirmReceivedAction } from "@/app/actions/checkout";
import { openDisputeAction, addDisputeMessageAction } from "@/app/actions/disputes";
import { DIGITAL_DISPUTE_WINDOW_HOURS } from "@/lib/orders";
import { AUTO_COMPLETE_DAYS } from "@/lib/shipping";
import { extractPaymentDisplay } from "@/lib/paymentDisplay";
import MetaPixel from "@/components/MetaPixel";
import ReviewForm from "@/components/ReviewForm";
import PaymentInstructions from "@/components/PaymentInstructions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Dibayar — Diproses Penjual", cls: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Diproses", cls: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "Dikirim", cls: "bg-indigo-100 text-indigo-700" },
  COMPLETED: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", cls: "bg-red-100 text-red-700" },
  EXPIRED: { label: "Kedaluwarsa", cls: "bg-slate-200 text-slate-600" },
  DISPUTED: { label: "Komplain", cls: "bg-orange-100 text-orange-700" },
  REFUNDED: { label: "Dana Dikembalikan", cls: "bg-slate-200 text-slate-600" },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const order = await db.order.findUnique({
    where: { code },
    include: {
      store: { select: { name: true, slug: true, metaPixelId: true } },
      items: {
        include: {
          product: { select: { type: true } },
          downloadTokens: true,
        },
      },
      reviews: { select: { productId: true } },
      dispute: { include: { messages: { orderBy: { createdAt: "asc" } } } },
    },
  });
  if (!order) notFound();

  const reviewedProductIds = new Set(order.reviews.map((r) => r.productId));
  // Produk 100% digital selesai instan (dana langsung cair) — beri jendela singkat
  // pasca-selesai untuk komplain bila filenya bermasalah, mirror lib/actions/disputes.ts.
  const isDigitalOnly = order.items.every((i) => i.product.type === "DIGITAL");
  const withinDigitalWindow =
    order.status === "COMPLETED" &&
    isDigitalOnly &&
    order.completedAt !== null &&
    Date.now() - order.completedAt.getTime() < DIGITAL_DISPUTE_WINDOW_HOURS * 3600 * 1000;
  const canDispute =
    (["PAID", "PROCESSING", "SHIPPED"].includes(order.status) || withinDigitalWindow) && !order.dispute;

  const status = STATUS_LABEL[order.status] ?? { label: order.status, cls: "bg-slate-200" };
  const pay = extractPaymentDisplay(order.paymentInfo);
  const isPendingPayment = order.status === "PENDING_PAYMENT";
  const isPaidOrDone = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {isPaidOrDone && order.store.metaPixelId && (
        <MetaPixel
          pixelId={order.store.metaPixelId}
          event="Purchase"
          value={order.total}
          eventId={`purchase_${order.id}`}
        />
      )}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500">Kode Pesanan</p>
            <h1 className="text-xl font-extrabold font-mono">{order.code}</h1>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${status.cls}`}>
            {status.label}
          </span>
        </div>

        <div className="text-sm space-y-1.5 border-t border-slate-100 pt-4">
          <p>
            Toko:{" "}
            <Link href={`/s/${order.store.slug}`} className="text-teal-600 font-semibold hover:underline">
              {order.store.name}
            </Link>
          </p>
          {order.items.map((item) => (
            <p key={item.id}>
              {item.isAddon && <span className="text-teal-600 text-xs font-bold">+ add-on </span>}
              {item.name} × {item.qty} — {formatRupiah(item.price * item.qty)}
            </p>
          ))}
          <p className="font-bold pt-2 text-base">Total: {formatRupiah(order.total)}</p>
        </div>
      </div>

      {isPendingPayment && (
        <div className="bg-white rounded-2xl border-2 border-teal-500 p-6">
          <h2 className="font-bold mb-3">Selesaikan Pembayaran</h2>
          <PaymentInstructions pay={pay} baseAmount={order.total} paymentType={order.paymentType} />
        </div>
      )}

      {isPaidOrDone &&
        order.items.some((i) => i.downloadTokens.length > 0) && (
          <div className="bg-white rounded-2xl border border-emerald-300 p-6">
            <h2 className="font-bold mb-3">📥 Download Produk Digital</h2>
            {order.items.flatMap((item) =>
              item.downloadTokens.map((t) => (
                <a
                  key={t.id}
                  href={`/api/download/${t.token}`}
                  className="block bg-emerald-600 text-white text-center font-bold py-3 rounded-xl hover:bg-emerald-700 mb-2"
                >
                  Download {item.name} ({t.maxDownloads - t.downloadsUsed}x tersisa)
                </a>
              ))
            )}
          </div>
        )}

      {order.status === "SHIPPED" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold mb-2">Info Pengiriman</h2>
          <p className="text-sm">
            {order.courier ? `${order.courier} — ` : ""}Resi:{" "}
            <span className="font-mono font-bold">{order.trackingNumber}</span>
          </p>
          <form action={confirmReceivedAction} className="mt-4">
            <input type="hidden" name="code" value={order.code} />
            <button className="bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700">
              ✓ Pesanan Sudah Diterima
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-3">
            Konfirmasi sekarang, atau dana otomatis diteruskan ke penjual dalam {AUTO_COMPLETE_DAYS} hari bila tidak ada respons.
          </p>
        </div>
      )}

      {order.dispute && (
        <div className="bg-white rounded-2xl border border-orange-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-orange-700">Komplain / Sengketa</h2>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
              {order.dispute.status === "OPEN"
                ? "Sedang ditinjau admin"
                : order.dispute.status === "RESOLVED_REFUND"
                  ? "Selesai — dana dikembalikan"
                  : "Selesai — diteruskan ke penjual"}
            </span>
          </div>
          <div className="space-y-2">
            {order.dispute.messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-semibold text-slate-600">
                  {m.author === "BUYER" ? "Kamu" : m.author === "SELLER" ? "Penjual" : "Admin"}:
                </span>{" "}
                <span className="text-slate-700">{m.body}</span>
              </div>
            ))}
          </div>
          {order.dispute.resolution && (
            <p className="text-sm bg-slate-50 rounded-lg px-3 py-2">
              <b>Keputusan admin:</b> {order.dispute.resolution}
            </p>
          )}
          {order.dispute.status === "OPEN" && (
            <form action={addDisputeMessageAction} className="flex gap-2">
              <input type="hidden" name="disputeId" value={order.dispute.id} />
              <input type="hidden" name="role" value="BUYER" />
              <input type="hidden" name="code" value={order.code} />
              <input
                type="text"
                name="body"
                required
                placeholder="Tambah pesan…"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
              <button className="bg-slate-700 text-white text-sm font-bold px-3 py-1.5 rounded-lg">Kirim</button>
            </form>
          )}
        </div>
      )}

      {canDispute && (
        <details className="bg-white rounded-2xl border border-slate-200 p-6">
          <summary className="font-bold cursor-pointer text-slate-700">Ada masalah dengan pesanan ini? Ajukan komplain</summary>
          {withinDigitalWindow && (
            <p className="text-xs text-slate-400 mt-2">
              Produk digital ini sudah selesai, tapi kamu masih bisa komplain dalam {DIGITAL_DISPUTE_WINDOW_HOURS} jam sejak pesanan selesai bila filenya bermasalah.
            </p>
          )}
          <form action={openDisputeAction} className="mt-3 space-y-2">
            <input type="hidden" name="code" value={order.code} />
            <textarea
              name="reason"
              required
              minLength={10}
              rows={3}
              placeholder="Jelaskan masalahnya (barang tidak sampai, rusak, tidak sesuai, dll). Min 10 karakter."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <button className="bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-orange-700">
              Ajukan Komplain
            </button>
          </form>
        </details>
      )}

      {order.status === "COMPLETED" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-bold">Beri Ulasan</h2>
          {order.items
            .filter((i) => !i.isAddon && !reviewedProductIds.has(i.productId))
            .map((i) => (
              <ReviewForm key={i.id} code={order.code} productId={i.productId} productName={i.name} />
            ))}
          {order.items.filter((i) => !i.isAddon && !reviewedProductIds.has(i.productId)).length === 0 && (
            <p className="text-sm text-slate-400">Terima kasih, semua produk sudah kamu ulas. 🙏</p>
          )}
        </div>
      )}
    </div>
  );
}
