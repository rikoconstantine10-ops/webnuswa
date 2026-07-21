import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Poin Loyalitas — NuswaMart" };

export default async function PointsPage() {
  const user = await requireUser();
  const entries = await db.pointEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { order: { select: { code: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Poin Loyalitas</h1>

      <div className="bg-gradient-to-br from-teal-600 to-teal-500 text-white rounded-2xl p-6 mb-6">
        <p className="text-teal-100 text-sm">Saldo Poin</p>
        <p className="text-4xl font-extrabold mt-1">⭐ {user.points.toLocaleString("id-ID")}</p>
        <p className="text-teal-100 text-sm mt-2">1 poin = Rp1. Tukar poinmu saat checkout untuk potongan harga.</p>
      </div>

      <h2 className="font-bold text-sm text-slate-500 mb-2">Riwayat Poin</h2>
      {entries.length === 0 ? (
        <p className="text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-200">
          Belum ada aktivitas poin. Belanja untuk mulai mengumpulkan poin!
        </p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{e.note ?? (e.amount > 0 ? "Poin masuk" : "Poin ditukar")}</p>
                <p className="text-xs text-slate-400">
                  {e.order ? `Order ${e.order.code} · ` : ""}
                  {e.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className={`font-bold text-sm ${e.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {e.amount > 0 ? "+" : ""}{e.amount.toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
