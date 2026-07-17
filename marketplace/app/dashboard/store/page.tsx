import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import StoreSettingsForm from "@/components/StoreSettingsForm";
import FulfillmentSettingsForm from "@/components/FulfillmentSettingsForm";
import WaConnect from "@/components/WaConnect";
import WaBotSettingsForm from "@/components/WaBotSettingsForm";
import KnowledgeList from "@/components/KnowledgeList";
import SettingsTabs from "@/components/dashboard/SettingsTabs";
import { toggleStorePausedAction } from "@/app/actions/seller";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  const { store } = await requireSeller();
  const knowledgeItems = await db.waKnowledgeItem.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: "asc" },
  });

  const umumPanel = (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border p-5 flex items-center justify-between flex-wrap gap-3 ${
          store.paused ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"
        }`}
      >
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
              store.paused
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "border border-amber-300 text-amber-700 hover:bg-amber-50"
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

  const chatbotPanel = (
    <div className="max-w-lg space-y-8">
      <div>
        <h2 className="text-lg font-bold mb-2">Hubungkan WhatsApp</h2>
        <WaConnect />
        <div className="mt-4 text-xs text-slate-400 space-y-1.5">
          <p>Yang dikirim otomatis dari nomormu:</p>
          <p>✅ Konfirmasi pembayaran ke pembeli (plus link download untuk produk digital)</p>
          <p>🔔 Notifikasi pesanan baru ke nomormu sendiri</p>
          <p>⏰ Reminder otomatis ke pembeli yang belum menyelesaikan pembayaran (1 jam)</p>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2">🤖 Chatbot WA</h2>
        <p className="text-sm text-slate-500 mb-4">
          Bot balas otomatis pertanyaan pembeli 1:1 pakai data katalog produk, order, dan Basis Pengetahuan
          tokomu — tidak pernah mengarang harga/stok. Kalau bot tidak yakin, percakapan otomatis diteruskan ke
          kamu dan kamu dapat notifikasi WA.
        </p>
        <WaBotSettingsForm
          waPersonaPrompt={store.waPersonaPrompt ?? ""}
          waAutoReplyEnabled={store.waAutoReplyEnabled}
          waActiveDays={store.waActiveDays}
          waActiveHoursStart={store.waActiveHoursStart ?? ""}
          waActiveHoursEnd={store.waActiveHoursEnd ?? ""}
        />
      </div>
    </div>
  );

  const knowledgePanel = (
    <div className="max-w-2xl">
      <p className="text-sm text-slate-500 mb-6">
        Topik tanya-jawab tambahan untuk chatbot WA-mu (cara pesan, kebijakan retur, jam operasional, dll).
        Cukup teks — foto produk untuk balasan bot sudah otomatis diambil dari katalog aktifmu.
      </p>
      <KnowledgeList items={knowledgeItems} />
    </div>
  );

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
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

      <SettingsTabs
        tabs={[
          { key: "umum", label: "Umum" },
          { key: "chatbot", label: "Chatbot WA" },
          { key: "knowledge", label: "Basis Pengetahuan" },
        ]}
        panels={{ umum: umumPanel, chatbot: chatbotPanel, knowledge: knowledgePanel }}
      />
    </div>
  );
}
