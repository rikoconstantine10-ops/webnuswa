// Klien provider AI generik (default kie.ai — agregator API image/video edit & chat/vision)
// yang dipakai untuk fitur "generate foto/video studio dari foto HP", "generate caption
// produk", dan otak chatbot WA. Tiga fungsi (Foto, Video, Chatbot) punya SISTEM FALLBACK
// 3-TINGKAT (Utama → Cadangan 1 → Cadangan 2) — kalau satu provider gagal/timeout, sistem
// otomatis coba yang berikutnya. Caption & Transkrip Suara tetap 1 provider (tak diminta
// fallback). Semua diatur admin lewat /admin/settings (tabel Setting), bukan per-seller.
// Baris lama `kie_api_key` (satu key untuk Foto+Caption) tetap dibaca sebagai fallback
// legacy supaya konfigurasi yang sudah live tidak mendadak berhenti berfungsi.
import { db } from "./db";

const DEFAULT_BASE_URL = "https://api.kie.ai";
const DEFAULT_IMAGE_MODEL = "google/nano-banana-edit";
const DEFAULT_CAPTION_MODEL = "gemini-2.5-flash";
// Jumlah hasil generate — dipakai pemanggil (app/actions/ai.ts) untuk menentukan berapa
// kali generateProductImage/generateProductVideo dipanggil paralel dengan variasi prompt.
export const IMAGE_RESULT_COUNT = 4;
export const VIDEO_RESULT_COUNT = 1;

type ProviderConfig = { apiKey: string; baseUrl: string; model: string };
type Purpose = "image" | "video" | "chat";
type CallOutcome<T> = ({ ok: true } & T) | { ok: false; error: string };

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

// Transkrip suara (voice note WA) — single provider, mis. endpoint kompatibel Whisper.
export async function getVoiceConfig(): Promise<ProviderConfig | null> {
  const [apiKey, baseUrl, model] = await Promise.all([
    getSetting("ai_voice_api_key"),
    getSetting("ai_voice_base_url"),
    getSetting("ai_voice_model"),
  ]);
  if (!apiKey) return null;
  return { apiKey, baseUrl: baseUrl || DEFAULT_BASE_URL, model: model || "whisper-1" };
}

// ===== Provider dengan fallback 3-tingkat (Foto, Video, Chatbot WA) =====

function tiersSettingKey(purpose: Purpose): string {
  return `ai_${purpose}_providers`;
}

async function readTiersJson(purpose: Purpose): Promise<Array<Partial<ProviderConfig>>> {
  const raw = await getSetting(tiersSettingKey(purpose));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}

// Tiers siap-pakai (hanya yang API key/base URL/model-nya lengkap), urut prioritas.
export async function getProviderTiers(purpose: Purpose): Promise<ProviderConfig[]> {
  const stored = await readTiersJson(purpose);
  const usable = stored.filter(
    (t): t is ProviderConfig => Boolean(t?.apiKey && t?.baseUrl && t?.model)
  );
  if (usable.length > 0) return usable;
  // Belum ada tier tersimpan untuk "image" — pakai config lama (kompatibel kie_api_key legacy).
  if (purpose === "image") {
    const legacy = await getImageConfig();
    return legacy ? [legacy] : [];
  }
  return [];
}

// Untuk render form admin: selalu 3 slot (Utama/Cadangan 1/Cadangan 2), kosong bila belum diisi.
export async function getProviderTiersForAdmin(
  purpose: Purpose
): Promise<Array<{ apiKeySet: boolean; baseUrl: string; model: string }>> {
  const stored = await readTiersJson(purpose);
  const slots = [0, 1, 2].map((i) => ({
    apiKeySet: Boolean(stored[i]?.apiKey),
    baseUrl: stored[i]?.baseUrl || "",
    model: stored[i]?.model || "",
  }));
  // Slot pertama: kalau belum pernah diisi tier JSON, cerminkan config lama (khusus image).
  if (purpose === "image" && stored.length === 0) {
    const legacy = await getImageConfig();
    slots[0] = legacy
      ? { apiKeySet: true, baseUrl: legacy.baseUrl, model: legacy.model }
      : { apiKeySet: false, baseUrl: DEFAULT_BASE_URL, model: DEFAULT_IMAGE_MODEL };
  }
  return slots;
}

