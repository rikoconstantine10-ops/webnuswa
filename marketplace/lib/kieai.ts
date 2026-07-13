// Klien provider AI generik (default kie.ai — agregator API image edit & chat/vision)
// yang dipakai untuk fitur "generate foto studio dari foto HP" + "generate caption produk".
// Generate foto dan generate caption punya konfigurasi TERPISAH (API key, base URL, model
// masing-masing) — diatur admin lewat /admin/settings (tabel Setting, bukan .env), bukan
// per-seller. Baris lama `kie_api_key` (satu key untuk keduanya) tetap dibaca sebagai
// fallback supaya konfigurasi yang sudah live tidak mendadak berhenti berfungsi.
import { db } from "./db";

const DEFAULT_BASE_URL = "https://api.kie.ai";
const DEFAULT_IMAGE_MODEL = "google/nano-banana-edit";
const DEFAULT_CAPTION_MODEL = "gemini-2.5-flash";

type ProviderConfig = { apiKey: string; baseUrl: string; model: string };

async function getSetting(key: string): Promise<string | null> {
  const s = await db.setting.findUnique({ where: { key } });
  return s?.value?.trim() || null;
}

async function getLegacyApiKey(): Promise<string | null> {
  return getSetting("kie_api_key");
}

export async function getImageConfig(): Promise<ProviderConfig | null> {
  const [apiKey, baseUrl, model, legacy] = await Promise.all([
    getSetting("ai_image_api_key"),
    getSetting("ai_image_base_url"),
    getSetting("ai_image_model"),
    getLegacyApiKey(),
  ]);
  const key = apiKey || legacy;
  if (!key) return null;
  return { apiKey: key, baseUrl: baseUrl || DEFAULT_BASE_URL, model: model || DEFAULT_IMAGE_MODEL };
}

export async function getCaptionConfig(): Promise<ProviderConfig | null> {
  const [apiKey, baseUrl, model, legacy] = await Promise.all([
    getSetting("ai_caption_api_key"),
    getSetting("ai_caption_base_url"),
    getSetting("ai_caption_model"),
    getLegacyApiKey(),
  ]);
  const key = apiKey || legacy;
  if (!key) return null;
  return { apiKey: key, baseUrl: baseUrl || DEFAULT_BASE_URL, model: model || DEFAULT_CAPTION_MODEL };
}

// Untuk render form /admin/settings — tampilkan base URL/model tersimpan (atau default)
// terlepas dari apakah API key sudah diisi atau belum.
export async function getAiSettingsForAdmin(): Promise<{
  image: { apiKeySet: boolean; baseUrl: string; model: string };
  caption: { apiKeySet: boolean; baseUrl: string; model: string };
}> {
  const [imgKey, imgBaseUrl, imgModel, capKey, capBaseUrl, capModel, legacy] = await Promise.all([
    getSetting("ai_image_api_key"),
    getSetting("ai_image_base_url"),
    getSetting("ai_image_model"),
    getSetting("ai_caption_api_key"),
    getSetting("ai_caption_base_url"),
    getSetting("ai_caption_model"),
    getLegacyApiKey(),
  ]);
  return {
    image: { apiKeySet: Boolean(imgKey || legacy), baseUrl: imgBaseUrl || DEFAULT_BASE_URL, model: imgModel || DEFAULT_IMAGE_MODEL },
    caption: { apiKeySet: Boolean(capKey || legacy), baseUrl: capBaseUrl || DEFAULT_BASE_URL, model: capModel || DEFAULT_CAPTION_MODEL },
  };
}

// Fitur AI dianggap "hidup" di level platform bila minimal salah satu (generate foto
// ATAU generate caption) sudah dikonfigurasi admin.
export async function kieAiEnabled(): Promise<boolean> {
  const [image, caption] = await Promise.all([getImageConfig(), getCaptionConfig()]);
  return Boolean(image || caption);
}

// Fitur aktif untuk toko ini bila: platform sudah punya minimal satu konfigurasi AI DAN
// admin sudah mengizinkan toko ini secara spesifik (Store.aiGenerationEnabled).
export async function storeAiEnabled(storeId: string): Promise<boolean> {
  const [platformEnabled, store] = await Promise.all([
    kieAiEnabled(),
    db.store.findUnique({ where: { id: storeId }, select: { aiGenerationEnabled: true } }),
  ]);
  return platformEnabled && Boolean(store?.aiGenerationEnabled);
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

async function pollTask(baseUrl: string, taskId: string, apiKey: string, maxWaitMs = 90000): Promise<{ ok: boolean; urls?: string[]; error?: string }> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${baseUrl}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
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
  const config = await getImageConfig();
  if (!config) return { ok: false, error: "Generate foto belum dikonfigurasi admin" };

  try {
    const createRes = await fetch(`${config.baseUrl}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
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
    return pollTask(config.baseUrl, taskId, config.apiKey);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function generateCaptions(input: { productName: string; imageUrl?: string; category?: string }): Promise<{ ok: boolean; captions?: string[]; error?: string }> {
  const config = await getCaptionConfig();
  if (!config) return { ok: false, error: "Generate caption belum dikonfigurasi admin" };

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
    const res = await fetch(`${config.baseUrl}/${config.model}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
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
