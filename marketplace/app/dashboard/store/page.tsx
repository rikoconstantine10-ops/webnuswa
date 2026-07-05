import { requireSeller } from "@/lib/auth";
import StoreSettingsForm from "@/components/StoreSettingsForm";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  const { store } = await requireSeller();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Pengaturan Toko</h1>
        <p className="text-sm text-slate-500">
          Halaman tokomu: <span className="font-mono text-teal-600">/s/{store.slug}</span>
        </p>
      </div>
      <StoreSettingsForm store={store} />
    </div>
  );
}
