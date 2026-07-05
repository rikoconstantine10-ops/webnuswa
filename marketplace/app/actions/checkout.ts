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
import { generateOrderCode, completeOrder } from "@/lib/orders";
import { trackEvent } from "@/lib/analytics";
import { getRates, INSTANT_COURIER_CODES } from "@/lib/biteship";
import { validateVoucher } from "@/lib/voucher";
import { createShipmentForOrder } from "@/lib/shipping";

const checkoutSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  qty: z.coerce.number().int().min(1).max(999),
  buyerName: z.string().min(2),
  buyerEmail: z.string().email(),
  buyerPhone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 9 && v.length <= 15, "Nomor WhatsApp tidak valid"),
  paymentType: z.enum([...PAYMENT_TYPES.map((p) => p.id), "cod"] as unknown as [string, ...string[]]),
  shippingAddress: z.string().optional(),
  destAreaId: z.string().optional(),
  destPostalCode: z.string().optional(),
  destLat: z.coerce.number().optional(),
  destLng: z.coerce.number().optional(),
  courierCompany: z.string().optional(),
  courierType: z.string().optional(),
  courierName: z.string().optional(),
  voucherCode: z.string().optional(),
});

// Normalisasi ke format internasional Indonesia: 08xx → 628xx.
function normalizePhone(digits: string): string {
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

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
    buyerPhone: formData.get("buyerPhone"),
    paymentType: formData.get("paymentType"),
    shippingAddress: formData.get("shippingAddress") || undefined,
    destAreaId: formData.get("destAreaId") || undefined,
    destPostalCode: formData.get("destPostalCode") || undefined,
    destLat: formData.get("destLat") || undefined,
    destLng: formData.get("destLng") || undefined,
    courierCompany: formData.get("courierCompany") || undefined,
    courierType: formData.get("courierType") || undefined,
    courierName: formData.get("courierName") || undefined,
    voucherCode: formData.get("voucherCode") || undefined,
  });
  if (!parsed.success) return { error: "Data checkout tidak lengkap / tidak valid" };
  const input = parsed.data;

  const product = await db.product.findUnique({
    where: { id: input.productId },
    include: {
      store: true,
      variants: true,
      wholesaleTiers: { orderBy: { minQty: "desc" } },
      addonLinks: { include: { addonProduct: true } },
    },
  });
  if (!product || !product.active || product.moderation !== "APPROVED" || product.store.status !== "ACTIVE") {
    return { error: "Produk tidak tersedia" };
  }

  // Add-on yang dipilih pembeli (checkbox addonIds). Hanya add-on sah milik produk ini.
  const chosenAddonIds = formData.getAll("addonIds").map(String);
  const chosenAddons = product.addonLinks.filter(
    (a) => chosenAddonIds.includes(a.addonProductId) && a.addonProduct.active
  );
  const addonTotal = chosenAddons.reduce((s, a) => s + a.addonPrice, 0);

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

  // Ongkir dihitung ULANG di server dari Biteship (jangan percaya harga dari client).
  let shippingCost = 0;
  let courierLabel: string | null = null;
  let codCapable = false;
  if (product.type === "PHYSICAL") {
    if (!input.shippingAddress || input.shippingAddress.trim().length < 10) {
      return { error: "Alamat pengiriman wajib diisi untuk produk fisik" };
    }
    if (availableStock !== null && availableStock < input.qty) {
      return { error: "Stok tidak mencukupi" };
    }
    if (!product.store.originAreaId) {
      return { error: "Toko belum mengatur alamat asal pengiriman" };
    }
    if (!input.destAreaId || !input.courierCompany || !input.courierType) {
      return { error: "Pilih tujuan dan kurir pengiriman dulu" };
    }
    // Kurir instan (Gojek/Grab/Lalamove) butuh koordinat toko & pembeli.
    const isInstant = INSTANT_COURIER_CODES.has(input.courierCompany);
    const hasStoreCoord =
      typeof product.store.originLat === "number" && typeof product.store.originLng === "number";
    const hasBuyerCoord = typeof input.destLat === "number" && typeof input.destLng === "number";
    if (isInstant && (!hasStoreCoord || !hasBuyerCoord)) {
      return { error: "Kurir instan butuh titik lokasi toko & pembeli. Pilih kurir reguler atau pin lokasi." };
    }
    const rates = await getRates({
      originAreaId: product.store.originAreaId,
      originLatitude: isInstant ? product.store.originLat! : undefined,
      originLongitude: isInstant ? product.store.originLng! : undefined,
      destinationAreaId: input.destAreaId,
      destinationLatitude: isInstant ? input.destLat : undefined,
      destinationLongitude: isInstant ? input.destLng : undefined,
      couriers: input.courierCompany,
      items: [
        {
          name: product.name.slice(0, 40),
          value: product.price,
          weight: Math.max(100, product.weightGrams ?? 1000),
          quantity: input.qty,
        },
      ],
    });
    if (!rates.success) {
      return { error: `Gagal menghitung ongkir: ${rates.error}` };
    }
    const match = rates.pricing.find(
      (r) => r.courier_code === input.courierCompany && r.courier_service_code === input.courierType
    );
    if (!match) return { error: "Layanan kurir tidak tersedia, silakan pilih ulang" };
    shippingCost = match.price;
    courierLabel = `${match.courier_name} ${match.courier_service_name}`;
    codCapable = Boolean(match.available_for_cash_on_delivery);
  }

  const isCod = input.paymentType === "cod";
  if (isCod && (product.type !== "PHYSICAL" || !codCapable)) {
    return { error: "COD tidak tersedia untuk produk/kurir ini. Pilih pembayaran online." };
  }

  const user = await currentUser();
  const subtotal = unitPrice * input.qty + addonTotal;

  // Voucher: validasi & hitung diskon ULANG di server.
  let discountAmount = 0;
  let voucherId: string | null = null;
  if (input.voucherCode) {
    const v = await validateVoucher(input.voucherCode, product.storeId, subtotal);
    if (v.ok) {
      discountAmount = v.discount;
      voucherId = v.voucherId;
    } else {
      return { error: `Voucher: ${v.message}` };
    }
  }

  const total = subtotal - discountAmount + shippingCost;

  if (!isCod && !isPaymentTypeAllowed(input.paymentType, total)) {
    return {
      error: `Virtual Account hanya tersedia untuk pembelian minimal Rp ${MIN_VA_AMOUNT.toLocaleString("id-ID")} — silakan pilih QRIS`,
    };
  }

  trackEvent({ type: "CHECKOUT", storeId: product.storeId, productId: product.id });

  const code = generateOrderCode();

  // COD: tanpa pembayaran online. Order langsung diproses; stok dikurangi;
  // order Biteship COD dibuat; dana penjual dikredit saat barang sampai (delivered).
  if (isCod) {
    const order = await db.order.create({
      data: {
        code,
        storeId: product.storeId,
        buyerId: user?.id ?? null,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        buyerPhone: normalizePhone(input.buyerPhone),
        subtotal,
        shippingCost,
        discountAmount,
        voucherId,
        total,
        paymentType: "cod",
        status: "PROCESSING",
        shippingAddress: input.shippingAddress?.trim() || null,
        destAreaId: input.destAreaId || null,
        destPostalCode: input.destPostalCode || null,
        destLat: input.destLat ?? null,
        destLng: input.destLng ?? null,
        courier: courierLabel,
        courierCompany: input.courierCompany || null,
        courierType: input.courierType || null,
        items: {
          create: [
            { productId: product.id, name: product.name, variantName, price: unitPrice, qty: input.qty },
            ...chosenAddons.map((a) => ({ productId: a.addonProductId, name: a.addonProduct.name, isAddon: true, price: a.addonPrice, qty: 1 })),
          ],
        },
      },
    });
    // Kurangi stok (COD memesan stok saat order dibuat).
    if (variantName) {
      await db.productVariant.updateMany({ where: { productId: product.id, name: variantName, stock: { not: null } }, data: { stock: { decrement: input.qty } } });
    } else if (product.stock !== null) {
      await db.product.update({ where: { id: product.id }, data: { stock: { decrement: input.qty } } });
    }
    if (voucherId) await db.voucher.update({ where: { id: voucherId }, data: { used: { increment: 1 } } });
    createShipmentForOrder(order.id).catch(() => {});
    redirect(`/order/${code}`);
  }

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
      buyerPhone: normalizePhone(input.buyerPhone),
      subtotal,
      shippingCost,
      discountAmount,
      voucherId,
      total,
      paymentType: input.paymentType,
      louvinTrxId: extractTrxId(trx),
      paymentInfo: JSON.stringify(trx),
      shippingAddress: input.shippingAddress?.trim() || null,
      destAreaId: input.destAreaId || null,
      destPostalCode: input.destPostalCode || null,
      destLat: input.destLat ?? null,
      destLng: input.destLng ?? null,
      courier: courierLabel,
      courierCompany: input.courierCompany || null,
      courierType: input.courierType || null,
      items: {
        create: [
          { productId: product.id, name: product.name, variantName, price: unitPrice, qty: input.qty },
          ...chosenAddons.map((a) => ({
            productId: a.addonProductId,
            name: a.addonProduct.name,
            isAddon: true,
            price: a.addonPrice,
            qty: 1,
          })),
        ],
      },
    },
  });

  redirect(`/order/${code}`);
}

export async function confirmReceivedAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const order = await db.order.findUnique({ where: { code } });
  // Pembeli konfirmasi terima → order selesai & dana escrow dirilis ke penjual.
  if (order && ["SHIPPED", "PROCESSING"].includes(order.status)) {
    await completeOrder(order.id);
  }
  redirect(`/order/${code}`);
}
