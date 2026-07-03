import { db } from "./db";

export async function getPlatformFeePercent(): Promise<number> {
  const setting = await db.setting.findUnique({ where: { key: "platform_fee_percent" } });
  const value = setting ? parseFloat(setting.value) : NaN;
  return Number.isFinite(value) ? value : 5;
}

export async function storeBalance(storeId: string): Promise<number> {
  const agg = await db.ledgerEntry.aggregate({
    where: { storeId },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}
