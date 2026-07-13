import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import PlatformVoucherManager from "@/components/PlatformVoucherManager";
import { toggleAdminVoucherAction, deleteAdminVoucherAction } from "@/app/actions/admin";
import { Card, PageHeader, Badge } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminVouchersPage() {
  await requireAdmin();
  const vouchers = await db.voucher.findMany({ where: { storeId: null }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-5">
      <PageHeader title="Voucher Platform" />
      <PlatformVoucherManager />

      <Card className="!p-0 overflow-hidden">
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
              <tr><td colSpan={6} className="text-center text-slate-400 py-8">Belum ada voucher platform.</td></tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono font-bold">{v.code}</td>
                  <td className="px-4 py-2">{v.type === "PERCENT" ? `${v.value}%${v.maxDiscount ? ` (maks ${formatRupiah(v.maxDiscount)})` : ""}` : formatRupiah(v.value)}</td>
                  <td className="px-4 py-2">{v.minSpend ? formatRupiah(v.minSpend) : "-"}</td>
                  <td className="px-4 py-2">{v.used}{v.quota ? ` / ${v.quota}` : ""}</td>
                  <td className="px-4 py-2">
                    <Badge tone={v.active ? "emerald" : "slate"}>{v.active ? "Aktif" : "Nonaktif"}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <form action={toggleAdminVoucherAction} className="inline">
                      <input type="hidden" name="id" value={v.id} />
                      <button className="text-xs text-slate-600 hover:underline mr-3">{v.active ? "Nonaktifkan" : "Aktifkan"}</button>
                    </form>
                    <form action={deleteAdminVoucherAction} className="inline">
                      <input type="hidden" name="id" value={v.id} />
                      <button className="text-xs text-red-600 hover:underline">Hapus</button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
