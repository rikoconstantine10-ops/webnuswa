import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, Badge } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminInboxThreadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const conversation = await db.waConversation.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true, slug: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) notFound();

  return (
    <div>
      <Link href="/admin/inbox" className="text-sm text-teal-600 hover:underline">← Kembali ke Inbox</Link>
      <PageHeader
        title={`💬 ${conversation.buyerName || conversation.buyerPhone}`}
        description={`Toko: ${conversation.store.name} · ${conversation.buyerPhone}`}
        action={
          <div className="flex gap-2">
            {conversation.mode === "HUMAN" && <Badge tone="amber">Butuh Manusia</Badge>}
            {conversation.blocked && <Badge tone="red">Diblokir</Badge>}
            <Link
              href={`/admin/sellers/${conversation.store.id}`}
              className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-2 rounded-lg hover:bg-slate-200"
            >
              Lihat Toko →
            </Link>
          </div>
        }
      />

      <Card className="!p-0">
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {conversation.messages.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada pesan.</p>
          )}
          {conversation.messages.map((m) => (
            <div key={m.id} className={`flex ${m.direction === "IN" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                  m.direction === "IN" ? "bg-slate-100" : "bg-teal-600 text-white"
                }`}
              >
                <p className="text-[10px] opacity-70 mb-0.5">
                  {m.author === "BUYER" ? "Pembeli" : m.author === "BOT" ? "🤖 Bot" : "Seller"} ·{" "}
                  {m.createdAt.toLocaleString("id-ID")}
                </p>
                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt="" className="rounded-lg max-w-full mb-1" />
                )}
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <p className="text-xs text-slate-400 mt-3">
        Halaman ini read-only untuk audit/dukungan — admin tidak membalas dari sini. Untuk membalas sebagai
        toko, sarankan seller masuk ke Inbox mereka sendiri di dashboard.
      </p>
    </div>
  );
}
