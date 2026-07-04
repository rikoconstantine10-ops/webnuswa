import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { sendMail } from "./mailer";

const SESSION_COOKIE = "mp_session";
const SESSION_DAYS = 30;
const OTP_MINUTES = 10;

export async function requestOtp(email: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);

  await db.otpCode.deleteMany({ where: { email } });
  await db.otpCode.create({
    data: {
      email,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_MINUTES * 60 * 1000),
    },
  });

  await sendMail(
    email,
    "Kode Login Anda",
    `Kode OTP Anda: ${code}\nBerlaku ${OTP_MINUTES} menit. Jangan bagikan kode ini kepada siapa pun.`
  );
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const otp = await db.otpCode.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return false;

  const valid = await bcrypt.compare(code, otp.codeHash);
  if (!valid) return false;

  await db.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  const isAdmin =
    process.env.ADMIN_EMAIL &&
    email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

  const user = await db.user.upsert({
    where: { email },
    create: { email, role: isAdmin ? "ADMIN" : "BUYER" },
    update: isAdmin ? { role: "ADMIN" } : {},
  });

  const token = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
    // Berlaku lintas subdomain (admin./seller./apex) jika COOKIE_DOMAIN diset.
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  });

  return true;
}

export async function currentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: { include: { store: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
    cookieStore.set(SESSION_COOKIE, "", {
      path: "/",
      maxAge: 0,
      ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
    });
  }
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireSeller() {
  const user = await requireUser();
  if (!user.store) throw new Error("NO_STORE");
  return { user, store: user.store };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
