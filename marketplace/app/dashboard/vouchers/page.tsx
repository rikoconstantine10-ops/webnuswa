import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import VoucherManager from "@/components/VoucherManager";
import { toggleVoucherAction, deleteVoucherAction } from "@/app/actions/vouchers";

export const dynamic = "force-dynamic";

export default async function SellerVouchersPage() {
  const { store } = await requireSeller();
  const vouchers = await db.voucher.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Voucher & Diskon</h1>
      <VoucherManager />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2">Kode</th>
              <th className="text-left px-4 py-2">Diskon</th>
              <th className="text-left px-4 py-2">Min. Belanja</th>
              <th className="text-left px-4 py-2">Pakai</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-8">Belum ada voucher.</td>
              </tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono font-bold">{v.code}</td>
                  <td className="px-4 py-2">{v.type === "PERCENT" ? `${v.value}%${v.maxDiscount ? ` (maks ${formatRupiah(v.maxDiscount)})` : ""}` : formatRupiah(v.value)}</td>
                  <td className="px-4 py-2">{v.minSpend ? formatRupiah(v.minSpend) : "-"}</td>
                  <td className="px-4 py-2">{v.used}{v.quota ? ` / ${v.quota}` : ""}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                      {v.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <form action={toggleVoucherAction} className="inline">
                      <input type="hidden" name="id" value={v.id} />
                      <button className="text-xs text-slate-600 hover:underline mr-3">{v.active ? "Nonaktifkan" : "Aktifkan"}</button>
                    </form>
                    <form action={deleteVoucherAction} className="inline">
                      <input type="hidden" name="id" value={v.id} />
                      <button className="text-xs text-red-600 hover:underline">Hapus</button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
