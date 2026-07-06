import { db } from "./db";
import { createDisbursement, autoPayoutEnabled, mapDisbursementStatus, type DisburseResult } from "./disbursement";
import { logError } from "./errors";

// Kembalikan dana withdrawal yang gagal ke saldo aktif seller (idempotent per withdrawal).
async function refundWithdrawal(withdrawalId: string, storeId: string, amount: number, reason: string) {
  const already = await db.ledgerEntry.findFirst({
    where: { storeId, type: "ADJUSTMENT", note: { contains: withdrawalId } },
  });
  if (already) return;
  await db.ledgerEntry.create({
    data: {
      storeId,
      type: "ADJUSTMENT",
      amount, // kredit balik
      status: "AVAILABLE",
      note: `Refund penarikan gagal (${withdrawalId}): ${reason}`.slice(0, 190),
    },
  });
}

// Coba cairkan otomatis sebuah withdrawal PENDING. Aman dipanggil sekali saat request.
export async function processWithdrawalPayout(withdrawalId: string): Promise<void> {
  if (!autoPayoutEnabled()) return;
  const w = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!w || w.status !== "PENDING") return;

  // Tandai sedang diproses supaya tak diproses ganda.
  await db.withdrawal.update({ where: { id: w.id }, data: { status: "PROCESSING" } });

  const result = await createDisbursement({
    amount: w.amount,
    bankName: w.bankName,
    accountNumber: w.bankAccountNumber,
    accountName: w.bankAccountName,
    ref: w.id,
  }).catch((e): DisburseResult => {
    logError("disbursement.create", e, { withdrawalId: w.id });
    return { ok: false, provider: "flip", error: "exception" };
  });

  if (!result.ok && result.status !== "PROCESSING") {
    // Gagal buat pencairan → balik ke manual (biar admin proses), catat alasan.
    await db.withdrawal.update({
      where: { id: w.id },
      data: { status: "PENDING", provider: result.provider, failureReason: result.error ?? "auto-payout gagal", autoProcessed: false },
    });
    return;
  }

  await db.withdrawal.update({
    where: { id: w.id },
    data: {
      status: result.status === "PAID" ? "PAID" : "PROCESSING",
      provider: result.provider,
      providerRef: result.providerRef || null,
      autoProcessed: true,
      processedAt: result.status === "PAID" ? new Date() : null,
    },
  });
}

// Terapkan status dari webhook provider (idempotent). storeId+amount untuk refund bila gagal.
export async function settleDisbursement(providerRef: string, rawStatus: string): Promise<{ ok: boolean; note: string }> {
  const w = await db.withdrawal.findUnique({ where: { providerRef } });
  if (!w) return { ok: false, note: "withdrawal tidak ditemukan" };
  if (["PAID", "REJECTED", "FAILED"].includes(w.status) && w.status !== "PROCESSING") {
    return { ok: true, note: "sudah final" };
  }
  const status = mapDisbursementStatus(rawStatus);
  if (status === "PROCESSING") return { ok: true, note: "masih diproses" };

  if (status === "PAID") {
    await db.withdrawal.update({ where: { id: w.id }, data: { status: "PAID", processedAt: new Date() } });
    return { ok: true, note: "ditandai PAID" };
  }
  // FAILED → refund saldo & tandai gagal.
  await refundWithdrawal(w.id, w.storeId, w.amount, "callback gagal");
  await db.withdrawal.update({ where: { id: w.id }, data: { status: "FAILED", failureReason: rawStatus } });
  return { ok: true, note: "ditandai FAILED + refund" };
}
