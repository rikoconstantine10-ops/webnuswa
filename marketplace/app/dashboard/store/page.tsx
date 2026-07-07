import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import StoreSettingsForm from "@/components/StoreSettingsForm";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  const { store } = await requireSeller();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold mb-2">Pengaturan Toko</h1>
          <p className="text-sm text-slate-500">
            Halaman tokomu: <span className="font-mono text-teal-600">/s/{store.slug}</span>
          </p>
        </div>
        <Link
          href="/dashboard/store/builder"
          className="bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700"
        >
          🎨 Desain Halaman Toko
        </Link>
      </div>
      <StoreSettingsForm store={store} />
    </div>
  );
}
