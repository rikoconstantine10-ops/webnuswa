import { formatRupiah } from "@/lib/money";
import type { PaymentDisplay } from "@/lib/paymentDisplay";

export default function PaymentInstructions({
  pay,
  baseAmount,
  paymentType,
}: {
  pay: PaymentDisplay | null;
  baseAmount: number;
  paymentType?: string | null;
}) {
  if (!pay) return null;

  return (
    <>
      {pay.totalPayment != null && pay.totalPayment !== baseAmount && (
        <div className="text-sm bg-slate-50 rounded-lg px-4 py-3 mb-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Total</span>
            <span>{formatRupiah(baseAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Biaya admin pembayaran</span>
            <span>{formatRupiah(pay.totalPayment - baseAmount)}</span>
          </div>
          <div className="flex justify-between font-extrabold border-t border-slate-200 pt-1.5">
            <span>Total yang harus dibayar</span>
            <span className="text-teal-600">{formatRupiah(pay.totalPayment)}</span>
          </div>
        </div>
      )}
      {pay.simulated && (
        <p className="text-xs bg-amber-50 text-amber-700 rounded-lg px-3 py-2 mb-3">
          Mode simulasi (LOUVIN_API_KEY belum diset) — pembayaran tidak nyata.
        </p>
      )}
      {pay.vaNumber && (
        <div className="mb-3">
          <p className="text-sm text-slate-500 mb-1">
            Nomor Virtual Account
            {(pay.bank ?? paymentType?.replace("_va", "")) ? ` (${(pay.bank ?? paymentType?.replace("_va", ""))?.toUpperCase()})` : ""}
          </p>
          <p className="text-2xl font-mono font-extrabold tracking-wider bg-slate-100 rounded-lg px-4 py-3">
            {pay.vaNumber}
          </p>
        </div>
      )}
      {(pay.qrImageUrl || pay.qrString) && (
        <div className="mb-3">
          <p className="text-sm text-slate-500 mb-2">Scan QRIS berikut:</p>
          {pay.qrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pay.qrImageUrl} alt="QRIS" className="w-56 h-56 border rounded-xl bg-white" />
          ) : (
            <p className="text-xs font-mono break-all bg-slate-100 rounded-lg p-3">{pay.qrString}</p>
          )}
        </div>
      )}
      {pay.expiredAt && <p className="text-xs text-amber-600 mb-2">Bayar sebelum: {pay.expiredAt} WIB</p>}
      <p className="text-xs text-slate-500">
        Halaman ini bisa di-refresh setelah membayar — status akan berubah otomatis begitu pembayaran
        terkonfirmasi.
      </p>
    </>
  );
}
