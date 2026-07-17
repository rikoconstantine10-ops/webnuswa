"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify, randomSuffix } from "@/lib/slug";
import { notifyWithdrawalPaid } from "@/lib/notify";
import { saveProviderTiers } from "@/lib/kieai";

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

// Setujui banyak toko PENDING sekaligus (dipilih via checkbox di /admin/sellers).
export async function bulkApproveSellersAction(formData: FormData) {
  const admin = await requireAdmin();
  const storeIds = formData.getAll("storeIds").map(String);
  if (storeIds.length === 0) return;

  const res = await db.store.updateMany({
    where: { id: { in: storeIds }, status: "PENDING" },
    data: { status: "ACTIVE" },
  });
  await audit(admin.email, "STORE_ACTIVE", `${res.count} toko disetujui sekaligus`);
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

  // Generate Foto dan Generate Caption punya API key, base URL, dan model masing-masing.
  // Kosongkan API key = biarkan yang sudah tersimpan tidak berubah (hindari kehapus tidak
  // sengaja saat admin cuma mau ganti model/base URL atau fee). Base URL/model boleh disimpan
  // kosong (fallback ke default di lib/kieai.ts).
  const aiImageApiKey = String(formData.get("aiImageApiKey") ?? "").trim();
  const aiImageBaseUrl = String(formData.get("aiImageBaseUrl") ?? "").trim();
  const aiImageModel = String(formData.get("aiImageModel") ?? "").trim();
  const aiCaptionApiKey = String(formData.get("aiCaptionApiKey") ?? "").trim();
  const aiCaptionBaseUrl = String(formData.get("aiCaptionBaseUrl") ?? "").trim();
  const aiCaptionModel = String(formData.get("aiCaptionModel") ?? "").trim();

  const settingWrites: Promise<unknown>[] = [
    db.setting.upsert({ where: { key: "ai_image_base_url" }, create: { key: "ai_image_base_url", value: aiImageBaseUrl }, update: { value: aiImageBaseUrl } }),
    db.setting.upsert({ where: { key: "ai_image_model" }, create: { key: "ai_image_model", value: aiImageModel }, update: { value: aiImageModel } }),
    db.setting.upsert({ where: { key: "ai_caption_base_url" }, create: { key: "ai_caption_base_url", value: aiCaptionBaseUrl }, update: { value: aiCaptionBaseUrl } }),
    db.setting.upsert({ where: { key: "ai_caption_model" }, create: { key: "ai_caption_model", value: aiCaptionModel }, update: { value: aiCaptionModel } }),
  ];
  if (aiImageApiKey) {
    settingWrites.push(
      db.setting.upsert({ where: { key: "ai_image_api_key" }, create: { key: "ai_image_api_key", value: aiImageApiKey }, update: { value: aiImageApiKey } })
    );
  }
  if (aiCaptionApiKey) {
    settingWrites.push(
      db.setting.upsert({ where: { key: "ai_caption_api_key" }, create: { key: "ai_caption_api_key", value: aiCaptionApiKey }, update: { value: aiCaptionApiKey } })
    );
  }

  // Transkrip Suara — single provider (tidak pakai fallback 3-tingkat).
  const aiVoiceApiKey = String(formData.get("aiVoiceApiKey") ?? "").trim();
  const aiVoiceBaseUrl = String(formData.get("aiVoiceBaseUrl") ?? "").trim();
  const aiVoiceModel = String(formData.get("aiVoiceModel") ?? "").trim();
  settingWrites.push(
    db.setting.upsert({ where: { key: "ai_voice_base_url" }, create: { key: "ai_voice_base_url", value: aiVoiceBaseUrl }, update: { value: aiVoiceBaseUrl } }),
    db.setting.upsert({ where: { key: "ai_voice_model" }, create: { key: "ai_voice_model", value: aiVoiceModel }, update: { value: aiVoiceModel } })
  );
  if (aiVoiceApiKey) {
    settingWrites.push(
      db.setting.upsert({ where: { key: "ai_voice_api_key" }, create: { key: "ai_voice_api_key", value: aiVoiceApiKey }, update: { value: aiVoiceApiKey } })
    );
  }

  // Global System Prompt — aturan keras chatbot WA, berlaku semua toko, tak bisa ditimpa persona seller.
  const waGlobalPrompt = String(formData.get("waGlobalSystemPrompt") ?? "").trim();
  settingWrites.push(
    db.setting.upsert({
      where: { key: "wa_global_system_prompt" },
      create: { key: "wa_global_system_prompt", value: waGlobalPrompt },
      update: { value: waGlobalPrompt },
    })
  );

  await Promise.all(settingWrites);
  if (aiImageApiKey || aiCaptionApiKey || aiVoiceApiKey) {
    await audit(admin.email, "SETTINGS_AI_KEY_CHANGED", "API key AI diperbarui");
  }

  // Generate Foto, Generate Video, Chatbot WA — masing-masing 3 slot (Utama/Cadangan 1/Cadangan 2).
  async function readTierSlots(prefix: string) {
    return [0, 1, 2].map((i) => ({
      apiKey: String(formData.get(`${prefix}ApiKey${i}`) ?? "").trim(),
      baseUrl: String(formData.get(`${prefix}BaseUrl${i}`) ?? "").trim(),
      model: String(formData.get(`${prefix}Model${i}`) ?? "").trim(),
    }));
  }
  await Promise.all([
    saveProviderTiers("image", await readTierSlots("aiImageTier")),
    saveProviderTiers("video", await readTierSlots("aiVideoTier")),
    saveProviderTiers("chat", await readTierSlots("aiChatTier")),
  ]);

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

// Setujui/tolak banyak produk PENDING moderasi sekaligus (dipilih via checkbox di /admin/moderation).
export async function bulkModerateProductsAction(formData: FormData) {
  const admin = await requireAdmin();
  const productIds = formData.getAll("productIds").map(String);
  const decision = String(formData.get("decision") ?? "");
  if (productIds.length === 0 || !["APPROVE", "REJECT"].includes(decision)) return;

  const res = await db.product.updateMany({
    where: { id: { in: productIds }, moderation: "PENDING" },
    data:
      decision === "APPROVE"
        ? { moderation: "APPROVED" }
        : { moderation: "REJECTED", active: false },
  });
  await audit(admin.email, `PRODUCT_BULK_${decision}`, `${res.count} produk`);
  revalidatePath("/admin/moderation");
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

export async function toggleStoreAiAction(formData: FormData) {
  const admin = await requireAdmin();
  const storeId = String(formData.get("storeId"));
  const enabled = String(formData.get("enabled")) === "true";
  const store = await db.store.update({
    where: { id: storeId },
    data: { aiGenerationEnabled: enabled },
  });
  await audit(admin.email, enabled ? "STORE_AI_ENABLED" : "STORE_AI_DISABLED", `Toko: ${store.name}`);
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
