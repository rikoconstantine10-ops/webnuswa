"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const VALID_REASONS = ["SPAM", "PROHIBITED", "COUNTERFEIT", "SCAM", "OTHER"];

// Laporan produk oleh pembeli/pengunjung (login opsional). Anti-spam: 1 laporan
// per produk per pelapor per hari.
export async function reportProductAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const productId = String(formData.get("productId") ?? "");
  const reason = String(formData.get("reason") ?? "OTHER").toUpperCase();
  const detail = String(formData.get("detail") ?? "").trim().slice(0, 500);
  if (!VALID_REASONS.includes(reason)) return { error: "Alasan tidak valid" };

  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, storeId: true } });
  if (!product) return { error: "Produk tidak ditemukan" };

  const user = await currentUser();
  const reporterEmail = user?.email ?? null;

  // Cegah spam laporan dari akun yang sama pada produk yang sama dalam 24 jam.
  if (reporterEmail) {
    const recent = await db.productReport.findFirst({
      where: { productId, reporterEmail, createdAt: { gt: new Date(Date.now() - 86400000) } },
    });
    if (recent) return { ok: true }; // sudah dilaporkan, tetap balas sukses
  }

  await db.productReport.create({
    data: { productId, storeId: product.storeId, reason, detail: detail || null, reporterEmail },
  });
  return { ok: true };
}
