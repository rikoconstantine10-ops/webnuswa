"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  createLouvinTransaction,
  extractTrxId,
  isPaymentTypeAllowed,
  MIN_VA_AMOUNT,
  PAYMENT_TYPES,
} from "@/lib/louvin";
import { generateOrderCode } from "@/lib/orders";
import { trackEvent } from "@/lib/analytics";

const checkoutSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  qty: z.coerce.number().int().min(1).max(999),
  buyerName: z.string().min(2),
  buyerEmail: z.string().email(),
  paymentType: z.enum(PAYMENT_TYPES.map((p) => p.id) as [string, ...string[]]),
  shippingAddress: z.string().optional(),
});

// Harga satuan dihitung ULANG di server (jangan percaya nilai dari client):
// varian dipilih → harga varian; tanpa varian → harga grosir jika qty memenuhi tier.
export async function checkoutAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = checkoutSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId") || undefined,
    qty: formData.get("qty"),
    buyerName: formData.get("buyerName"),
    buyerEmail: formData.get("buyerEmail"),
    paymentType: formData.get("paymentType"),
    shippingAddress: formData.get("shippingAddress") || undefined,
  });
  if (!parsed.success) return { error: "Data checkout tidak lengkap / tidak valid" };
  const input = parsed.data;

  const product = await db.product.findUnique({
    where: { id: input.productId },
    include: { store: true, variants: true, wholesaleTiers: { orderBy: { minQty: "desc" } } },
  });
  if (!product || !product.active || product.store.status !== "ACTIVE") {
    return { error: "Produk tidak tersedia" };
  }

  let unitPrice = product.price;
  let variantName: string | null = null;
  let availableStock = product.stock;

  if (product.variants.length > 0) {
    const variant = product.variants.find((v) => v.id === input.variantId);
    if (!variant) return { error: "Silakan pilih varian dulu" };
    unitPrice = variant.price;
    variantName = variant.name;
    availableStock = variant.stock;
  } else {
    const tier = product.wholesaleTiers.find((t) => input.qty >= t.minQty);
    if (tier) unitPrice = tier.price;
  }

  if (product.type === "PHYSICAL") {
    if (!input.shippingAddress || input.shippingAddress.trim().length < 10) {
      return { error: "Alamat pengiriman wajib diisi untuk produk fisik" };
    }
    if (availableStock !== null && availableStock < input.qty) {
      return { error: "Stok tidak mencukupi" };
    }
  }

  const user = await currentUser();
  const subtotal = unitPrice * input.qty;
  const shippingCost = 0; // MVP: ongkir flat 0 (Biteship menyusul di Fase 2)
  const total = subtotal + shippingCost;

  if (!isPaymentTypeAllowed(input.paymentType, total)) {
    return {
      error: `Virtual Account hanya tersedia untuk pembelian minimal Rp ${MIN_VA_AMOUNT.toLocaleString("id-ID")} — silakan pilih QRIS`,
    };
  }

  trackEvent({ type: "CHECKOUT", storeId: product.storeId, productId: product.id });

  const code = generateOrderCode();
  const trx = await createLouvinTransaction({
    amount: total,
    payment_type: input.paymentType,
    customer_name: input.buyerName,
    customer_email: input.buyerEmail,
    description: `Order ${code} - ${product.name}${variantName ? ` (${variantName})` : ""} x${input.qty}`,
  });
  if (!trx.success) {
    return { error: `Gagal membuat pembayaran: ${trx.error || trx.details || "unknown"}` };
  }

  await db.order.create({
    data: {
      code,
      storeId: product.storeId,
      buyerId: user?.id ?? null,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      subtotal,
      shippingCost,
      total,
      paymentType: input.paymentType,
      louvinTrxId: extractTrxId(trx),
      paymentInfo: JSON.stringify(trx),
      shippingAddress: input.shippingAddress?.trim() || null,
      items: {
        create: [
          { productId: product.id, name: product.name, variantName, price: unitPrice, qty: input.qty },
        ],
      },
    },
  });

  redirect(`/order/${code}`);
}

export async function confirmReceivedAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const order = await db.order.findUnique({ where: { code } });
  if (order && order.status === "SHIPPED") {
    await db.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }
  redirect(`/order/${code}`);
}
