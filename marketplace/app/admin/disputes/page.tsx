import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { resolveDisputeAction, addDisputeMessageAction } from "@/app/actions/disputes";
import { Card, PageHeader, Badge } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  OPEN: "Terbuka",
  RETURN_APPROVED: "Menunggu Retur",
  RESOLVED_REFUND: "Refund ke pembeli",
  RESOLVED_RELEASE: "Diteruskan ke penjual",
  REJECTED: "Ditolak",
};

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const disputes = await db.dispute.findMany({
    where: q
      ? {
          OR: [
            { order: { code: { contains: q, mode: "insensitive" } } },
            { order: { store: { name: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {},
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      order: { include: { store: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
    take: 100,
  });

  const open = disputes.filter((d) => d.status === "OPEN");
  const returning = disputes.filter((d) => d.status === "RETURN_APPROVED");
  const resolved = disputes.filter((d) => !["OPEN", "RETURN_APPROVED"].includes(d.status));

  return (
    <div className="space-y-6">
      <PageHeader title="Sengketa / Komplain" />

      <Card>
        <form method="get" className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cari kode order atau nama toko..."
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
          />
          <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700">
            Cari
          </button>
          {q && <Link href="/admin/disputes" className="text-sm text-slate-500 hover:underline">Reset</Link>}
        </form>
      </Card>

      <section className="space-y-4">
        <h2 className="font-bold text-sm text-orange-700">Perlu Ditinjau ({open.length})</h2>
        {open.length === 0 && <p className="text-sm text-slate-400">Tidak ada sengketa terbuka. 🎉</p>}
        {open.map((d) => (
          <Card key={d.id} className="border-l-4 border-orange-400 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">
                  Order {d.order.code} · {d.order.store.name}
                </p>
                <p className="text-xs text-slate-500">
                  {d.order.buyerName} · {formatRupiah(d.order.total)} · dibuat{" "}
                  {new Date(d.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="space-y-1 bg-slate-50 rounded-lg p-3 max-h-52 overflow-auto">
              {d.messages.map((m) => (
                <p key={m.id} className="text-sm">
                  <span className="font-semibold">
                    {m.author === "BUYER" ? "Pembeli" : m.author === "SELLER" ? "Penjual" : "Admin"}:
                  </span>{" "}
                  {m.body}
                </p>
              ))}
            </div>

            <form action={addDisputeMessageAction} className="flex gap-2">
              <input type="hidden" name="disputeId" value={d.id} />
              <input type="hidden" name="role" value="ADMIN" />
              <input
                type="text"
                name="body"
                required
                placeholder="Balas sebagai admin…"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
              <button className="bg-slate-700 text-white text-sm font-bold px-3 py-1.5 rounded-lg">Kirim</button>
            </form>

            <form action={resolveDisputeAction} className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <input type="hidden" name="disputeId" value={d.id} />
              <input
                type="text"
                name="resolution"
                placeholder="Catatan keputusan (opsional)"
                className="flex-1 min-w-40 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
              <button name="outcome" value="REFUND" className="bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-red-700">
                Refund pembeli
              </button>
              <button name="outcome" value="RETURN" className="bg-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-orange-600">
                Setujui retur
              </button>
              <button name="outcome" value="RELEASE" className="bg-emerald-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700">
                Teruskan ke penjual
              </button>
              <button name="outcome" value="REJECT" className="bg-slate-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-slate-600">
                Tolak komplain
              </button>
            </form>
            <p className="text-[11px] text-slate-400">
              Refund: dana escrow dibatalkan & langsung REFUNDED. Retur: pembeli kirim barang balik ke penjual dulu,
              baru refund setelah penjual konfirmasi terima. Pengembalian uang ke pembeli diproses admin via
              gateway/manual.
            </p>
          </Card>
        ))}
      </section>

      {returning.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold text-sm text-amber-700">Menunggu Retur ({returning.length})</h2>
          {returning.map((d) => (
            <Card key={d.id} className="border-l-4 border-amber-400 !p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  Order {d.order.code} · {d.order.store.name} · {formatRupiah(d.order.total)}
                </span>
                <Badge tone="amber">Menunggu Retur</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {d.returnTrackingNumber
                  ? `Resi retur: ${d.returnCourier ?? ""} ${d.returnTrackingNumber} — menunggu konfirmasi penjual (tenggat auto-refund: ${d.returnDeadlineAt ? new Date(d.returnDeadlineAt).toLocaleDateString("id-ID") : "-"})`
                  : "Menunggu pembeli mengirim barang & mengisi nomor resi"}
              </p>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-bold text-sm text-slate-600">Riwayat ({resolved.length})</h2>
        {resolved.map((d) => (
          <Card key={d.id} className="!p-4 text-sm flex items-center justify-between">
            <span>
              Order {d.order.code} · {d.order.store.name} · {formatRupiah(d.order.total)}
            </span>
            <Badge>{STATUS[d.status]}</Badge>
          </Card>
        ))}
      </section>
    </div>
  );
}
