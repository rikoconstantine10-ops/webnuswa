// Kredit AI berbayar — dibeli lewat paket (dikelola admin), dipakai setelah kuota
// gratis bulanan seller habis. Tidak hangus/expire. Saldo = SUM(AiCreditEntry.amount).
import { db } from "./db";
import { checkAiQuota } from "./kieai";

export async function getAiCreditBalance(storeId: string): Promise<number> {
  const agg = await db.aiCreditEntry.aggregate({ where: { storeId }, _sum: { amount: true } });
  return agg._sum.amount ?? 0;
}

export async function listActiveAiCreditPackages() {
  return db.aiCreditPackage.findMany({ where: { active: true }, orderBy: { sort: "asc" } });
}

// Boleh generate bila kuota gratis bulanan masih ada ATAU saldo kredit berbayar > 0.
export async function canGenerate(storeId: string): Promise<{
  ok: boolean;
  freeUsed: number;
  freeLimit: number;
  creditBalance: number;
}> {
  const [quota, creditBalance] = await Promise.all([checkAiQuota(storeId), getAiCreditBalance(storeId)]);
  return { ok: quota.ok || creditBalance > 0, freeUsed: quota.used, freeLimit: quota.limit, creditBalance };
}

// Idempoten: hanya proses purchase yang masih PENDING (webhook Louvin bisa retry).
export async function markAiCreditPurchasePaid(purchaseId: string) {
  const purchase = await db.aiCreditPurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase || purchase.status !== "PENDING") return purchase;

  await db.$transaction([
    db.aiCreditPurchase.update({ where: { id: purchaseId }, data: { status: "PAID", paidAt: new Date() } }),
    db.aiCreditEntry.create({
      data: {
        storeId: purchase.storeId,
        type: "PURCHASE",
        amount: purchase.credits,
        note: `Topup ${purchase.packageName}`,
      },
    }),
  ]);
  return purchase;
}

// Catat 1x pemakaian setelah generate berhasil. Kalau kuota gratis bulan ini sudah
// habis (dicek SEBELUM baris AiGeneration ini dibuat), potong 1 kredit berbayar.
export async function consumeGeneration(storeId: string, type: "IMAGE" | "CAPTION"): Promise<void> {
  const quota = await checkAiQuota(storeId);
  await db.aiGeneration.create({ data: { storeId, type } });
  if (!quota.ok) {
    await db.aiCreditEntry.create({
      data: { storeId, type: "CONSUME", amount: -1, note: `Generate ${type === "IMAGE" ? "foto" : "caption"}` },
    });
  }
}
