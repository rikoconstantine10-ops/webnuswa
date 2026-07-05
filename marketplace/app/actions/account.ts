"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// Toggle wishlist (favorit) untuk sebuah produk.
export async function toggleWishlistAction(
  _prev: { inWishlist?: boolean; error?: string },
  formData: FormData
): Promise<{ inWishlist?: boolean; error?: string }> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Silakan masuk dulu untuk menyimpan favorit." };
  }
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Produk tidak valid" };
  const existing = await db.wishlist.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (existing) {
    await db.wishlist.delete({ where: { id: existing.id } });
    revalidatePath("/akun/wishlist");
    return { inWishlist: false };
  }
  await db.wishlist.create({ data: { userId: user.id, productId } });
  revalidatePath("/akun/wishlist");
  return { inWishlist: true };
}

export async function removeWishlistAction(formData: FormData) {
  const user = await requireUser();
  const productId = String(formData.get("productId") ?? "");
  await db.wishlist.deleteMany({ where: { userId: user.id, productId } });
  revalidatePath("/akun/wishlist");
}

// ————— Alamat tersimpan —————

export async function saveAddressAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const label = String(formData.get("label") ?? "Rumah").slice(0, 30) || "Rumah";
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const detail = String(formData.get("detail") ?? "").trim();
  const areaId = String(formData.get("areaId") ?? "") || null;
  const postalCode = String(formData.get("postalCode") ?? "") || null;
  const latRaw = String(formData.get("lat") ?? "");
  const lngRaw = String(formData.get("lng") ?? "");
  const lat = latRaw ? parseFloat(latRaw) : null;
  const lng = lngRaw ? parseFloat(lngRaw) : null;
  const isDefault = formData.get("isDefault") === "on" || formData.get("isDefault") === "true";

  if (recipientName.length < 2) return { error: "Nama penerima wajib diisi" };
  if (phone.length < 9) return { error: "Nomor telepon tidak valid" };
  if (detail.length < 10) return { error: "Alamat lengkap minimal 10 karakter" };

  const data = { label, recipientName, phone, detail, areaId, postalCode, lat, lng, isDefault };

  if (isDefault) {
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }
  if (id) {
    const owned = await db.address.findFirst({ where: { id, userId: user.id } });
    if (!owned) return { error: "Alamat tidak ditemukan" };
    await db.address.update({ where: { id }, data });
  } else {
    // Alamat pertama otomatis jadi default.
    const count = await db.address.count({ where: { userId: user.id } });
    await db.address.create({ data: { ...data, userId: user.id, isDefault: isDefault || count === 0 } });
  }
  revalidatePath("/akun/alamat");
  return { ok: true };
}

export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await db.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/akun/alamat");
}

export async function setDefaultAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const owned = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!owned) return;
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/akun/alamat");
}
