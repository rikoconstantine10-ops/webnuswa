import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { resolveDisputeAction, addDisputeMessageAction } from "@/app/actions/disputes";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  OPEN: "Terbuka",
  RESOLVED_REFUND: "Refund ke pembeli",
  RESOLVED_RELEASE: "Diteruskan ke penjual",
  REJECTED: "Ditolak",
};

export default async function AdminDisputesPage() {
  await requireAdmin();
  const disputes = await db.dispute.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      order: { include: { store: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
    take: 100,
  });

  const open = disputes.filter((d) => d.status === "OPEN");
  const resolved = disputes.filter((d) => d.status !== "OPEN");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Sengketa / Komplain</h1>

      <section className="space-y-4">
        <h2 className="font-bold text-sm text-orange-700">Perlu Ditinjau ({open.length})</h2>
        {open.length === 0 && <p className="text-sm text-slate-400">Tidak ada sengketa terbuka. 🎉</p>}
        {open.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl border border-orange-200 p-5 space-y-3">
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
              <button name="outcome" value="RELEASE" className="bg-emerald-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700">
                Teruskan ke penjual
              </button>
              <button name="outcome" value="REJECT" className="bg-slate-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-slate-600">
                Tolak komplain
              </button>
            </form>
            <p className="text-[11px] text-slate-400">
              Refund: dana escrow dibatalkan (tidak masuk saldo penjual) & order ditandai REFUNDED. Pengembalian uang ke
              pembeli diproses admin via gateway/manual.
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-sm text-slate-600">Riwayat ({resolved.length})</h2>
        {resolved.map((d) => (
          <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-4 text-sm flex items-center justify-between">
            <span>
              Order {d.order.code} · {d.order.store.name} · {formatRupiah(d.order.total)}
            </span>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">{STATUS[d.status]}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
