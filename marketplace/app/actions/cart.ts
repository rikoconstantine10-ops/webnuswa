"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
import { getRates, INSTANT_COURIER_CODES } from "@/lib/biteship";
import { validateVoucher } from "@/lib/voucher";
import { createShipmentForOrder } from "@/lib/shipping";
import { notifyNewCodOrder } from "@/lib/notify";
import { resolveAffiliateUserId } from "@/lib/affiliate";
import { effectivePrice } from "@/lib/pricing";
import { createPaymentRequest, isPaymentoConfigured } from "@/lib/paymento";
import { cookies } from "next/headers";
import { getGuestId, getOrCreateGuestId } from "@/lib/guestCart";

// Identitas pemilik keranjang: user login (userId) atau tamu (guestId dari cookie).
// `create` menentukan apakah boleh membuat cookie guest baru (hanya di Server Action).
async function cartOwner(create: boolean): Promise<{ userId: string | null; guestId: string | null }> {
  const user = await currentUser();
  if (user) return { userId: user.id, guestId: null };
  const guestId = create ? await getOrCreateGuestId() : await getGuestId();
  return { userId: null, guestId };
}

function normalizePhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.startsWith("0")) return `62${d.slice(1)}`;
  if (d.startsWith("8")) return `62${d}`;
  return d;
}

// Harga satuan item dihitung ULANG di server (varian > tier grosir > harga dasar).
function unitPriceFor(
  product: { price: number; salePrice: number | null; saleEndsAt: Date | null; variants: { id: string; name: string; price: number; stock: number | null }[]; wholesaleTiers: { minQty: number; price: number }[] },
  variantId: string | null,
  qty: number
): { price: number; variantName: string | null; stock: number | null } | null {
  if (product.variants.length > 0) {
    const v = product.variants.find((x) => x.id === variantId);
    if (!v) return null;
    return { price: v.price, variantName: v.name, stock: v.stock };
  }
  // Harga dasar = harga flash sale bila aktif; grosir menimpa bila lebih murah.
  let price = effectivePrice(product);
  const tier = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty).find((t) => qty >= t.minQty);
  if (tier && tier.price < price) price = tier.price;
  return { price, variantName: null, stock: null };
}

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  // "" = tanpa varian (null tak bisa dipakai di unique gabungan Prisma).
  const variantId = String(formData.get("variantId") ?? "");
  const qty = Math.max(1, Math.min(999, parseInt(String(formData.get("qty") ?? "1"), 10) || 1));
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.active || product.moderation !== "APPROVED") return;

  const { userId, guestId } = await cartOwner(true);
  if (userId) {
    await db.cartItem.upsert({
      where: { userId_productId_variantId: { userId, productId, variantId } },
      create: { userId, productId, variantId, qty },
      update: { qty: { increment: qty } },
    });
  } else {
    await db.cartItem.upsert({
      where: { guestId_productId_variantId: { guestId: guestId!, productId, variantId } },
      create: { guestId, productId, variantId, qty },
      update: { qty: { increment: qty } },
    });
  }
  revalidatePath("/cart");
  redirect("/cart");
}

export async function updateCartQtyAction(formData: FormData) {
  const { userId, guestId } = await cartOwner(false);
  const id = String(formData.get("id") ?? "");
  const qty = Math.max(1, Math.min(999, parseInt(String(formData.get("qty") ?? "1"), 10) || 1));
  const item = await db.cartItem.findUnique({ where: { id } });
  const owns = item && (userId ? item.userId === userId : Boolean(guestId) && item.guestId === guestId);
  if (owns) await db.cartItem.update({ where: { id }, data: { qty } });
  revalidatePath("/cart");
}

export async function removeCartItemAction(formData: FormData) {
  const { userId, guestId } = await cartOwner(false);
  const id = String(formData.get("id") ?? "");
  const item = await db.cartItem.findUnique({ where: { id } });
  const owns = item && (userId ? item.userId === userId : Boolean(guestId) && item.guestId === guestId);
  if (owns) await db.cartItem.delete({ where: { id } });
  revalidatePath("/cart");
}

const cartCheckoutSchema = z.object({
  storeId: z.string().min(1),
  buyerName: z.string().min(2),
  buyerEmail: z.string().email(),
  buyerPhone: z.string(),
  paymentType: z.enum([...PAYMENT_TYPES.map((p) => p.id), "cod", "crypto"] as unknown as [string, ...string[]]),
  shippingAddress: z.string().optional(),
  destAreaId: z.string().optional(),
  destPostalCode: z.string().optional(),
  destLat: z.coerce.number().optional(),
  destLng: z.coerce.number().optional(),
  courierCompany: z.string().optional(),
  courierType: z.string().optional(),
  voucherCode: z.string().optional(),
});

