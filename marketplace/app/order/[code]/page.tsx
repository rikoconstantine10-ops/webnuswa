import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { confirmReceivedAction } from "@/app/actions/checkout";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Dibayar — Diproses Penjual", cls: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Diproses", cls: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "Dikirim", cls: "bg-indigo-100 text-indigo-700" },
  COMPLETED: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", cls: "bg-red-100 text-red-700" },
  EXPIRED: { label: "Kedaluwarsa", cls: "bg-slate-200 text-slate-600" },
};

function extractPaymentDisplay(paymentInfo: string | null) {
  if (!paymentInfo) return null;
  try {
    const trx = JSON.parse(paymentInfo);
    const p = trx.payment ?? trx.data ?? trx;
    return {
      vaNumber: p.va_number ?? p.vaNumber ?? null,
      qris: p.qris_url ?? p.qris_image ?? p.qris_string ?? null,
      qrisIsImage: Boolean(p.qris_url ?? p.qris_image),
      simulated: Boolean(trx.simulated),
    };
  } catch {
    return null;
  }
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const order = await db.order.findUnique({
    where: { code },
    include: {
      store: { select: { name: true, slug: true } },
      items: {
        include: {
          product: { select: { type: true } },
          downloadTokens: true,
        },
      },
    },
  });
  if (!order) notFound();

  const status = STATUS_LABEL[order.status] ?? { label: order.status, cls: "bg-slate-200" };
  const pay = extractPaymentDisplay(order.paymentInfo);
  const isPendingPayment = order.status === "PENDING_PAYMENT";
  const isPaidOrDone = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
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
              {item.name} × {item.qty} — {formatRupiah(item.price * item.qty)}
            </p>
          ))}
          <p className="font-bold pt-2 text-base">Total: {formatRupiah(order.total)}</p>
        </div>
      </div>

      {isPendingPayment && (
        <div className="bg-white rounded-2xl border-2 border-teal-500 p-6">
          <h2 className="font-bold mb-3">Selesaikan Pembayaran</h2>
          {pay?.simulated && (
            <p className="text-xs bg-amber-50 text-amber-700 rounded-lg px-3 py-2 mb-3">
              Mode simulasi (LOUVIN_API_KEY belum diset) — pembayaran tidak nyata.
            </p>
          )}
          {pay?.vaNumber && (
            <div className="mb-3">
              <p className="text-sm text-slate-500 mb-1">Nomor Virtual Account ({order.paymentType?.replace("_va", "").toUpperCase()})</p>
              <p className="text-2xl font-mono font-extrabold tracking-wider bg-slate-100 rounded-lg px-4 py-3">
                {pay.vaNumber}
              </p>
            </div>
          )}
          {pay?.qris && (
            <div className="mb-3">
              <p className="text-sm text-slate-500 mb-2">Scan QRIS berikut:</p>
              {pay.qrisIsImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(pay.qris)} alt="QRIS" className="w-56 h-56 border rounded-xl" />
              ) : (
                <p className="text-xs font-mono break-all bg-slate-100 rounded-lg p-3">{String(pay.qris)}</p>
              )}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Halaman ini bisa di-refresh setelah membayar — status akan berubah otomatis begitu
            pembayaran terkonfirmasi.
          </p>
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
        </div>
      )}
    </div>
  );
}
