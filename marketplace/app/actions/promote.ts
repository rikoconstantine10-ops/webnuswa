"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { storeBalance } from "@/lib/ledger";

async function settingNumber(key: string, fallback: number): Promise<number> {
  const s = await db.setting.findUnique({ where: { key } });
  const v = s ? parseFloat(s.value) : NaN;
  return Number.isFinite(v) ? v : fallback;
}

// Boost produk agar tampil prioritas. Biaya dipotong dari saldo aktif penjual.
export async function boostProductAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const { store } = await requireSeller();
  const productId = String(formData.get("productId") ?? "");
  const days = Math.max(1, Math.min(30, parseInt(String(formData.get("days") ?? "7"), 10) || 7));
  const product = await db.product.findFirst({ where: { id: productId, storeId: store.id } });
  if (!product) return { error: "Produk tidak ditemukan" };

  const perDay = await settingNumber("boost_price_per_day", 2000);
  const cost = perDay * days;
  const balance = await storeBalance(store.id);
  if (balance < cost) return { error: `Saldo tidak cukup. Butuh Rp${cost.toLocaleString("id-ID")}, saldo Rp${balance.toLocaleString("id-ID")}` };

  const base = product.boostedUntil && product.boostedUntil > new Date() ? product.boostedUntil.getTime() : Date.now();
  await db.$transaction([
    db.ledgerEntry.create({
      data: { storeId: store.id, type: "BOOST_FEE", amount: -cost, status: "AVAILABLE", note: `Boost ${product.name} ${days} hari` },
    }),
    db.product.update({ where: { id: productId }, data: { boostedUntil: new Date(base + days * 86400000) } }),
  ]);
  revalidatePath("/dashboard/products");
  return { ok: true };
}

// Langganan paket PRO (fee lebih rendah). Biaya dipotong dari saldo aktif.
export async function subscribeProAction(
  _prev: { error?: string; ok?: boolean },
  _formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const { store } = await requireSeller();
  const price = await settingNumber("pro_monthly_price", 49000);
  const balance = await storeBalance(store.id);
  if (balance < price) return { error: `Saldo tidak cukup untuk langganan PRO (Rp${price.toLocaleString("id-ID")}).` };

  const base = store.planUntil && store.planUntil > new Date() ? store.planUntil.getTime() : Date.now();
  await db.$transaction([
    db.ledgerEntry.create({
      data: { storeId: store.id, type: "SUBSCRIPTION_FEE", amount: -price, status: "AVAILABLE", note: "Langganan PRO 30 hari" },
    }),
    db.store.update({ where: { id: store.id }, data: { plan: "PRO", planUntil: new Date(base + 30 * 86400000) } }),
  ]);
  revalidatePath("/dashboard/subscription");
  return { ok: true };
}
