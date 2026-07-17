import { createHash, randomUUID } from "crypto";

// Facebook Conversions API (server-side) per toko. Event Purchase dikirim dari
// server saat order lunas, dengan event_id yang sama seperti Pixel client agar
// ter-deduplikasi. Data pembeli di-hash SHA256 sesuai ketentuan Meta.

function sha256(v?: string | null): string | undefined {
  if (!v) return undefined;
  return createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
}

export function genEventId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function capiPurchase(
  store: { metaPixelId: string | null; metaCapiToken: string | null },
  order: {
    id: string;
    total: number;
    buyerEmail: string;
    buyerPhone: string | null;
    buyerName: string;
  },
  eventId?: string
) {
  const pixelId = store.metaPixelId;
  const token = store.metaCapiToken;
  if (!pixelId || !token) return;

  const appUrl = process.env.APP_URL || "";
  const body = JSON.stringify({
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId || `purchase_${order.id}`,
        action_source: "website",
        event_source_url: `${appUrl}/order`,
        user_data: {
          em: sha256(order.buyerEmail) ? [sha256(order.buyerEmail)] : undefined,
          ph: sha256(order.buyerPhone) ? [sha256(order.buyerPhone)] : undefined,
          fn: sha256(order.buyerName.split(" ")[0]) ? [sha256(order.buyerName.split(" ")[0])] : undefined,
        },
        custom_data: { currency: "IDR", value: order.total },
      },
    ],
  });

  // Fire-and-forget ke Meta Graph API.
  fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: AbortSignal.timeout(6000),
  })
    .then((r) => r.text())
    .then((t) => console.log("[CAPI]", t.slice(0, 200)))
    .catch((e) => console.error("[CAPI error]", e.message));
}

// ViewContent server-side — dipanggil saat landing page (funnel 1-produk) dibuka, supaya
// seller yang jalankan iklan FB/IG dapat sinyal optimasi selain cuma Purchase.
export function capiViewContent(
  store: { metaPixelId: string | null; metaCapiToken: string | null },
  product: { id: string; name: string; price: number },
  eventId?: string
) {
  const pixelId = store.metaPixelId;
  const token = store.metaCapiToken;
  if (!pixelId || !token) return;

  const appUrl = process.env.APP_URL || "";
  const body = JSON.stringify({
    data: [
      {
        event_name: "ViewContent",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId || genEventId("view"),
        action_source: "website",
        event_source_url: `${appUrl}/l`,
        custom_data: { currency: "IDR", value: product.price, content_ids: [product.id], content_name: product.name, content_type: "product" },
      },
    ],
  });

  fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: AbortSignal.timeout(6000),
  })
    .then((r) => r.text())
    .then((t) => console.log("[CAPI]", t.slice(0, 200)))
    .catch((e) => console.error("[CAPI error]", e.message));
}
