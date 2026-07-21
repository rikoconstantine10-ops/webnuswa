import { db } from "./db";

// Jumlah minimal pesanan selesai agar penjual baru boleh menarik dana
// (progressive trust: cegah penipu cairkan uang sebelum ada pemenuhan nyata).
const MIN_COMPLETED_FOR_WITHDRAWAL = 1;

// Boleh menarik dana bila toko sudah terverifikasi ATAU punya >=1 pesanan selesai.
export async function canWithdraw(store: { id: string; verified: boolean }): Promise<{ ok: boolean; reason?: string }> {
  if (store.verified) return { ok: true };
  const completed = await db.order.count({ where: { storeId: store.id, status: "COMPLETED" } });
  if (completed >= MIN_COMPLETED_FOR_WITHDRAWAL) return { ok: true };
  return {
    ok: false,
    reason:
      "Penarikan pertama tersedia setelah minimal 1 pesanan selesai, atau setelah tokomu terverifikasi. Ini melindungi pembeli & penjual dari penyalahgunaan.",
  };
}

// Daftar kata terlarang default (barang ilegal/berbahaya). Bisa ditimpa via Setting `banned_keywords`.
const DEFAULT_BANNED = [
  "narkoba", "sabu", "ganja", "senjata api", "pistol", "amunisi",
  "obat terlarang", "miras oplosan", "ijazah palsu", "uang palsu",
  "data pribadi", "akun curian", "carding", "jual ginjal", "organ tubuh",
];

export async function getBannedKeywords(): Promise<string[]> {
  const s = await db.setting.findUnique({ where: { key: "banned_keywords" } });
  const extra = s?.value ? s.value.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean) : [];
  return [...DEFAULT_BANNED, ...extra];
}

// Mengembalikan kata terlarang pertama yang cocok, atau null bila aman.
export async function findProhibited(text: string): Promise<string | null> {
  const hay = text.toLowerCase();
  const banned = await getBannedKeywords();
  for (const w of banned) {
    if (w && hay.includes(w)) return w;
  }
  return null;
}
