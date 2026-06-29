import crypto from "crypto";

const PIXEL_ID = process.env.META_PIXEL_ID!;
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN!;
const API_URL = `https://graph.facebook.com/v20.0/${PIXEL_ID}/events`;

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export interface CAPIUserData {
  em?: string;
  ph?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
}

export interface CAPIEvent {
  event_name: string;
  event_time?: number;
  event_id?: string;
  event_source_url?: string;
  action_source?: "website" | "email" | "chat" | "other";
  user_data?: CAPIUserData;
  custom_data?: Record<string, unknown>;
}

export async function sendMetaCAPIEvent(events: CAPIEvent[]): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) return;

  const payload = {
    data: events.map((e) => ({
      event_name: e.event_name,
      event_time: e.event_time ?? Math.floor(Date.now() / 1000),
      event_id: e.event_id,
      event_source_url: e.event_source_url ?? "https://nuswalab.com",
      action_source: e.action_source ?? "website",
      user_data: e.user_data
        ? {
            ...e.user_data,
            em: e.user_data.em ? [sha256(e.user_data.em)] : undefined,
            ph: e.user_data.ph ? [sha256(e.user_data.ph.replace(/\D/g, ""))] : undefined,
          }
        : {},
      custom_data: e.custom_data,
    })),
  };

  try {
    const res = await fetch(`${API_URL}?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[CAPI] Error:", err);
    }
  } catch (e) {
    console.error("[CAPI] Fetch error:", e);
  }
}
