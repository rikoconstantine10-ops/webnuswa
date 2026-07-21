import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { duplicateLandingPageAction, togglePublishLandingAction, deleteLandingPageAction } from "@/app/actions/landingPage";
import { Card, PageHeader, Badge, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function LandingListPage() {
  const { store } = await requireSeller();

  const pages = await db.landingPage.findMany({
    where: { storeId: store.id },
    include: {
      product: { select: { name: true, imageUrl: true } },
      _count: { select: { leads: true } },
      orders: { where: { status: { notIn: ["CANCELLED", "EXPIRED"] } }, select: { total: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const appUrl = process.env.APP_URL || "";

  return (
    <div>
      <PageHeader
        title="Landing Page"
        action={
          <Link href="/dashboard/landing/new" className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-700">
            + Buat Landing Page
          </Link>
        }
      />
      <p className="text-sm text-slate-500 mb-4 -mt-2">
        Halaman funnel 1-produk: susun blok sendiri, langsung ada form order di halaman, cocok untuk iklan FB/IG/TikTok.
      </p>

      {pages.length === 0 ? (
        <EmptyState icon="🚀" title="Belum ada landing page. Buat yang pertama untuk mulai jualan lewat iklan!" />
      ) : (
        <div className="space-y-3">
          {pages.map((lp) => {
            const orderCount = lp.orders.length;
            const revenue = lp.orders.reduce((s, o) => s + o.total, 0);
            return (
              <Card key={lp.id} className="!p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate">{lp.title}</p>
                      <Badge tone={lp.published ? "emerald" : "slate"}>{lp.published ? "Publik" : "Draf"}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Produk: {lp.product.name}</p>
                    {lp.published && (
                      <a href={`${appUrl}/l/${lp.slug}`} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline font-mono">
                        {appUrl.replace(/^https?:\/\//, "")}/l/{lp.slug}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                    <span>👁 {lp.views} dilihat</span>
                    <span>🎯 {lp._count.leads} lead</span>
                    <span>🧾 {orderCount} order · {formatRupiah(revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/dashboard/landing/${lp.id}`} className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200">
                      Edit
                    </Link>
                    <form action={togglePublishLandingAction}>
                      <input type="hidden" name="id" value={lp.id} />
                      <button className={`text-xs font-bold px-3 py-1.5 rounded-lg ${lp.published ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>
                        {lp.published ? "Nonaktifkan" : "Publikasikan"}
                      </button>
                    </form>
                    <form action={duplicateLandingPageAction}>
                      <input type="hidden" name="id" value={lp.id} />
                      <button className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200" title="Duplikat untuk A/B testing">
                        ⧉ Salin
                      </button>
                    </form>
                    <form action={deleteLandingPageAction}>
                      <input type="hidden" name="id" value={lp.id} />
                      <button className="text-xs font-bold text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50">Hapus</button>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
