"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth";

const schema = z.object({
  code: z.string().min(3).max(24).transform((s) => s.trim().toUpperCase().replace(/\s+/g, "")),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().min(1),
  minSpend: z.coerce.number().int().min(0).default(0),
  maxDiscount: z.coerce.number().int().min(0).default(0),
  quota: z.coerce.number().int().min(0).default(0),
  endsAt: z.string().optional(),
});

export async function createVoucherAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const { store } = await requireSeller();
  const parsed = schema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minSpend: formData.get("minSpend") || 0,
    maxDiscount: formData.get("maxDiscount") || 0,
    quota: formData.get("quota") || 0,
    endsAt: formData.get("endsAt") || undefined,
  });
  if (!parsed.success) return { error: "Data voucher tidak valid" };
  const d = parsed.data;
  if (d.type === "PERCENT" && d.value > 100) return { error: "Persentase maksimal 100" };

  const exists = await db.voucher.findUnique({ where: { code: d.code } });
  if (exists) return { error: "Kode voucher sudah dipakai" };

  await db.voucher.create({
    data: {
      code: d.code,
      storeId: store.id,
      type: d.type,
      value: d.value,
      minSpend: d.minSpend,
      maxDiscount: d.maxDiscount,
      quota: d.quota,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
    },
  });
  revalidatePath("/dashboard/vouchers");
  return { ok: true };
}

export async function toggleVoucherAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const v = await db.voucher.findUnique({ where: { id } });
  if (v && v.storeId === store.id) {
    await db.voucher.update({ where: { id }, data: { active: !v.active } });
  }
  revalidatePath("/dashboard/vouchers");
}

export async function deleteVoucherAction(formData: FormData) {
  const { store } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  const v = await db.voucher.findUnique({ where: { id } });
  if (v && v.storeId === store.id) await db.voucher.delete({ where: { id } });
  revalidatePath("/dashboard/vouchers");
}