// Checkout seluruh item satu toko dari keranjang → satu Order berisi banyak item.
export async function checkoutCartAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const { userId, guestId } = await cartOwner(false);
  if (!userId && !guestId) return { error: "Keranjang kosong" };
  const ownerWhere = userId ? { userId } : { guestId: guestId! };
  const parsed = cartCheckoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Data checkout tidak valid" };
  const input = parsed.data;

  const cartItems = await db.cartItem.findMany({
    where: { ...ownerWhere, product: { storeId: input.storeId } },
    include: { product: { include: { store: true, variants: true, wholesaleTiers: true } } },
  });
  if (cartItems.length === 0) return { error: "Keranjang toko ini kosong" };
  const store = cartItems[0].product.store;
  if (store.status !== "ACTIVE") return { error: "Toko tidak aktif" };
  if (store.enabledPaymentTypes.length > 0 && !store.enabledPaymentTypes.includes(input.paymentType)) {
    return { error: "Metode pembayaran tidak tersedia untuk toko ini" };
  }

  let subtotal = 0;
  let hasPhysical = false;
  const orderItemsData: { productId: string; name: string; variantName: string | null; price: number; qty: number }[] = [];
  const rateItems: { name: string; value: number; weight: number; quantity: number }[] = [];

  for (const ci of cartItems) {
    const p = ci.product;
    if (!p.active || p.moderation !== "APPROVED") return { error: `Produk ${p.name} tidak tersedia` };
    const up = unitPriceFor(p, ci.variantId, ci.qty);
    if (!up) return { error: `Silakan pilih varian untuk ${p.name}` };
    if (p.type === "PHYSICAL") {
      hasPhysical = true;
      if (up.stock !== null && up.stock < ci.qty) return { error: `Stok ${p.name} tidak cukup` };
      rateItems.push({ name: p.name.slice(0, 40), value: p.price, weight: Math.max(100, p.weightGrams ?? 1000), quantity: ci.qty });
    }
    subtotal += up.price * ci.qty;
    orderItemsData.push({ productId: p.id, name: p.name, variantName: up.variantName, price: up.price, qty: ci.qty });
  }

  // Ongkir (produk fisik) dihitung ULANG di server dari Biteship.
  let shippingCost = 0;
  let courierLabel: string | null = null;
  let codCapable = false;
  if (hasPhysical) {
    if (!input.shippingAddress || input.shippingAddress.trim().length < 10) return { error: "Alamat pengiriman wajib diisi" };
    if (!store.originAreaId) return { error: "Toko belum mengatur alamat asal pengiriman" };
    if (!input.destAreaId || !input.courierCompany || !input.courierType) return { error: "Pilih tujuan & kurir dulu" };
    if (store.enabledCouriers.length > 0 && !store.enabledCouriers.includes(input.courierCompany)) {
      return { error: "Kurir tidak tersedia untuk toko ini" };
    }
    const isInstant = INSTANT_COURIER_CODES.has(input.courierCompany);
    const rates = await getRates({
      originAreaId: store.originAreaId,
      originLatitude: isInstant ? store.originLat ?? undefined : undefined,
      originLongitude: isInstant ? store.originLng ?? undefined : undefined,
      destinationAreaId: input.destAreaId,
      destinationLatitude: isInstant ? input.destLat || undefined : undefined,
      destinationLongitude: isInstant ? input.destLng || undefined : undefined,
      couriers: input.courierCompany,
      items: rateItems,
    });
    if (!rates.success) return { error: `Gagal menghitung ongkir: ${rates.error}` };
    const match = rates.pricing.find((r) => r.courier_code === input.courierCompany && r.courier_service_code === input.courierType);
    if (!match) return { error: "Layanan kurir tidak tersedia, pilih ulang" };
    shippingCost = match.price;
    courierLabel = `${match.courier_name} ${match.courier_service_name}`;
    codCapable = Boolean(match.available_for_cash_on_delivery);
  }

  const isCod = input.paymentType === "cod";
  if (isCod && (!hasPhysical || !codCapable)) {
    return { error: "COD tidak tersedia untuk kurir ini. Pilih pembayaran online." };
  }

  // Voucher
  let discountAmount = 0;
  let voucherId: string | null = null;
  if (input.voucherCode) {
    const v = await validateVoucher(input.voucherCode, store.id, subtotal);
    if (!v.ok) return { error: `Voucher: ${v.message}` };
    discountAmount = v.discount;
    voucherId = v.voucherId;
  }

  const total = subtotal - discountAmount + shippingCost;
  if (!isCod && !isPaymentTypeAllowed(input.paymentType, total)) {
    return { error: `Virtual Account minimal Rp ${MIN_VA_AMOUNT.toLocaleString("id-ID")} — pilih QRIS` };
  }

  trackEvent({ type: "CHECKOUT", storeId: store.id });

  const affCode = (await cookies()).get("nm_aff")?.value;
  const affiliateUserId = await resolveAffiliateUserId(affCode, userId);

  const code = generateOrderCode();

  // COD: tanpa pembayaran online. Order langsung diproses; stok dikurangi.
  if (isCod) {
    const codOrder = await db.order.create({
      data: {
        code, storeId: store.id, buyerId: userId,
        buyerName: input.buyerName, buyerEmail: input.buyerEmail, buyerPhone: normalizePhone(input.buyerPhone),
        subtotal, shippingCost, discountAmount, voucherId, total,
        paymentType: "cod", status: "PROCESSING", affiliateUserId,
        shippingAddress: input.shippingAddress?.trim() || null,
        destAreaId: input.destAreaId || null, destPostalCode: input.destPostalCode || null,
        destLat: input.destLat || null, destLng: input.destLng || null,
        courier: courierLabel, courierCompany: input.courierCompany || null, courierType: input.courierType || null,
        items: { create: orderItemsData },
      },
    });
    for (const it of cartItems) {
      if (it.product.type !== "PHYSICAL") continue;
      if (it.variantId) {
        await db.productVariant.updateMany({ where: { id: it.variantId, stock: { not: null } }, data: { stock: { decrement: it.qty } } });
      } else if (it.product.stock !== null) {
        await db.product.update({ where: { id: it.product.id }, data: { stock: { decrement: it.qty } } });
      }
    }
    if (voucherId) await db.voucher.update({ where: { id: voucherId }, data: { used: { increment: 1 } } });
    createShipmentForOrder(codOrder.id).catch(() => {});
    notifyNewCodOrder(codOrder.id);
    await db.cartItem.deleteMany({ where: { ...ownerWhere, product: { storeId: store.id } } });
    redirect(`/order/${code}`);
  }

  // Crypto (Paymento): order PENDING_PAYMENT → redirect ke gateway; lunas via IPN.
  if (input.paymentType === "crypto") {
    if (!isPaymentoConfigured()) return { error: "Pembayaran crypto belum tersedia saat ini." };
    const cryptoOrder = await db.order.create({
      data: {
        code, storeId: store.id, buyerId: userId,
        buyerName: input.buyerName, buyerEmail: input.buyerEmail, buyerPhone: normalizePhone(input.buyerPhone),
        subtotal, shippingCost, discountAmount, voucherId, total,
        paymentType: "crypto", affiliateUserId,
        shippingAddress: input.shippingAddress?.trim() || null,
        destAreaId: input.destAreaId || null, destPostalCode: input.destPostalCode || null,
        destLat: input.destLat || null, destLng: input.destLng || null,
        courier: courierLabel, courierCompany: input.courierCompany || null, courierType: input.courierType || null,
        items: { create: orderItemsData },
      },
    });
    const appUrl = process.env.APP_URL || "https://nuswamart.com";
    const pay = await createPaymentRequest({ orderId: code, amountIdr: total, returnUrl: `${appUrl}/order/${code}`, email: input.buyerEmail });
    if (!pay.ok) {
      await db.order.update({ where: { id: cryptoOrder.id }, data: { status: "CANCELLED" } });
      return { error: `Gagal membuat pembayaran crypto: ${pay.error}` };
    }
    await db.order.update({
      where: { id: cryptoOrder.id },
      data: { paymentInfo: JSON.stringify({ provider: "paymento", token: pay.token, fiatAmount: pay.fiatAmount, fiatCurrency: pay.fiatCurrency }) },
    });
    await db.cartItem.deleteMany({ where: { ...ownerWhere, product: { storeId: store.id } } });
    redirect(pay.gatewayUrl!);
  }

  const trx = await createLouvinTransaction({
    amount: total,
    payment_type: input.paymentType,
    customer_name: input.buyerName,
    customer_email: input.buyerEmail,
    description: `Order ${code} - ${orderItemsData.length} item dari ${store.name}`,
  });
  if (!trx.success) return { error: `Gagal membuat pembayaran: ${trx.error || trx.details || "unknown"}` };

  await db.order.create({
    data: {
      code,
      storeId: store.id,
      buyerId: userId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: normalizePhone(input.buyerPhone),
      subtotal,
      shippingCost,
      discountAmount,
      voucherId,
      total,
      paymentType: input.paymentType,
      affiliateUserId,
      louvinTrxId: extractTrxId(trx),
      paymentInfo: JSON.stringify(trx),
      shippingAddress: input.shippingAddress?.trim() || null,
      destAreaId: input.destAreaId || null,
      destPostalCode: input.destPostalCode || null,
      destLat: input.destLat || null,
      destLng: input.destLng || null,
      courier: courierLabel,
      courierCompany: input.courierCompany || null,
      courierType: input.courierType || null,
      items: { create: orderItemsData },
    },
  });

  // Kosongkan item toko ini dari keranjang.
  await db.cartItem.deleteMany({ where: { ...ownerWhere, product: { storeId: store.id } } });

  redirect(`/order/${code}`);
}
