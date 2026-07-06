"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import { storeBalance } from "@/lib/ledger";
import { audit } from "@/lib/audit";
import { canWithdraw } from "@/lib/trust";
import { processWithdrawalPayout } from "@/lib/payout";

// Parse koordinat lat/long dari form. Kosong/invalid → null. Rentang wajar dunia dijaga.
function parseCoord(v: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(v ?? "").trim());
  if (!Number.isFinite(n) || n < -180 || n > 180 || n === 0) return null;
  return n;
}

export async function markProcessingAction(formData: FormData) {
  const { store } = await requireSeller();
  const orderId = String(formData.get("orderId"));
  const order = await db.order.findFirst({
    where: { id: orderId, storeId: store.id, status: "PAID" },
  });
  if (!order) return;
  await db.order.update({ where: { id: orderId }, data: { status: "PROCESSING" } });
  revalidatePath("/dashboard/orders");
}

export async function shipOrderAction(formData: FormData) {
  const { store } = await requireSeller();
  const orderId = String(formData.get("orderId"));
  const courier = String(formData.get("courier") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();

  const order = await db.order.findFirst({
    where: { id: orderId, storeId: store.id, status: { in: ["PAID", "PROCESSING"] } },
  });
  if (!order || !trackingNumber) return;

  await db.order.update({
    where: { id: orderId },
    data: { status: "SHIPPED", courier: courier || null, trackingNumber },
  });
  revalidatePath("/dashboard/orders");
}

export async function updateStoreAction(
  _prev: { error?: string; saved?: boolean },
  formData: FormData
): Promise<{ error?: string; saved?: boolean }> {
  const { store } = await requireSeller();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3) return { error: "Nama toko minimal 3 karakter" };

  await db.store.update({
    where: { id: store.id },
    data: {
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      bannerUrl: String(formData.get("bannerUrl") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").replace(/\D/g, "") || null,
      bankName: String(formData.get("bankName") ?? "").trim() || null,
      bankAccountNumber: String(formData.get("bankAccountNumber") ?? "").trim() || null,
      bankAccountName: String(formData.get("bankAccountName") ?? "").trim() || null,
      metaPixelId: String(formData.get("metaPixelId") ?? "").replace(/\D/g, "") || null,
      metaCapiToken: String(formData.get("metaCapiToken") ?? "").trim() || null,
      originAreaId: String(formData.get("originAreaId") ?? "").trim() || null,
      originPostalCode: String(formData.get("originPostalCode") ?? "").trim() || null,
      originAddress: String(formData.get("originAddress") ?? "").trim() || null,
      originContactName: String(formData.get("originContactName") ?? "").trim() || null,
      originContactPhone: String(formData.get("originContactPhone") ?? "").replace(/\D/g, "") || null,
      originLat: parseCoord(formData.get("originLat")),
      originLng: parseCoord(formData.get("originLng")),
    },
  });
  revalidatePath("/dashboard/store");
  return { saved: true };
}

export async function requestWithdrawalAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const { store } = await requireSeller();
  const amount = parseInt(String(formData.get("amount")), 10);
  if (!Number.isFinite(amount) || amount < 10000) {
    return { error: "Minimal penarikan Rp 10.000" };
  }
  if (!store.bankName || !store.bankAccountNumber || !store.bankAccountName) {
    return { error: "Lengkapi data rekening bank di Pengaturan Toko dulu" };
  }

  // Progressive trust: batasi penarikan penjual baru sebelum ada pemenuhan nyata.
  const trust = await canWithdraw(store);
  if (!trust.ok) return { error: trust.reason };

  const balance = await storeBalance(store.id);
  if (amount > balance) return { error: "Saldo tidak mencukupi" };

  // Debit saldo saat request (dana di-hold); dikembalikan jika ditolak/gagal.
  const [withdrawal] = await db.$transaction([
    db.withdrawal.create({
      data: {
        storeId: store.id,
        amount,
        bankName: store.bankName,
        bankAccountNumber: store.bankAccountNumber,
        bankAccountName: store.bankAccountName,
      },
    }),
    db.ledgerEntry.create({
      data: {
        storeId: store.id,
        type: "WITHDRAWAL_DEBIT",
        amount: -amount,
        note: "Request penarikan dana",
      },
    }),
  ]);
  await audit(store.name, "WITHDRAWAL_REQUESTED", `Rp${amount} → ${store.bankName} ${store.bankAccountNumber}`);

  // Pencairan otomatis (bila provider disbursement aktif). Best-effort: gagal → tetap manual.
  await processWithdrawalPayout(withdrawal.id).catch(() => {});

  redirect("/dashboard/withdrawals");
}
