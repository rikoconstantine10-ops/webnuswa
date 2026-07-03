import { db } from "./db";

// Normalisasi sumber traffic dari referer / parameter ?ref= / ?utm_source=.
export function detectSource(refParam?: string | null, referer?: string | null): string {
  const cand = (refParam || "").toLowerCase();
  if (cand) return cand.slice(0, 30);
  if (!referer) return "direct";
  try {
    const host = new URL(referer).hostname.toLowerCase();
    if (host.includes("instagram")) return "instagram";
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("facebook") || host.includes("fb.")) return "facebook";
    if (host.includes("whatsapp") || host.includes("wa.me")) return "whatsapp";
    if (host.includes("google")) return "google";
    if (host.includes("twitter") || host.includes("x.com")) return "x";
    return host.slice(0, 30) || "lainnya";
  } catch {
    return "direct";
  }
}

export function trackEvent(data: {
  type: "VIEW" | "CHECKOUT" | "PURCHASE";
  storeId?: string;
  productId?: string;
  source?: string;
}) {
  // Fire-and-forget: analitik tidak boleh mengganggu alur utama.
  db.analyticsEvent.create({ data }).catch(() => {});
}
