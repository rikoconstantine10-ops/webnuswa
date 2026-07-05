import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { affiliateBalance } from "@/lib/earnings";
import { becomeAffiliateAction } from "@/app/actions/affiliate";
import AffiliateLinkBuilder from "@/components/AffiliateLinkBuilder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Program Afiliasi — NuswaMart" };

export default async function AffiliatePage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/affiliate");

  if (!user.affiliateCode) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-extrabold mb-2">Program Afiliasi NuswaMart</h1>
        <p className="text-slate-500 mb-6">
          Bagikan produk apa pun yang punya komisi afiliasi, dan dapat komisi setiap ada pembelian dari link kamu.
        </p>
        <form action={becomeAffiliateAction}>
          <button className="bg-teal-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-700">
            Aktifkan Akun Afiliasi
          </button>
        </form>
      </div>
    );
  }

  const [balance, commissions, paid] = await Promise.all([
    affiliateBalance(user.id),
    db.affiliateCommission.findMany({
      where: { affiliateUserId: user.id },
      orderBy: { createdAt: "desc" },
      include: { order: { select: { code: true } } },
      take: 50,
    }),
    db.affiliateCommission.aggregate({ where: { affiliateUserId: user.id, status: "PAID" }, _sum: { amount: true } }),
  ]);
  const appUrl = process.env.APP_URL || "";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold">Program Afiliasi</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Komisi Tersedia</p>
          <p className="text-xl font-extrabold text-teal-600">{formatRupiah(balance)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-1">Total Dibayar</p>
          <p className="text-xl font-extrabold">{formatRupiah(paid._sum.amount ?? 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm font-bold mb-1">Kode afiliasimu</p>
        <p className="font-mono text-lg font-extrabold text-teal-700 mb-3">{user.affiliateCode}</p>
        <AffiliateLinkBuilder affCode={user.affiliateCode} appUrl={appUrl} />
        <p className="text-xs text-slate-400 mt-2">
          Tempel kode di atas ke link produk mana pun: <span className="font-mono">{appUrl}/p/&lt;slug&gt;?aff={user.affiliateCode}</span>. Komisi
          cair otomatis saat pesanan pembeli selesai.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-bold text-sm">Riwayat Komisi</div>
        {commissions.length === 0 ? (
          <p className="text-sm text-slate-400 p-6 text-center">Belum ada komisi. Mulai bagikan produk!</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-t border-slate-50">
                  <td className="px-4 py-2 font-mono text-xs">{c.order.code}</td>
                  <td className="px-4 py-2 font-bold">{formatRupiah(c.amount)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : c.status === "PAID" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"}`}>
                      {c.status === "AVAILABLE" ? "Tersedia" : c.status === "PAID" ? "Dibayar" : c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-slate-400">Penarikan komisi: hubungi admin (cs@nuswamart.com) dengan info rekening — akan diproses &amp; ditandai &quot;Dibayar&quot;.</p>
    </div>
  );
}
