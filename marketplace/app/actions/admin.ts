"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function setStoreStatusAction(formData: FormData) {
  await requireAdmin();
  const storeId = String(formData.get("storeId"));
  const status = String(formData.get("status"));
  if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(status)) return;

  await db.store.update({ where: { id: storeId }, data: { status } });
  revalidatePath("/admin/sellers");
}

export async function processWithdrawalAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")); // APPROVED | PAID | REJECTED
  const withdrawal = await db.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) return;

  if (decision === "REJECTED" && withdrawal.status === "PENDING") {
    // Kembalikan dana yang di-hold ke saldo seller.
    await db.$transaction([
      db.withdrawal.update({
        where: { id },
        data: { status: "REJECTED", processedAt: new Date() },
      }),
      db.ledgerEntry.create({
        data: {
          storeId: withdrawal.storeId,
          type: "ADJUSTMENT",
          amount: withdrawal.amount,
          note: `Refund penarikan ditolak (${id})`,
        },
      }),
    ]);
  } else if (decision === "APPROVED" && withdrawal.status === "PENDING") {
    await db.withdrawal.update({
      where: { id },
      data: { status: "APPROVED" },
    });
  } else if (decision === "PAID" && ["PENDING", "APPROVED"].includes(withdrawal.status)) {
    await db.withdrawal.update({
      where: { id },
      data: { status: "PAID", processedAt: new Date() },
    });
  }
  revalidatePath("/admin/withdrawals");
}

export async function updateSettingsAction(
  _prev: { saved?: boolean; error?: string },
  formData: FormData
): Promise<{ saved?: boolean; error?: string }> {
  await requireAdmin();
  const fee = parseFloat(String(formData.get("platformFeePercent")));
  if (!Number.isFinite(fee) || fee < 0 || fee > 50) {
    return { error: "Fee harus antara 0 dan 50 persen" };
  }

  await db.setting.upsert({
    where: { key: "platform_fee_percent" },
    create: { key: "platform_fee_percent", value: String(fee) },
    update: { value: String(fee) },
  });
  revalidatePath("/admin/settings");
  return { saved: true };
}
