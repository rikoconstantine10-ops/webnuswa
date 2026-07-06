"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requestOtp, verifyOtp, logout, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify, randomSuffix } from "@/lib/slug";
import { notifyAdminNewSeller } from "@/lib/notify";

export async function requestOtpAction(
  _prev: { step: string; email: string; error?: string },
  formData: FormData
) {
  const email = z.string().email().safeParse(String(formData.get("email")).trim().toLowerCase());
  if (!email.success) return { step: "email", email: "", error: "Email tidak valid" };

  await requestOtp(email.data);
  return { step: "otp", email: email.data };
}

export async function verifyOtpAction(
  _prev: { step: string; email: string; error?: string },
  formData: FormData
) {
  const email = String(formData.get("email")).trim().toLowerCase();
  const code = String(formData.get("code")).trim();

  const ok = await verifyOtp(email, code);
  if (!ok) return { step: "otp", email, error: "Kode salah atau kedaluwarsa" };

  redirect("/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/");
}

export async function registerSellerAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireUser();
  if (user.store) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 3) return { error: "Nama toko minimal 3 karakter" };

  let slug = slugify(name);
  if (await db.store.findUnique({ where: { slug } })) {
    slug = `${slug}-${randomSuffix()}`;
  }

  const store = await db.store.create({
    data: { ownerId: user.id, name, slug, description: description || null },
  });
  await db.user.update({
    where: { id: user.id },
    data: { role: user.role === "ADMIN" ? "ADMIN" : "SELLER" },
  });
  notifyAdminNewSeller(store.id);

  redirect("/dashboard");
}
