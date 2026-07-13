import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { kieAiEnabled } from "@/lib/kieai";
import { toggleStoreAiAction } from "@/app/actions/admin";
import { PageHeader, Card, Badge, StatCard, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminAiUsagePage() {
  await requireAdmin();
  const platformEnabled = await kieAiEnabled();

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [stores, generations] = await Promise.all([
    db.store.findMany({
      select: { id: true, name: true, slug: true, aiGenerationEnabled: true, plan: true, planUntil: true },
      orderBy: { aiGenerationEnabled: "desc" },
    }),
    db.aiGeneration.findMany({
      where: { createdAt: { gte: since } },
      select: { storeId: true, type: true },
    }),
  ]);

  const usageByStore = new Map<string, { images: number; captions: number }>();
  for (const g of generations) {
    const cur = usageByStore.get(g.storeId) ?? { images: 0, captions: 0 };
    if (g.type === "IMAGE") cur.images += 1;
    else cur.captions += 1;
    usageByStore.set(g.storeId, cur);
  }

  const enabledCount = stores.filter((s) => s.aiGenerationEnabled).length;
  const totalGenerations = generations.length;
  const activeUsers = usageByStore.size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="✨ AI Studio"
        description="Kelola akses fitur generate foto & caption produk (kie.ai) per seller, dan pantau pemakaian bulan ini."
      />

      {!platformEnabled && (
        <Card className="border-l-4 border-amber-400 bg-amber-50/50">
          <p className="text-sm text-amber-800">
            API key kie.ai belum diatur — fitur AI Studio tidak akan berfungsi untuk seller manapun sampai kamu isi di{" "}
            <Link href="/admin/settings" className="font-bold hover:underline">Pengaturan</Link>.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="✨" label="Seller Diizinkan" value={String(enabledCount)} tone="violet" />
        <StatCard icon="👥" label="Pakai Bulan Ini" value={String(activeUsers)} tone="indigo" />
        <StatCard icon="🖼️" label="Generate Bulan Ini" value={String(totalGenerations)} tone="fuchsia" />
        <StatCard icon="🔑" label="API Key" value={platformEnabled ? "Aktif" : "Belum diatur"} tone={platformEnabled ? "emerald" : "amber"} />
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
                <th className="px-4 py-3">Gambar Bulan Ini</th>
                <th className="px-4 py-3">Caption Bulan Ini</th>
                <th className="px-4 py-3">Kuota</th>
                <th className="px-4 py-3">Akses</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => {
                const usage = usageByStore.get(s.id) ?? { images: 0, captions: 0 };
                const proActive = s.plan === "PRO" && s.planUntil !== null && s.planUntil > new Date();
                const limit = proActive ? 100 : 10;
                const used = usage.images + usage.captions;
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
                    <td className="px-4 py-3">{usage.captions}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{used} / {limit}</td>
                    <td className="px-4 py-3">
                      <form action={toggleStoreAiAction}>
                        <input type="hidden" name="storeId" value={s.id} />
                        <input type="hidden" name="enabled" value={String(!s.aiGenerationEnabled)} />
                        <button
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full cursor-pointer ${
                            s.aiGenerationEnabled ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {s.aiGenerationEnabled ? "Aktif" : "Nonaktif"}
                        </button>
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
