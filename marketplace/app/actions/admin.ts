"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify, randomSuffix } from "@/lib/slug";
import { notifyWithdrawalPaid } from "@/lib/notify";

export async function markAdminNotificationReadAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.adminNotification.updateMany({ where: { id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin", "layout");
}

export async function markAllAdminNotificationsReadAction() {
  await requireAdmin();
  await db.adminNotification.updateMany({ where: { readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin", "layout");
}

export async function setStoreStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const storeId = String(formData.get("storeId"));
  const status = String(formData.get("status"));
  if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(status)) return;

  const store = await db.store.update({ where: { id: storeId }, data: { status } });
  await audit(admin.email, `STORE_${status}`, `Toko: ${store.name} (${store.slug})`);
  revalidatePath("/admin/sellers");
}

// Voucher platform (berlaku di semua toko; storeId null). Diskon ditanggung platform.
export async function createPlatformVoucherAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const type = String(formData.get("type") ?? "PERCENT");
  const value = parseInt(String(formData.get("value") ?? "0"), 10);
  const minSpend = parseInt(String(formData.get("minSpend") ?? "0"), 10) || 0;
  const maxDiscount = parseInt(String(formData.get("maxDiscount") ?? "0"), 10) || 0;
  const quota = parseInt(String(formData.get("quota") ?? "0"), 10) || 0;
  const endsAt = String(formData.get("endsAt") ?? "");
  if (code.length < 3) return { error: "Kode minimal 3 karakter" };
  if (!["PERCENT", "FIXED"].includes(type) || !Number.isFinite(value) || value < 1) return { error: "Nilai tidak valid" };
  if (type === "PERCENT" && value > 100) return { error: "Persentase maksimal 100" };
  if (await db.voucher.findUnique({ where: { code } })) return { error: "Kode sudah dipakai" };

  await db.voucher.create({
    data: { code, storeId: null, type, value, minSpend, maxDiscount, quota, endsAt: endsAt ? new Date(endsAt) : null },
  });
  revalidatePath("/admin/vouchers");
  return { ok: true };
}

export async function toggleAdminVoucherAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const v = await db.voucher.findUnique({ where: { id } });
  if (v && v.storeId === null) await db.voucher.update({ where: { id }, data: { active: !v.active } });
  revalidatePath("/admin/vouchers");
}

export async function deleteAdminVoucherAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const v = await db.voucher.findUnique({ where: { id } });
  if (v && v.storeId === null) await db.voucher.delete({ where: { id } });
  revalidatePath("/admin/vouchers");
}

// Tandai komisi afiliasi seorang user sebagai sudah dibayar.
export async function markAffiliatePaidAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  const res = await db.affiliateCommission.updateMany({
    where: { affiliateUserId: userId, status: "AVAILABLE" },
    data: { status: "PAID" },
  });
  await audit(admin.email, "AFFILIATE_PAID", `User ${userId}, ${res.count} komisi`);
  revalidatePath("/admin/affiliates");
}

export async function processWithdrawalAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")); // APPROVED | PAID | REJECTED
  const withdrawal = await db.withdrawal.findUnique({
    where: { id },
    include: { store: { select: { name: true } } },
  });
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
    await audit(admin.email, "WITHDRAWAL_REJECTED", `${withdrawal.store.name}: Rp${withdrawal.amount}`);
  } else if (decision === "APPROVED" && withdrawal.status === "PENDING") {
    await db.withdrawal.update({ where: { id }, data: { status: "APPROVED" } });
    await audit(admin.email, "WITHDRAWAL_APPROVED", `${withdrawal.store.name}: Rp${withdrawal.amount}`);
  } else if (decision === "PAID" && ["PENDING", "APPROVED"].includes(withdrawal.status)) {
    await db.withdrawal.update({
      where: { id },
      data: { status: "PAID", processedAt: new Date() },
    });
    await audit(
      admin.email,
      "WITHDRAWAL_PAID",
      `${withdrawal.store.name}: Rp${withdrawal.amount} → ${withdrawal.bankName} ${withdrawal.bankAccountNumber}`
    );
    notifyWithdrawalPaid(id);
  }
  revalidatePath("/admin/withdrawals");
}

