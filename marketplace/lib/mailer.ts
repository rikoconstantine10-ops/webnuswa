import nodemailer from "nodemailer";
import { logError } from "./errors";

// Kirim email via SMTP jika dikonfigurasi; fallback ke console.log saat development.
// PENTING: kegagalan kirim email TIDAK boleh menggagalkan alur inti (login/OTP, notifikasi).
// Fungsi ini tidak pernah melempar — mengembalikan true bila terkirim/tercatat, false bila gagal.
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST) {
    console.log(`[MAILER:DEV] To: ${to} | ${subject}\n${text}`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });

    await transporter.sendMail({
      from: SMTP_FROM || "no-reply@localhost",
      to,
      subject,
      text,
    });
    return true;
  } catch (e) {
    await logError("mailer.sendMail", e, { to, subject });
    return false;
  }
}
