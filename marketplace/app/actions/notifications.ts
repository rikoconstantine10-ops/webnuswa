"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";

export async function markNotificationReadAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  await db.notification.updateMany({ where: { id, storeId: store.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard", "layout");
}

export async function markAllNotificationsReadAction() {
  const { store } = await requireSeller();
  await db.notification.updateMany({ where: { storeId: store.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard", "layout");
}
