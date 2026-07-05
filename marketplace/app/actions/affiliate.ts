"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateAffiliateCode } from "@/lib/affiliate";

// Aktifkan diri sebagai afiliasi (buat kode unik sekali).
export async function becomeAffiliateAction() {
  const user = await requireUser();
  if (user.affiliateCode) return;
  let code = generateAffiliateCode(user.name || user.email);
  // Pastikan unik.
  for (let i = 0; i < 5; i++) {
    const exists = await db.user.findUnique({ where: { affiliateCode: code } });
    if (!exists) break;
    code = generateAffiliateCode(user.email);
  }
  await db.user.update({ where: { id: user.id }, data: { affiliateCode: code } });
  revalidatePath("/affiliate");
}