// Simpan 3 slot tier. API key kosong di form = "jangan ubah" (pertahankan yang tersimpan),
// supaya admin bisa ganti base URL/model tanpa perlu tempel ulang API key tiap kali.
export async function saveProviderTiers(
  purpose: Purpose,
  submitted: Array<{ apiKey: string; baseUrl: string; model: string }>
): Promise<void> {
  let existing = await readTiersJson(purpose);
  // Simpanan pertama kali untuk "image": kalau belum ada tier JSON sama sekali, pertahankan
  // API key lama (kie_api_key/ai_image_api_key) di slot Utama supaya tidak hilang tanpa sengaja.
  if (purpose === "image" && existing.length === 0) {
    const legacy = await getImageConfig();
    if (legacy) existing = [legacy];
  }
  const merged = submitted.slice(0, 3).map((t, i) => ({
    apiKey: t.apiKey.trim() || existing[i]?.apiKey || "",
    baseUrl: t.baseUrl.trim(),
    model: t.model.trim(),
  }));
  await db.setting.upsert({
    where: { key: tiersSettingKey(purpose) },
    create: { key: tiersSettingKey(purpose), value: JSON.stringify(merged) },
    update: { value: JSON.stringify(merged) },
  });
}

// Coba tiap tier berurutan (Utama → Cadangan 1 → Cadangan 2) sampai salah satu berhasil.
// Kalau semua gagal, kembalikan error dari percobaan terakhir.
export async function callWithFallback<T>(
  purpose: Purpose,
  fn: (tier: ProviderConfig) => Promise<CallOutcome<T>>
): Promise<CallOutcome<T>> {
  const tiers = await getProviderTiers(purpose);
  if (tiers.length === 0) {
    return { ok: false, error: `Fitur belum dikonfigurasi admin (${purpose})` };
  }
  let lastError = "Semua provider gagal";
  for (const tier of tiers) {
    try {
      const result = await fn(tier);
      if (result.ok) return result;
      lastError = result.error;
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Network error";
    }
  }
  return { ok: false, error: lastError };
}

// Untuk render form /admin/settings.
export async function getAiSettingsForAdmin(): Promise<{
  caption: { apiKeySet: boolean; baseUrl: string; model: string };
  voice: { apiKeySet: boolean; baseUrl: string; model: string };
  imageTiers: Array<{ apiKeySet: boolean; baseUrl: string; model: string }>;
  videoTiers: Array<{ apiKeySet: boolean; baseUrl: string; model: string }>;
  chatTiers: Array<{ apiKeySet: boolean; baseUrl: string; model: string }>;
}> {
  const [capKey, capBaseUrl, capModel, legacy, voiceKey, voiceBaseUrl, voiceModel, imageTiers, videoTiers, chatTiers] =
    await Promise.all([
      getSetting("ai_caption_api_key"),
      getSetting("ai_caption_base_url"),
      getSetting("ai_caption_model"),
      getLegacyApiKey(),
      getSetting("ai_voice_api_key"),
      getSetting("ai_voice_base_url"),
      getSetting("ai_voice_model"),
      getProviderTiersForAdmin("image"),
      getProviderTiersForAdmin("video"),
      getProviderTiersForAdmin("chat"),
    ]);
  return {
    caption: {
      apiKeySet: Boolean(capKey || legacy),
      baseUrl: capBaseUrl || DEFAULT_BASE_URL,
      model: capModel || DEFAULT_CAPTION_MODEL,
    },
    voice: { apiKeySet: Boolean(voiceKey), baseUrl: voiceBaseUrl || DEFAULT_BASE_URL, model: voiceModel || "whisper-1" },
    imageTiers,
    videoTiers,
    chatTiers,
  };
}

