// Template awal chatbot WA untuk toko baru — persona default (bisa diedit seller) +
// beberapa topik Knowledge Base starter (bisa diedit/dihapus/ditambah seller sendiri).
// Tujuannya supaya seller baru tidak mulai dari kosong sama sekali.
import { db } from "./db";

const STARTER_KNOWLEDGE: Array<{ title: string; answer: string }> = [
  {
    title: "Bagaimana cara pesan?",
    answer: "Pilih produk yang kamu mau di halaman toko kami, lalu checkout langsung dari sana. Setelah pembayaran berhasil, pesanan otomatis kami proses.",
  },
  {
    title: "Metode pembayaran apa saja yang tersedia?",
    answer: "Tersedia transfer bank, e-wallet, dan QRIS. Untuk beberapa produk juga tersedia COD tergantung lokasi.",
  },
  {
    title: "Berapa lama pengiriman?",
    answer: "Estimasi pengiriman sekitar 1-3 hari kerja, tergantung lokasi dan kurir yang kamu pilih saat checkout.",
  },
  {
    title: "Apakah bisa retur atau refund?",
    answer: "Bisa. Hubungi kami maksimal 2x24 jam setelah barang diterima kalau ada kendala kualitas atau salah kirim.",
  },
];

function defaultPersona(storeName: string): string {
  return `Kamu adalah admin toko "${storeName}" di WhatsApp. Gaya bicara ramah, sopan, dan to the point. Sapa pembeli dengan "Kak". Boleh pakai emoji secukupnya, jangan berlebihan.`;
}

export async function seedWaOnboarding(storeId: string, storeName: string) {
  await db.store.update({ where: { id: storeId }, data: { waPersonaPrompt: defaultPersona(storeName) } });
  await db.waKnowledgeItem.createMany({
    data: STARTER_KNOWLEDGE.map((k, i) => ({ storeId, title: k.title, answer: k.answer, sortOrder: i })),
  });
}
