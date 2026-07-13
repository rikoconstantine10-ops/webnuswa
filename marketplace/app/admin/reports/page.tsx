import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveReportAction } from "@/app/actions/admin";
import { Card, PageHeader, Badge, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  SPAM: "Spam/menyesatkan",
  PROHIBITED: "Barang terlarang",
  COUNTERFEIT: "Palsu/KW",
  SCAM: "Penipuan",
  OTHER: "Lainnya",
};

const STATUS_OPTIONS = ["OPEN", "REVIEWED", "DISMISSED", "ACTIONED"];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const { status, q } = await searchParams;
  const activeStatus = status && STATUS_OPTIONS.includes(status) ? status : "OPEN";
  const reports = await db.productReport.findMany({
    where: {
      status: activeStatus,
      ...(q ? { product: { name: { contains: q, mode: "insensitive" } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { name: true, slug: true, active: true, moderation: true } }, store: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader title="Laporan Produk" description="Tinjau laporan penyalahgunaan & produk auto-flag kata terlarang." />

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cari nama produk..."
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
          />
          <select name="status" defaultValue={activeStatus} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700">
            Cari
          </button>
        </form>
      </Card>

      {reports.length === 0 ? (
        <EmptyState icon="🚩" title="Tidak ada laporan dengan status ini" description="🎉" />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge tone="red">{REASON_LABEL[r.reason] ?? r.reason}</Badge>
                {r.product.moderation === "PENDING" && <Badge tone="amber">Menunggu tinjauan</Badge>}
                {!r.product.active && <Badge>Nonaktif</Badge>}
                <span className="text-xs text-slate-400">
                  {r.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <Link href={`/p/${r.product.slug}`} className="font-semibold text-teal-600 hover:underline">
                {r.product.name}
              </Link>
              <span className="text-sm text-slate-500"> · {r.store.name}</span>
              {r.detail && <p className="text-sm text-slate-600 mt-1">{r.detail}</p>}
              {r.reporterEmail && <p className="text-xs text-slate-400 mt-0.5">Pelapor: {r.reporterEmail}</p>}

              <div className="flex gap-2 mt-3">
                <form action={resolveReportAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="decision" value="TAKEDOWN" />
                  <button className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-700 cursor-pointer">
                    Turunkan Produk
                  </button>
                </form>
                {r.product.moderation === "PENDING" && (
                  <form action={resolveReportAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="decision" value="APPROVE" />
                    <button className="bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 cursor-pointer">
                      Loloskan (aman)
                    </button>
                  </form>
                )}
                <form action={resolveReportAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="decision" value="DISMISS" />
                  <button className="border border-slate-300 text-slate-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    Abaikan
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