// Fitur AI Studio dianggap "hidup" bila generate foto ATAU caption sudah dikonfigurasi.
export async function kieAiEnabled(): Promise<boolean> {
  const [imageTiers, caption] = await Promise.all([getProviderTiers("image"), getCaptionConfig()]);
  return imageTiers.length > 0 || Boolean(caption);
}

export type AiFeature = "image" | "video" | "caption" | "chat";

const FEATURE_FIELD = {
  image: "aiImageEnabled",
  video: "aiVideoEnabled",
  caption: "aiCaptionEnabled",
  chat: "aiChatEnabled",
} as const;

async function platformFeatureConfigured(feature: AiFeature): Promise<boolean> {
  if (feature === "caption") return Boolean(await getCaptionConfig());
  return (await getProviderTiers(feature)).length > 0;
}

// Fitur (foto/video/caption/chatbot) aktif untuk toko ini bila: platform sudah punya
// konfigurasi provider untuk fungsi itu DAN admin sudah mengizinkan toko ini secara spesifik
// per-fitur (Store.aiImageEnabled/aiVideoEnabled/aiCaptionEnabled/aiChatEnabled) — toggle
// granular ini independen dari Store.aiGenerationEnabled (toggle cepat lama di halaman Seller).
export async function storeAiFeatureEnabled(storeId: string, feature: AiFeature): Promise<boolean> {
  const [platformOk, store] = await Promise.all([
    platformFeatureConfigured(feature),
    db.store.findUnique({
      where: { id: storeId },
      select: { aiImageEnabled: true, aiVideoEnabled: true, aiCaptionEnabled: true, aiChatEnabled: true },
    }),
  ]);
  return platformOk && Boolean(store?.[FEATURE_FIELD[feature]]);
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

async function pollTask(
  baseUrl: string,
  taskId: string,
  apiKey: string,
  maxWaitMs = 90000
): Promise<{ ok: boolean; urls?: string[]; error?: string }> {
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

// Generate 1 foto produk bergaya studio dari 1 foto HP (prompt disusun oleh pemanggil —
// lihat app/actions/ai.ts yang memanggil fungsi ini beberapa kali paralel dengan variasi
// prompt berbeda untuk menghasilkan beberapa opsi foto sekaligus).
export async function generateProductImage(
  input: { imageUrl: string; prompt: string }
): Promise<{ ok: boolean; urls?: string[]; error?: string }> {
  return callWithFallback<{ urls: string[] }>("image", async (config) => {
    const createRes = await fetch(`${config.baseUrl}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        input: { prompt: input.prompt, image_urls: [input.imageUrl], output_format: "png", aspect_ratio: "1:1" },
      }),
    });
    const createJson = await createRes.json().catch(() => null);
    const taskId = createJson?.data?.taskId;
    if (!taskId) return { ok: false, error: createJson?.msg || "Gagal membuat task generate" };
    const polled = await pollTask(config.baseUrl, taskId, config.apiKey);
    if (!polled.ok) return { ok: false, error: polled.error || "Generate gagal" };
    return { ok: true, urls: polled.urls ?? [] };
  });
}

// Generate 1 video showcase produk dari 1 foto HP — konsep sama seperti foto (prompt
// disusun pemanggil), tapi cuma dipanggil 1x (video lebih berat/lambat/mahal per generate).
export async function generateProductVideo(
  input: { imageUrl: string; prompt: string }
): Promise<{ ok: boolean; urls?: string[]; error?: string }> {
  return callWithFallback<{ urls: string[] }>("video", async (config) => {
    const createRes = await fetch(`${config.baseUrl}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        input: { prompt: input.prompt, image_url: input.imageUrl, duration: "5" },
      }),
    });
    const createJson = await createRes.json().catch(() => null);
    const taskId = createJson?.data?.taskId;
    if (!taskId) return { ok: false, error: createJson?.msg || "Gagal membuat task generate video" };
    const polled = await pollTask(config.baseUrl, taskId, config.apiKey, 180000);
    if (!polled.ok) return { ok: false, error: polled.error || "Generate video gagal" };
    return { ok: true, urls: (polled.urls ?? []).slice(0, VIDEO_RESULT_COUNT) };
  });
}

