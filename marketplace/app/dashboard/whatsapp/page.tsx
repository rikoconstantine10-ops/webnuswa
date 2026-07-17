import { requireSeller } from "@/lib/auth";
import WaConnect from "@/components/WaConnect";
import WaBotSettingsForm from "@/components/WaBotSettingsForm";

export const dynamic = "force-dynamic";

export default async function WhatsappPage() {
  const { store } = await requireSeller();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-extrabold mb-2">WhatsApp Toko</h1>
      <p className="text-sm text-slate-500 mb-6">
        Layanan notifikasi WhatsApp gratis dari platform — pakai nomor WA-mu sendiri.
      </p>
      <WaConnect />
      <div className="mt-6 text-xs text-slate-400 space-y-1.5">
        <p>Yang dikirim otomatis dari nomormu:</p>
        <p>✅ Konfirmasi pembayaran ke pembeli (plus link download untuk produk digital)</p>
        <p>🔔 Notifikasi pesanan baru ke nomormu sendiri</p>
        <p>⏰ Reminder otomatis ke pembeli yang belum menyelesaikan pembayaran (1 jam)</p>
        <p className="pt-2">
          Saran: gunakan nomor khusus toko (bukan nomor pribadi utama), dan pastikan
          HP-nya tetap online sesekali agar sesi tetap sehat.
        </p>
      </div>

      <hr className="my-8 border-slate-100" />

      <h2 className="text-xl font-extrabold mb-2">🤖 Chatbot WA</h2>
      <p className="text-sm text-slate-500 mb-4">
        Bot balas otomatis pertanyaan pembeli 1:1 pakai data katalog produk, order, dan
        Basis Pengetahuan tokomu — tidak pernah mengarang harga/stok. Kalau bot tidak yakin,
        percakapan otomatis diteruskan ke kamu (mode Manual) dan kamu dapat notifikasi WA.
      </p>
      <WaBotSettingsForm
        waPersonaPrompt={store.waPersonaPrompt ?? ""}
        waAutoReplyEnabled={store.waAutoReplyEnabled}
        waActiveDays={store.waActiveDays}
        waActiveHoursStart={store.waActiveHoursStart ?? ""}
        waActiveHoursEnd={store.waActiveHoursEnd ?? ""}
      />
    </div>
  );
}