export async function updateSettingsAction(
  _prev: { saved?: boolean; error?: string },
  formData: FormData
): Promise<{ saved?: boolean; error?: string }> {
  const admin = await requireAdmin();
  const fee = parseFloat(String(formData.get("platformFeePercent")));
  if (!Number.isFinite(fee) || fee < 0 || fee > 50) {
    return { error: "Fee harus antara 0 dan 50 persen" };
  }

  await db.setting.upsert({
    where: { key: "platform_fee_percent" },
    create: { key: "platform_fee_percent", value: String(fee) },
    update: { value: String(fee) },
  });
  await audit(admin.email, "SETTINGS_FEE_CHANGED", `Platform fee → ${fee}%`);

  // Kosongkan field = biarkan API key yang sudah tersimpan tidak berubah (hindari
  // kehapus tidak sengaja saat admin cuma mau ganti fee).
  const kieApiKey = String(formData.get("kieApiKey") ?? "").trim();
  if (kieApiKey) {
    await db.setting.upsert({
      where: { key: "kie_api_key" },
      create: { key: "kie_api_key", value: kieApiKey },
      update: { value: kieApiKey },
    });
    await audit(admin.email, "SETTINGS_AI_KEY_CHANGED", "Kie.ai API key diperbarui");
  }

  revalidatePath("/admin/settings");
  return { saved: true };
}

// ===== Kategori =====

export async function createCategoryAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return;

  let slug = slugify(name);
  if (await db.category.findUnique({ where: { slug } })) slug = `${slug}-${randomSuffix()}`;
  await db.category.create({ data: { name, slug } });
  await audit(admin.email, "CATEGORY_CREATED", name);
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) return;

  await db.$transaction([
    db.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
    db.category.delete({ where: { id } }),
  ]);
  await audit(admin.email, "CATEGORY_DELETED", cat.name);
  revalidatePath("/admin/categories");
}

// ===== Moderasi produk =====

export async function takedownProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const product = await db.product.findUnique({
    where: { id },
    include: { store: { select: { name: true } } },
  });
  if (!product) return;

  await db.product.update({ where: { id }, data: { active: false } });
  await audit(admin.email, "PRODUCT_TAKEDOWN", `${product.name} (toko: ${product.store.name})`);
  revalidatePath(`/admin/sellers/${product.storeId}`);
}

// ===== Pengumuman =====

export async function createAnnouncementAction(formData: FormData) {
  const admin = await requireAdmin();
  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 5) return;

  await db.announcement.create({ data: { message } });
  await audit(admin.email, "ANNOUNCEMENT_CREATED", message.slice(0, 80));
  revalidatePath("/admin/announcements");
}

export async function toggleAnnouncementAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const a = await db.announcement.findUnique({ where: { id } });
  if (!a) return;
  await db.announcement.update({ where: { id }, data: { active: !a.active } });
  revalidatePath("/admin/announcements");
}

export async function deleteAnnouncementAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await db.announcement.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/announcements");
}

// ===== Kepercayaan: verifikasi toko =====

export async function setStoreVerifiedAction(formData: FormData) {
  const admin = await requireAdmin();
  const storeId = String(formData.get("storeId"));
  const verified = String(formData.get("verified")) === "true";
  const store = await db.store.update({
    where: { id: storeId },
    data: { verified, verifiedAt: verified ? new Date() : null },
  });
  await audit(admin.email, verified ? "STORE_VERIFIED" : "STORE_UNVERIFIED", `Toko: ${store.name}`);
  revalidatePath(`/admin/sellers/${storeId}`);
  revalidatePath("/admin/sellers");
}

// ===== Laporan produk =====

// Tinjau laporan: "dismiss" (abaikan) atau "takedown" (nonaktifkan produk + tandai ditindak).
export async function resolveReportAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")); // DISMISS | TAKEDOWN | APPROVE
  const report = await db.productReport.findUnique({ where: { id }, include: { product: true } });
  if (!report) return;

  if (decision === "TAKEDOWN") {
    await db.$transaction([
      db.product.update({ where: { id: report.productId }, data: { active: false, moderation: "REJECTED" } }),
      db.productReport.update({ where: { id }, data: { status: "ACTIONED" } }),
    ]);
    await audit(admin.email, "REPORT_TAKEDOWN", `${report.product.name} — ${report.reason}`);
  } else if (decision === "APPROVE") {
    // Produk aman → loloskan moderasi & tandai laporan ditinjau.
    await db.$transaction([
      db.product.update({ where: { id: report.productId }, data: { moderation: "APPROVED" } }),
      db.productReport.update({ where: { id }, data: { status: "REVIEWED" } }),
    ]);
    await audit(admin.email, "REPORT_APPROVED", `${report.product.name}`);
  } else {
    await db.productReport.update({ where: { id }, data: { status: "DISMISSED" } });
    await audit(admin.email, "REPORT_DISMISSED", `${report.product.name}`);
  }
  revalidatePath("/admin/reports");
}
