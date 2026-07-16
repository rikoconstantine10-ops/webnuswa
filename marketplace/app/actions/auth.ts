"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requestOtp, verifyOtp, logout, requireUser, createSessionForUser } from "@/lib/auth";
import { verifyTurnstile } from "@/lib/turnstile";
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

  redirect("/akun");
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
    data: { ownerId: user.id, name, slug, description: description || null, status: "ACTIVE" },
  });
  await db.user.update({
    where: { id: user.id },
    data: { role: user.role === "ADMIN" ? "ADMIN" : "SELLER" },
  });
  notifyAdminNewSeller(store.id);

  redirect("/dashboard");
}

// ===== Auth khusus alur seller (hybrid OTP + password + Google), digunakan di /register-seller =====

type SellerAuthState = { step: string; email: string; error?: string };

function afterSellerLoginPath(hasStore: boolean) {
  return hasStore ? "/dashboard" : "/register-seller";
}

export async function sellerRequestOtpAction(
  _prev: SellerAuthState,
  formData: FormData
): Promise<SellerAuthState> {
  const ok = await verifyTurnstile(String(formData.get("turnstileToken") ?? "") || null);
  if (!ok) return { step: "email", email: "", error: "Verifikasi keamanan gagal, coba lagi" };

  const email = z.string().email().safeParse(String(formData.get("email")).trim().toLowerCase());
  if (!email.success) return { step: "email", email: "", error: "Email tidak valid" };

  await requestOtp(email.data);
  return { step: "otp", email: email.data };
}

export async function sellerVerifyOtpAction(
  _prev: SellerAuthState,
  formData: FormData
): Promise<SellerAuthState> {
  const email = String(formData.get("email")).trim().toLowerCase();
  const code = String(formData.get("code")).trim();

  const ok = await verifyOtp(email, code);
  if (!ok) return { step: "otp", email, error: "Kode salah atau kedaluwarsa" };

  const user = await db.user.findUnique({ where: { email }, include: { store: true } });
  redirect(afterSellerLoginPath(Boolean(user?.store)));
}

export async function sellerPasswordLoginAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const ok = await verifyTurnstile(String(formData.get("turnstileToken") ?? "") || null);
  if (!ok) return { error: "Verifikasi keamanan gagal, coba lagi" };

  // Identifier bisa email ATAU username. Backward-compat: field lama bernama "email".
  const identifier = String(formData.get("identifier") ?? formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) return { error: "Email/username dan password wajib diisi" };

  const user = identifier.includes("@")
    ? await db.user.findUnique({ where: { email: identifier }, include: { store: true } })
    : await db.user.findUnique({ where: { username: identifier }, include: { store: true } });
  if (!user?.passwordHash) return { error: "Akun atau password salah" };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Akun atau password salah" };

  await createSessionForUser(user.id);
  redirect(afterSellerLoginPath(Boolean(user.store)));
}

// ===== Auth khusus admin (hybrid OTP + password + Turnstile), digunakan di /admin-login =====

export async function adminRequestOtpAction(
  _prev: SellerAuthState,
  formData: FormData
): Promise<SellerAuthState> {
  const ok = await verifyTurnstile(String(formData.get("turnstileToken") ?? "") || null);
  if (!ok) return { step: "email", email: "", error: "Verifikasi keamanan gagal, coba lagi" };

  const email = z.string().email().safeParse(String(formData.get("email")).trim().toLowerCase());
  if (!email.success) return { step: "email", email: "", error: "Email tidak valid" };

  await requestOtp(email.data);
  return { step: "otp", email: email.data };
}

export async function adminVerifyOtpAction(
  _prev: SellerAuthState,
  formData: FormData
): Promise<SellerAuthState> {
  const email = String(formData.get("email")).trim().toLowerCase();
  const code = String(formData.get("code")).trim();

  const ok = await verifyOtp(email, code);
  if (!ok) return { step: "otp", email, error: "Kode salah atau kedaluwarsa" };

  // verifyOtp() sudah membuat session — batalkan lagi bila ternyata bukan admin,
  // supaya halaman ini tak dipakai diam-diam untuk login akun non-admin.
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") {
    await logout();
    return { step: "otp", email, error: "Akun ini bukan admin" };
  }
  redirect("/admin");
}

export async function adminPasswordLoginAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const ok = await verifyTurnstile(String(formData.get("turnstileToken") ?? "") || null);
  if (!ok) return { error: "Verifikasi keamanan gagal, coba lagi" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email dan password wajib diisi" };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN" || !user.passwordHash) return { error: "Email atau password salah" };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Email atau password salah" };

  await createSessionForUser(user.id);
  redirect("/admin");
}

// Atur/ubah password login dari halaman Akun (mengganti alur "lupa password" — cukup
// masuk via OTP lalu set password baru di sini).
export async function setPasswordAction(
  _prev: { saved?: boolean; error?: string },
  formData: FormData
): Promise<{ saved?: boolean; error?: string }> {
  const user = await requireUser();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password minimal 8 karakter" };

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { saved: true };
}

// Atur/ubah username login (opsional) — dipakai seller supaya bisa masuk pakai
// username selain email. Disimpan lowercase; unik lintas akun.
const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;

export async function setUsernameAction(
  _prev: { saved?: boolean; error?: string; username?: string },
  formData: FormData
): Promise<{ saved?: boolean; error?: string; username?: string }> {
  const user = await requireUser();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!USERNAME_RE.test(username)) {
    return { error: "Username 3–20 karakter: huruf kecil, angka, atau garis bawah, diawali huruf." };
  }
  const existing = await db.user.findUnique({ where: { username } });
  if (existing && existing.id !== user.id) return { error: "Username sudah dipakai, coba yang lain." };

  await db.user.update({ where: { id: user.id }, data: { username } });
  return { saved: true, username };
}
