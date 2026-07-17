import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, Badge, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const FILTER_OPTIONS = ["all", "human", "unread"] as const;

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  await requireAdmin();
  const { q, filter } = await searchParams;
  const activeFilter = FILTER_OPTIONS.includes(filter as (typeof FILTER_OPTIONS)[number]) ? filter! : "all";

  const conversations = await db.waConversation.findMany({
    where: {
      ...(activeFilter === "human" ? { mode: "HUMAN" } : {}),
      ...(activeFilter === "unread" ? { unreadCount: { gt: 0 } } : {}),
      ...(q
        ? {
            OR: [
              { buyerPhone: { contains: q } },
              { buyerName: { contains: q, mode: "insensitive" } },
              { store: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      store: { select: { name: true, slug: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, author: true, mediaType: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="📥 Inbox Chatbot (Semua Toko)"
        description="Lihat percakapan WA seluruh toko untuk audit/dukungan — read-only, tidak untuk membalas sebagai toko."
      />

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cari nama toko, nomor, atau nama pembeli..."
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
          />
          <select name="filter" defaultValue={activeFilter} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua</option>
            <option value="human">Butuh Manusia</option>
            <option value="unread">Belum Dibaca</option>
          </select>
          <button className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700">
            Cari
          </button>
          {(q || activeFilter !== "all") && (
            <Link href="/admin/inbox" className="text-sm text-slate-500 hover:underline">Reset</Link>
          )}
        </form>
      </Card>

      {conversations.length === 0 ? (
        <EmptyState icon="📥" title="Tidak ada percakapan dengan filter ini" />
      ) : (
        <Card className="!p-0 divide-y divide-slate-50">
          {conversations.map((c) => {
            const last = c.messages[0];
            return (
              <Link
                key={c.id}
                href={`/admin/inbox/${c.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {c.buyerName || c.buyerPhone} <span className="text-slate-400 font-normal">· {c.store.name}</span>
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-md">
                    {last?.author === "BOT" ? "🤖 " : last?.author === "SELLER" ? "Seller: " : ""}
                    {last?.body || (last?.mediaType ? "📷 Media" : "(belum ada pesan)")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.mode === "HUMAN" && <Badge tone="amber">Butuh Manusia</Badge>}
                  {c.blocked && <Badge tone="red">Diblokir</Badge>}
                  {c.unreadCount > 0 && <Badge tone="red">{c.unreadCount} belum dibaca</Badge>}
                  <span className="text-xs text-slate-400">
                    {c.lastMessageAt.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
