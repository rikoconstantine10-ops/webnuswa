"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSeller, requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { createLouvinTransaction, extractTrxId, isPaymentTypeAllowed } from "@/lib/louvin";

export async function purchaseAiCreditPackageAction(formData: FormData) {
  const { store, user } = await requireSeller();
  const packageId = String(formData.get("packageId") ?? "");
  const paymentType = String(formData.get("paymentType") ?? "qris");

  const pkg = await db.aiCreditPackage.findFirst({ where: { id: packageId, active: true } });
  if (!pkg) redirect("/dashboard/ai-credits?error=Paket%20tidak%20ditemukan");
  if (!isPaymentTypeAllowed(paymentType, pkg.priceRupiah)) {
    redirect("/dashboard/ai-credits?error=Metode%20bayar%20tidak%20berlaku%20untuk%20nominal%20ini");
  }

  const trx = await createLouvinTransaction({
    amount: pkg.priceRupiah,
    payment_type: paymentType,
    customer_name: store.name,
    customer_email: user.email,
    description: `Topup ${pkg.credits} kredit AI (${pkg.name}) - NuswaMart`,
  });
  if (!trx.success) {
    redirect(`/dashboard/ai-credits?error=${encodeURIComponent(trx.error || trx.details || "Gagal membuat pembayaran")}`);
  }

  const purchase = await db.aiCreditPurchase.create({
    data: {
      storeId: store.id,
      packageName: pkg.name,
      credits: pkg.credits,
      priceRupiah: pkg.priceRupiah,
      paymentType,
      louvinTrxId: extractTrxId(trx),
      paymentInfo: JSON.stringify(trx),
    },
  });
  redirect(`/dashboard/ai-credits/${purchase.id}`);
}

// ===== Admin: kelola paket kredit AI =====

export async function createAiCreditPackageAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const credits = parseInt(String(formData.get("credits") ?? "0"), 10);
  const priceRupiah = parseInt(String(formData.get("priceRupiah") ?? "0"), 10);
  if (!name || !Number.isFinite(credits) || credits < 1 || !Number.isFinite(priceRupiah) || priceRupiah < 1) return;

  const count = await db.aiCreditPackage.count();
  await db.aiCreditPackage.create({ data: { name, credits, priceRupiah, sort: count } });
  await audit(admin.email, "AI_CREDIT_PACKAGE_CREATED", `${name} — ${credits} kredit / Rp${priceRupiah}`);
  revalidatePath("/admin/ai-usage");
}

export async function toggleAiCreditPackageAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const pkg = await db.aiCreditPackage.findUnique({ where: { id } });
  if (!pkg) return;
  await db.aiCreditPackage.update({ where: { id }, data: { active: !pkg.active } });
  revalidatePath("/admin/ai-usage");
}

export async function deleteAiCreditPackageAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.aiCreditPackage.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/ai-usage");
}
