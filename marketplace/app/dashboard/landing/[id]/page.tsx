import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseLandingBlocks } from "@/lib/landingBlocks";
import { updateLandingMetaAction } from "@/app/actions/landingPage";
import { Card, PageHeader, Badge } from "@/components/dashboard/ui";
import LandingEditorLayout from "@/components/landing/LandingEditorLayout";

export const dynamic = "force-dynamic";

export default async function LandingBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await requireSeller();

  const lp = await db.landingPage.findUnique({
    where: { id },
    include: { product: { include: { addonLinks: { include: { addonProduct: { select: { id: true, name: true, active: true } } } } } } },
  });
  if (!lp || lp.storeId !== store.id) notFound();

  const appUrl = process.env.APP_URL || "";
  const blocks = parseLandingBlocks(lp.blocks);
  const addons = lp.product.addonLinks.filter((a) => a.addonProduct.active).map((a) => ({ id: a.addonProductId, name: a.addonProduct.name }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/landing" className="text-sm text-teal-600 hover:underline">← Landing Page</Link>
        <PageHeader
          title={lp.title}
          action={<Badge tone={lp.published ? "emerald" : "slate"}>{lp.published ? "Publik" : "Draf"}</Badge>}
          description={`Produk: ${lp.product.name}`}
        />
      </div>

      <Card>
        <h2 className="font-bold mb-3">Pengaturan Halaman</h2>
        <form action={updateLandingMetaAction} className="space-y-3">
          <input type="hidden" name="id" value={lp.id} />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Judul (internal)</label>
              <input name="title" defaultValue={lp.title} required minLength={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">URL slug</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 shrink-0">{appUrl}/l/</span>
                <input name="slug" defaultValue={lp.slug} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
            </div>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-slate-600">Preview link saat dibagikan (opsional)</summary>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <input name="ogTitle" defaultValue={lp.ogTitle ?? ""} placeholder="Judul preview (mis. di WA/FB)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input name="ogImageUrl" defaultValue={lp.ogImageUrl ?? ""} placeholder="URL gambar preview" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <textarea name="ogDescription" defaultValue={lp.ogDescription ?? ""} placeholder="Deskripsi singkat preview" rows={2} className="sm:col-span-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </details>
          <button className="bg-slate-700 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-slate-800">Simpan Pengaturan</button>
        </form>
      </Card>

      <LandingEditorLayout landingPageId={lp.id} initialBlocks={blocks} addons={addons} previewUrl={`${appUrl}/l/${lp.slug}`} />
    </div>
  );
}
