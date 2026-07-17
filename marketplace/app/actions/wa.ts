"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";

const VALID_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function parseHour(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return /^\d{2}:\d{2}$/.test(s) ? s : null;
}

// Persona + jadwal aktif bot WA — persona digabung dengan Global System Prompt (admin)
// saat runtime, bukan menggantikannya (lihat lib/waChat.ts).
export async function updateWaBotSettingsAction(formData: FormData) {
  const { store } = await requireSeller();

  const waPersonaPrompt = String(formData.get("waPersonaPrompt") ?? "").trim() || null;
  const waAutoReplyEnabled = formData.get("waAutoReplyEnabled") === "on";
  const waActiveDays = formData.getAll("waActiveDays").map(String).filter((d) => VALID_DAYS.includes(d));
  const waActiveHoursStart = parseHour(formData.get("waActiveHoursStart"));
  const waActiveHoursEnd = parseHour(formData.get("waActiveHoursEnd"));

  await db.store.update({
    where: { id: store.id },
    data: {
      waPersonaPrompt,
      waAutoReplyEnabled,
      waActiveDays,
      waActiveHoursStart: waActiveHoursStart || null,
      waActiveHoursEnd: waActiveHoursEnd || null,
    },
  });
  revalidatePath("/dashboard/store");
}

// ===== Knowledge Base (teks saja — media bot diambil otomatis dari katalog produk) =====

export async function createKnowledgeItemAction(formData: FormData) {
  const { store } = await requireSeller();
  const title = String(formData.get("title") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!title || !answer) return;

  const last = await db.waKnowledgeItem.findFirst({ where: { storeId: store.id }, orderBy: { sortOrder: "desc" } });
  await db.waKnowledgeItem.create({
    data: { storeId: store.id, title, answer, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  revalidatePath("/dashboard/store");
}

export async function updateKnowledgeItemAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!id || !title || !answer) return;

  await db.waKnowledgeItem.updateMany({ where: { id, storeId: store.id }, data: { title, answer } });
  revalidatePath("/dashboard/store");
}

export async function deleteKnowledgeItemAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.waKnowledgeItem.deleteMany({ where: { id, storeId: store.id } });
  revalidatePath("/dashboard/store");
}
