import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { markAffiliatePaidAction } from "@/app/actions/admin";
import { Card, PageHeader, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminAffiliatesPage() {
  await requireAdmin();
  // Kelompokkan komisi AVAILABLE per afiliasi.
  const grouped = await db.affiliateCommission.groupBy({
    by: ["affiliateUserId"],
    where: { status: "AVAILABLE" },
    _sum: { amount: true },
    _count: true,
  });
  const users = await db.user.findMany({
    where: { id: { in: grouped.map((g) => g.affiliateUserId) } },
    select: { id: true, name: true, email: true, affiliateCode: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-4">
      <PageHeader title="Komisi Afiliasi" />
      {grouped.length === 0 ? (
        <EmptyState icon="🤝" title="Tidak ada komisi yang perlu dibayar" />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2">Afiliasi</th>
                <th className="text-left px-4 py-2">Kode</th>
                <th className="text-left px-4 py-2">Komisi Tersedia</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g) => {
                const u = byId.get(g.affiliateUserId);
                return (
                  <tr key={g.affiliateUserId} className="border-t border-slate-100">
                    <td className="px-4 py-2">{u?.name || u?.email}</td>
                    <td className="px-4 py-2 font-mono text-xs">{u?.affiliateCode}</td>
                    <td className="px-4 py-2 font-bold">{formatRupiah(g._sum.amount ?? 0)} <span className="text-xs text-slate-400">({g._count} order)</span></td>
                    <td className="px-4 py-2 text-right">
                      <form action={markAffiliatePaidAction}>
                        <input type="hidden" name="userId" value={g.affiliateUserId} />
                        <button className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700">Tandai Dibayar</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
