import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { createLandingPageAction } from "@/app/actions/landingPage";
import { LANDING_TEMPLATES } from "@/lib/landingTemplates";
import { Card, PageHeader } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function NewLandingPage() {
  const { store } = await requireSeller();
  const products = await db.product.findMany({
    where: { storeId: store.id, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Link href="/dashboard/landing" className="text-sm text-teal-600 hover:underline">← Landing Page</Link>
      <PageHeader title="Buat Landing Page Baru" />

      {products.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Kamu belum punya produk aktif. Tambah produk dulu sebelum buat landing page.</p>
        </Card>
      ) : (
        <Card>
          <form action={createLandingPageAction} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Judul landing page (internal, buat kamu sendiri)</label>
              <input name="title" required minLength={3} placeholder="mis. Promo Lebaran - Angle Ibu-ibu" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Produk utama</label>
              <select name="productId" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Pilih produk</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Mulai dari</label>
              <div className="grid sm:grid-cols-3 gap-2">
                {Object.entries(LANDING_TEMPLATES).map(([key, t]) => (
                  <label key={key} className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
                    <input type="radio" name="template" value={key} defaultChecked={key === "blank"} />
                    {t.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Blok bawaan template bisa diedit/dihapus/ditambah lagi setelah dibuat.</p>
            </div>
            <button className="bg-teal-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-teal-700">
              Buat & Mulai Desain
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
