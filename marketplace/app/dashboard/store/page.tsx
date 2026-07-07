import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import StoreSettingsForm from "@/components/StoreSettingsForm";
import FulfillmentSettingsForm from "@/components/FulfillmentSettingsForm";
import { toggleStorePausedAction } from "@/app/actions/seller";

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

      <div className={`rounded-2xl border p-5 flex items-center justify-between flex-wrap gap-3 ${store.paused ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
        <div>
          <h2 className="font-bold">{store.paused ? "⏸ Toko Sedang Tutup Sementara" : "Toko Aktif Berjualan"}</h2>
          <p className="text-sm text-slate-500">
            {store.paused
              ? "Produkmu disembunyikan dari Belanja & tidak bisa dibeli sampai kamu buka lagi."
              : "Mau libur atau lagi restock? Tutup toko sementara tanpa nonaktifkan produk satu-satu."}
          </p>
        </div>
        <form action={toggleStorePausedAction}>
          <button
            className={`text-sm font-bold px-4 py-2.5 rounded-xl ${
              store.paused ? "bg-teal-600 text-white hover:bg-teal-700" : "border border-amber-300 text-amber-700 hover:bg-amber-50"
            }`}
          >
            {store.paused ? "Buka Toko Lagi" : "Tutup Sementara"}
          </button>
        </form>
      </div>

      <StoreSettingsForm store={store} />
      <FulfillmentSettingsForm enabledPaymentTypes={store.enabledPaymentTypes} enabledCouriers={store.enabledCouriers} />
    </div>
  );
}