// Otak chatbot WA — chat completion generik (format OpenAI-compatible, sama seperti
// generateCaptions) dengan fallback 3-tingkat via callWithFallback("chat", ...).
export async function callChatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<{ ok: boolean; text?: string; error?: string }> {
  return callWithFallback<{ text: string }>("chat", async (config) => {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.model, messages, stream: false }),
      signal: AbortSignal.timeout(45000),
    });
    const json = await res.json().catch(() => null);
    const text: string | undefined = json?.choices?.[0]?.message?.content;
    if (!text) return { ok: false, error: json?.error?.message || "Chatbot gagal membalas" };
    return { ok: true, text };
  });
}

// Transkrip voice note pembeli (format Whisper-compatible) — single provider, hasil
// dipakai sebagai pengganti teks pesan masuk sebelum diproses chatbot.
export async function transcribeVoice(
  audioBase64: string,
  mimeType: string
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const config = await getVoiceConfig();
  if (!config) return { ok: false, error: "Transkrip suara belum dikonfigurasi admin" };

  try {
    const ext = mimeType.includes("mpeg") ? "mp3" : mimeType.includes("wav") ? "wav" : "ogg";
    const form = new FormData();
    form.append("model", config.model);
    form.append(
      "file",
      new Blob([Buffer.from(audioBase64, "base64")], { type: mimeType }),
      `voice.${ext}`
    );
    const res = await fetch(`${config.baseUrl}/v1/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: form,
      signal: AbortSignal.timeout(45000),
    });
    const json = await res.json().catch(() => null);
    if (!json?.text) return { ok: false, error: json?.error?.message || "Gagal transkrip suara" };
    return { ok: true, text: String(json.text) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memproses audio" };
  }
}

// mode "social" = caption postingan sosmed (santai, ajak interaksi).
// mode "ad" = copy iklan (hook kuat, ringkas, CTA jelas) — relevan karena toko sudah
// bisa pasang Meta Pixel/CAPI, jadi seller yang beriklan itu nyata.
export async function generateCaptions(
  input: { productName: string; imageUrl?: string; category?: string; mode?: "social" | "ad" }
): Promise<{ ok: boolean; captions?: string[]; error?: string }> {
  const config = await getCaptionConfig();
  if (!config) return { ok: false, error: "Generate caption belum dikonfigurasi admin" };

  const mode = input.mode ?? "social";
  const categoryNote = input.category ? ` (kategori: ${input.category})` : "";
  const instruction =
    mode === "ad"
      ? `Buatkan 3 pilihan copy IKLAN (Meta/Instagram Ads) dalam Bahasa Indonesia untuk produk "${input.productName}"${categoryNote}. Tiap copy: hook kuat di kalimat pertama, ringkas (maks 2 kalimat), sebutkan manfaat utama, tutup dengan ajakan bertindak yang jelas (mis. "Order sekarang", "Diskon hari ini"). Hindari klaim berlebihan.`
      : `Buatkan 3 pilihan caption/deskripsi produk marketplace dalam Bahasa Indonesia untuk produk bernama "${input.productName}"${categoryNote}. Tiap caption maksimal 2-3 kalimat, menarik untuk pembeli online, sebutkan manfaat produknya.`;

  const content: Array<Record<string, unknown>> = [
    { type: "text", text: `${instruction} Balas HANYA JSON array of string tanpa markdown, contoh persis: ["opsi 1", "opsi 2", "opsi 3"]` },
  ];
  if (input.imageUrl) {
    content.push({ type: "image_url", image_url: { url: input.imageUrl } });
  }

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.model, messages: [{ role: "user", content }], stream: false }),
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
