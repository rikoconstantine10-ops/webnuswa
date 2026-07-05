import { db } from "./db";

// Ubah kode afiliasi (dari cookie nm_aff) → userId afiliasi. Tolak self-referral.
export async function resolveAffiliateUserId(
  code: string | undefined,
  buyerId: string | null
): Promise<string | null> {
  if (!code) return null;
  const aff = await db.user.findUnique({ where: { affiliateCode: code.toUpperCase() } });
  if (!aff) return null;
  if (buyerId && aff.id === buyerId) return null; // tidak boleh referral diri sendiri
  return aff.id;
}

// Buat kode afiliasi unik dari nama/email.
export function generateAffiliateCode(seed: string): string {
  const base = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "NM";
  return `${base}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
