"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, requireSeller } from "@/lib/auth";
import { releaseOrderFunds, voidOrderFunds } from "@/lib/ledger";
import { DIGITAL_DISPUTE_WINDOW_HOURS } from "@/lib/orders";
import { audit } from "@/lib/audit";
import { notifyDisputeOpened, notifyDisputeResolved } from "@/lib/notify";

// Pembeli membuka komplain/sengketa dari halaman pesanan (punya kode order).
export async function openDisputeAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 2000);
  if (reason.length < 10) redirect(`/order/${code}?dispute=short`);

  const order = await db.order.findUnique({
    where: { code },
    include: { dispute: true, items: { include: { product: { select: { type: true } } } } },
  });
  if (!order || order.dispute) redirect(`/order/${code}`);

  // Produk fisik: bisa dikomplain selama belum selesai/refund.
  // Produk 100% digital: dianggap "diterima" instan (dana langsung cair), tapi tetap
  // diberi jendela singkat pasca-COMPLETED untuk komplain bila filenya bermasalah.
  const isDigitalOnly = order.items.every((i) => i.product.type === "DIGITAL");
  const withinDigitalWindow =
    order.status === "COMPLETED" &&
    isDigitalOnly &&
    order.completedAt !== null &&
    Date.now() - order.completedAt.getTime() < DIGITAL_DISPUTE_WINDOW_HOURS * 3600 * 1000;
  const canOpen = ["PAID", "PROCESSING", "SHIPPED"].includes(order.status) || withinDigitalWindow;
  if (!canOpen) redirect(`/order/${code}`);

  await db.$transaction([
    db.dispute.create({
      data: {
        orderId: order.id,
        buyerId: order.buyerId,
        reason,
        messages: { create: { author: "BUYER", body: reason } },
      },
    }),
    db.order.update({ where: { id: order.id }, data: { status: "DISPUTED" } }),
  ]);
  notifyDisputeOpened(order.id);
  revalidatePath(`/order/${code}`);
  redirect(`/order/${code}`);
}

const msgSchema = z.object({ disputeId: z.string().min(1), body: z.string().min(1).max(2000) });

// Tambah pesan ke thread sengketa (dari pembeli via kode order, atau seller/admin via sesi).
export async function addDisputeMessageAction(formData: FormData) {
  const parsed = msgSchema.safeParse({
    disputeId: formData.get("disputeId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return;
  const role = String(formData.get("role") ?? "BUYER"); // BUYER | SELLER | ADMIN
  const code = String(formData.get("code") ?? "");

  const dispute = await db.dispute.findUnique({
    where: { id: parsed.data.disputeId },
    include: { order: true },
  });
  if (!dispute) return;

  // Verifikasi hak akses sesuai peran.
  if (role === "SELLER") {
    const { store } = await requireSeller();
    if (store.id !== dispute.order.storeId) return;
  } else if (role === "ADMIN") {
    await requireAdmin();
  } else {
    // BUYER: cukup memegang kode order yang cocok.
    if (dispute.order.code !== code) return;
  }

  await db.disputeMessage.create({
    data: { disputeId: dispute.id, author: role, body: parsed.data.body.trim() },
  });
  revalidatePath(`/order/${dispute.order.code}`);
  revalidatePath(`/admin/disputes`);
  revalidatePath(`/dashboard/orders`);
}

// Admin menyelesaikan sengketa: refund ke pembeli (batalkan dana seller) atau rilis ke seller.
export async function resolveDisputeAction(formData: FormData) {
  const admin = await requireAdmin();
  const disputeId = String(formData.get("disputeId") ?? "");
  const outcome = String(formData.get("outcome") ?? ""); // REFUND | RELEASE | REJECT
  const resolution = String(formData.get("resolution") ?? "").trim().slice(0, 1000);

  const dispute = await db.dispute.findUnique({ where: { id: disputeId }, include: { order: true } });
  if (!dispute || dispute.status !== "OPEN") redirect(`/admin/disputes`);
  const order = dispute.order;

  if (outcome === "REFUND") {
    await voidOrderFunds(order.id);
    await db.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
    // Order dibatalkan sepenuhnya → kembalikan kuota voucher yang sempat terpakai.
    if (order.voucherId) {
      await db.voucher.update({ where: { id: order.voucherId }, data: { used: { decrement: 1 } } });
    }
    await db.dispute.update({
      where: { id: disputeId },
      data: { status: "RESOLVED_REFUND", resolution: resolution || "Refund ke pembeli", resolvedAt: new Date() },
    });
    await audit(admin.email, "DISPUTE_REFUND", `Order ${order.code}`);
    notifyDisputeResolved(order.id, true);
  } else {
    // RELEASE atau REJECT → dana diteruskan ke seller & order diselesaikan.
    if (!order.fundsReleased) await releaseOrderFunds(order.id);
    await db.order.update({ where: { id: order.id }, data: { status: "COMPLETED", completedAt: new Date() } });
    await db.dispute.update({
      where: { id: disputeId },
      data: {
        status: outcome === "REJECT" ? "REJECTED" : "RESOLVED_RELEASE",
        resolution: resolution || "Dana diteruskan ke penjual",
        resolvedAt: new Date(),
      },
    });
    await audit(admin.email, "DISPUTE_RELEASE", `Order ${order.code}`);
    notifyDisputeResolved(order.id, false);
  }
  redirect(`/admin/disputes`);
}
