// Klien kie.ai — agregator API AI (image edit, chat/vision) yang dipakai untuk
// fitur "generate foto studio dari foto HP" + "generate caption produk".
// API key diatur admin lewat /admin/settings (tabel Setting, bukan .env) sesuai
// permintaan: satu key untuk seluruh platform, bukan per-seller.
import { db } from "./db";

const KIE_BASE = "https://api.kie.ai";

async function getKieApiKey(): Promise<string | null> {
  const s = await db.setting.findUnique({ where: { key: "kie_api_key" } });
  return s?.value?.trim() || null;
}

export async function kieAiEnabled(): Promise<boolean> {
  return Boolean(await getKieApiKey());
}

// Kuota generate AI per toko per bulan kalender. Seller PRO dapat kuota lebih besar.
export async function checkAiQuota(storeId: string): Promise<{ ok: boolean; used: number; limit: number }> {
  const store = await db.store.findUnique({ where: { id: storeId }, select: { plan: true, planUntil: true } });
  const proActive = store?.plan === "PRO" && store.planUntil !== null && store.planUntil > new Date();
  const limit = proActive ? 100 : 10;
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  const used = await db.aiGeneration.count({ where: { storeId, createdAt: { gte: since } } });
  return { ok: used < limit, used, limit };
}

type KieTaskState = "waiting" | "queuing" | "generating" | "success" | "fail" | string;

async function pollTask(taskId: string, apiKey: string, maxWaitMs = 90000): Promise<{ ok: boolean; urls?: string[]; error?: string }> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${KIE_BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const json = await res.json().catch(() => null);
    const state: KieTaskState | undefined = json?.data?.state;
    if (state === "success") {
      try {
        const result = JSON.parse(json.data.resultJson || "{}");
        return { ok: true, urls: Array.isArray(result.resultUrls) ? result.resultUrls : [] };
      } catch {
        return { ok: false, error: "Gagal membaca hasil generate" };
      }
    }
    if (state === "fail") {
      return { ok: false, error: json?.data?.failMsg || "Generate gagal di sisi provider" };
    }
  }
  return { ok: false, error: "Timeout menunggu hasil generate" };
}

export async function generateProductImage(input: { imageUrl: string; prompt: string }): Promise<{ ok: boolean; urls?: string[]; error?: string }> {
  const apiKey = await getKieApiKey();
  if (!apiKey) return { ok: false, error: "Fitur AI belum diaktifkan admin" };

  try {
    const createRes = await fetch(`${KIE_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/nano-banana-edit",
        input: {
          prompt: input.prompt,
          image_urls: [input.imageUrl],
          output_format: "png",
          aspect_ratio: "1:1",
        },
      }),
    });
    const createJson = await createRes.json().catch(() => null);
    const taskId = createJson?.data?.taskId;
    if (!taskId) return { ok: false, error: createJson?.msg || "Gagal membuat task generate" };
    return pollTask(taskId, apiKey);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function generateCaptions(input: { productName: string; imageUrl?: string; category?: string }): Promise<{ ok: boolean; captions?: string[]; error?: string }> {
  const apiKey = await getKieApiKey();
  if (!apiKey) return { ok: false, error: "Fitur AI belum diaktifkan admin" };

  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: `Buatkan 3 pilihan caption/deskripsi produk marketplace dalam Bahasa Indonesia untuk produk bernama "${input.productName}"${
        input.category ? ` (kategori: ${input.category})` : ""
      }. Tiap caption maksimal 2-3 kalimat, menarik untuk pembeli online, sebutkan manfaat produknya. Balas HANYA JSON array of string tanpa markdown, contoh persis: ["caption 1", "caption 2", "caption 3"]`,
    },
  ];
  if (input.imageUrl) {
    content.push({ type: "image_url", image_url: { url: input.imageUrl } });
  }

  try {
    const res = await fetch(`${KIE_BASE}/gemini-2.5-flash/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content }] }),
    });
    const json = await res.json().catch(() => null);
    const text: string | undefined = json?.choices?.[0]?.message?.content;
    if (!text) return { ok: false, error: json?.error?.message || "Gagal generate caption" };
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("format tidak sesuai");
    return { ok: true, captions: parsed.slice(0, 5).map((c) => String(c)) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memproses hasil caption" };
  }
}
