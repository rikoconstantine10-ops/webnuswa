import { db } from "./db";

export async function getPlatformFeePercent(): Promise<number> {
  const setting = await db.setting.findUnique({ where: { key: "platform_fee_percent" } });
  const value = setting ? parseFloat(setting.value) : NaN;
  return Number.isFinite(value) ? value : 5;
}

async function settingNumber(key: string, fallback: number): Promise<number> {
  const s = await db.setting.findUnique({ where: { key } });
  const v = s ? parseFloat(s.value) : NaN;
  return Number.isFinite(v) ? v : fallback;
}

// Fee platform efektif untuk sebuah toko: lebih rendah bila langganan PRO aktif.
export async function getStoreFeePercent(storeId: string): Promise<number> {
  const store = await db.store.findUnique({ where: { id: storeId }, select: { plan: true, planUntil: true } });
  const proActive = store?.plan === "PRO" && store.planUntil && store.planUntil > new Date();
  if (proActive) return settingNumber("platform_fee_percent_pro", 3);
  return getPlatformFeePercent();
}

// Saldo yang bisa ditarik: hanya entri AVAILABLE (dana escrow yang sudah dirilis).
export async function storeBalance(storeId: string): Promise<number> {
  const agg = await db.ledgerEntry.aggregate({
    where: { storeId, status: "AVAILABLE" },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

// Saldo tertahan (escrow): pesanan sudah dibayar tapi belum selesai.
export async function storeHeldBalance(storeId: string): Promise<number> {
  const agg = await db.ledgerEntry.aggregate({
    where: { storeId, status: "HELD" },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

// Rilis dana escrow sebuah order ke saldo aktif seller (dipanggil saat order selesai).
export async function releaseOrderFunds(orderId: string): Promise<void> {
  await db.$transaction([
    db.ledgerEntry.updateMany({
      where: { orderId, status: "HELD" },
      data: { status: "AVAILABLE" },
    }),
    db.order.update({ where: { id: orderId }, data: { fundsReleased: true } }),
  ]);
}

// Batalkan dana escrow (refund): entri HELD di-void agar tak pernah masuk saldo aktif.
export async function voidOrderFunds(orderId: string): Promise<void> {
  await db.ledgerEntry.updateMany({
    where: { orderId, status: "HELD" },
    data: { status: "VOID" },
  });
}
