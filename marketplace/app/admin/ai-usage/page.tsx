import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { kieAiEnabled } from "@/lib/kieai";
import { toggleStoreAiFeatureAction } from "@/app/actions/admin";
import { createAiCreditPackageAction, toggleAiCreditPackageAction, deleteAiCreditPackageAction } from "@/app/actions/aiCredits";
import { PageHeader, Card, Badge, StatCard, EmptyState } from "@/components/dashboard/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function AdminAiUsagePage() {
  await requireAdmin();
  const platformEnabled = await kieAiEnabled();

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [stores, generations, chatMessages, packages, revenueAgg] = await Promise.all([
    db.store.findMany({
      select: {
        id: true, name: true, slug: true, plan: true, planUntil: true,
        aiImageEnabled: true, aiVideoEnabled: true, aiCaptionEnabled: true, aiChatEnabled: true,
      },
      orderBy: { name: "asc" },
    }),
    db.aiGeneration.findMany({
      where: { createdAt: { gte: since } },
      select: { storeId: true, type: true },
    }),
    // Balasan chatbot WA TIDAK dicatat di AiGeneration (sengaja unlimited, tidak potong kuota/kredit —
    // lihat lib/waChat.ts) — jadi volume & biayanya dihitung terpisah dari WaMessage yang sudah ada,
    // bukan menambah baris baru, supaya tidak ikut mengurangi kuota gratis foto/video/caption.
    db.waMessage.findMany({
      where: { author: "BOT", createdAt: { gte: since } },
      select: { conversation: { select: { storeId: true } } },
    }),
    db.aiCreditPackage.findMany({ orderBy: { sort: "asc" } }),
    db.aiCreditPurchase.aggregate({ where: { status: "PAID" }, _sum: { priceRupiah: true, credits: true } }),
  ]);

  const usageByStore = new Map<string, { images: number; captions: number; videos: number }>();
  for (const g of generations) {
    const cur = usageByStore.get(g.storeId) ?? { images: 0, captions: 0, videos: 0 };
    if (g.type === "IMAGE") cur.images += 1;
    else if (g.type === "VIDEO") cur.videos += 1;
    else cur.captions += 1;
    usageByStore.set(g.storeId, cur);
  }

  const chatCountByStore = new Map<string, number>();
  for (const m of chatMessages) {
    chatCountByStore.set(m.conversation.storeId, (chatCountByStore.get(m.conversation.storeId) ?? 0) + 1);
  }

  const enabledCount = stores.filter((s) => s.aiImageEnabled || s.aiVideoEnabled || s.aiCaptionEnabled || s.aiChatEnabled).length;
  const totalGenerations = generations.length;
  const totalChatReplies = chatMessages.length;
  const activeUsers = usageByStore.size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="✨ AI Studio"
        description="Kelola akses 4 fitur AI (Foto/Video/Caption/Chatbot) per seller secara independen — dasar untuk paket berjenjang — dan pantau pemakaian bulan ini."
      />

      {!platformEnabled && (
        <Card className="border-l-4 border-amber-400 bg-amber-50/50">
          <p className="text-sm text-amber-800">
            API key kie.ai belum diatur — fitur AI Studio tidak akan berfungsi untuk seller manapun sampai kamu isi di{" "}
            <Link href="/admin/settings" className="font-bold hover:underline">Pengaturan</Link>.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon="✨" label="Seller Diizinkan" value={String(enabledCount)} tone="violet" />
        <StatCard icon="👥" label="Pakai Bulan Ini" value={String(activeUsers)} tone="indigo" />
        <StatCard icon="🖼️" label="Generate Bulan Ini" value={String(totalGenerations)} tone="fuchsia" />
        <StatCard icon="🤖" label="Balasan Chatbot Bulan Ini" value={String(totalChatReplies)} tone="amber" />
        <StatCard icon="🔑" label="API Key" value={platformEnabled ? "Aktif" : "Belum diatur"} tone={platformEnabled ? "emerald" : "amber"} />
      </div>
      <p className="text-xs text-slate-400 -mt-2">
        Balasan chatbot sengaja tidak dibatasi kuota/kredit (unlimited), tapi tetap dihitung di sini untuk
        pantauan biaya API provider per toko.
      </p>

      <div>
        <PageHeader
          title="💎 Paket Kredit AI"
          description={`Pendapatan topup kredit: ${formatRupiah(revenueAgg._sum.priceRupiah ?? 0)} (${revenueAgg._sum.credits ?? 0} kredit terjual). Kredit dipakai seller setelah kuota gratis bulanan habis, dibayar via Louvin (QRIS/VA).`}
        />

        <Card className="mb-4">
          <form action={createAiCreditPackageAction} className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Nama Paket</label>
              <input type="text" name="name" required placeholder="Paket Hemat" className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-40" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Jumlah Kredit</label>
              <input type="number" name="credits" required min={1} placeholder="50" className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-28" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Harga (Rp)</label>
              <input type="number" name="priceRupiah" required min={1} placeholder="25000" className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-32" />
            </div>
            <button className="bg-violet-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-violet-700">
              + Tambah Paket
            </button>
          </form>
        </Card>

        {packages.length === 0 ? (
          <EmptyState icon="💎" title="Belum ada paket kredit" description="Tambahkan paket di atas supaya seller bisa topup kredit AI." />
        ) : (
          <Card className="!p-0 divide-y divide-slate-50">
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="font-medium text-sm">{pkg.name}</p>
                  <p className="text-xs text-slate-400">{pkg.credits} kredit · {formatRupiah(pkg.priceRupiah)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={pkg.active ? "emerald" : "slate"}>{pkg.active ? "Aktif" : "Nonaktif"}</Badge>
                  <form action={toggleAiCreditPackageAction}>
                    <input type="hidden" name="id" value={pkg.id} />
                    <button className="text-xs text-slate-600 hover:underline cursor-pointer">
                      {pkg.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                  <form action={deleteAiCreditPackageAction}>
                    <input type="hidden" name="id" value={pkg.id} />
                    <ConfirmButton confirmMessage={`Hapus paket "${pkg.name}"?`} className="text-xs text-red-600 hover:underline cursor-pointer">
                      Hapus
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {stores.length === 0 ? (
        <EmptyState icon="🏪" title="Belum ada seller" />
      ) : (
        <Card className="!p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3">Toko</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Caption</th>
                <th className="px-4 py-3">Kuota</th>
                <th className="px-4 py-3">🤖 Chat</th>
                <th className="px-4 py-3">Fitur Aktif</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => {
                const usage = usageByStore.get(s.id) ?? { images: 0, captions: 0, videos: 0 };
                const chatCount = chatCountByStore.get(s.id) ?? 0;
                const proActive = s.plan === "PRO" && s.planUntil !== null && s.planUntil > new Date();
                const limit = proActive ? 100 : 10;
                const used = usage.images + usage.captions + usage.videos;
                return (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/sellers/${s.id}`} className="hover:text-indigo-600">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={proActive ? "violet" : "slate"}>{proActive ? "PRO" : "FREE"}</Badge>
                    </td>
                    <td className="px-4 py-3">{usage.images}</td>
                    <td className="px-4 py-3">{usage.videos}</td>
                    <td className="px-4 py-3">{usage.captions}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{used} / {limit}</td>
                    <td className="px-4 py-3 text-xs">{chatCount > 0 ? chatCount : "–"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(
                          [
                            { key: "image", label: "Foto", on: s.aiImageEnabled },
                            { key: "video", label: "Video", on: s.aiVideoEnabled },
                            { key: "caption", label: "Caption", on: s.aiCaptionEnabled },
                            { key: "chat", label: "Chat", on: s.aiChatEnabled },
                          ] as const
                        ).map((f) => (
                          <form key={f.key} action={toggleStoreAiFeatureAction}>
                            <input type="hidden" name="storeId" value={s.id} />
                            <input type="hidden" name="feature" value={f.key} />
                            <input type="hidden" name="enabled" value={String(!f.on)} />
                            <button
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                                f.on ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {f.label}
                            </button>
                          </form>
                        ))}
                      </div>
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
