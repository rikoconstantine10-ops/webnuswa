import { db } from "./db";

export type VoucherResult =
  | { ok: true; voucherId: string; discount: number; label: string }
  | { ok: false; message: string };

// Validasi & hitung diskon voucher untuk sebuah toko + subtotal (server-side).
// Voucher platform (storeId null) berlaku di semua toko; voucher toko harus cocok.
export async function validateVoucher(
  code: string,
  storeId: string,
  subtotal: number
): Promise<VoucherResult> {
  const clean = code.trim().toUpperCase();
  if (!clean) return { ok: false, message: "Kode voucher kosong" };

  const v = await db.voucher.findUnique({ where: { code: clean } });
  if (!v || !v.active) return { ok: false, message: "Voucher tidak ditemukan" };
  if (v.storeId && v.storeId !== storeId) return { ok: false, message: "Voucher tidak berlaku di toko ini" };

  const now = new Date();
  if (v.startsAt && now < v.startsAt) return { ok: false, message: "Voucher belum berlaku" };
  if (v.endsAt && now > v.endsAt) return { ok: false, message: "Voucher sudah kedaluwarsa" };
  if (v.quota > 0 && v.used >= v.quota) return { ok: false, message: "Kuota voucher habis" };
  if (subtotal < v.minSpend) {
    return { ok: false, message: `Minimal belanja Rp${v.minSpend.toLocaleString("id-ID")}` };
  }

  let discount = v.type === "PERCENT" ? Math.round((subtotal * v.value) / 100) : v.value;
  if (v.type === "PERCENT" && v.maxDiscount > 0) discount = Math.min(discount, v.maxDiscount);
  discount = Math.min(discount, subtotal); // diskon tak boleh melebihi subtotal

  const label = v.type === "PERCENT" ? `${v.value}%` : `Rp${v.value.toLocaleString("id-ID")}`;
  return { ok: true, voucherId: v.id, discount, label };
}

// Tambah pemakaian voucher (dipanggil saat order lunas).
export async function incrementVoucherUsage(voucherId: string): Promise<void> {
  await db.voucher.update({ where: { id: voucherId }, data: { used: { increment: 1 } } });
}
