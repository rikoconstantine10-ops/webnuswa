import { db } from "./db";

// Catat notifikasi in-app seller. Best-effort — dipanggil berdampingan dengan email/WA
// di lib/notify.ts, tak pernah boleh menggagalkan alur utama (order/review/dispute dll).
export async function createNotification(
  storeId: string,
  type: string,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  try {
    await db.notification.create({ data: { storeId, type, title, body, link } });
  } catch (e) {
    console.error("[notification] gagal dicatat:", e);
  }
}
