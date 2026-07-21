// Otak balasan chatbot WA. Prinsip anti-halusinasi: bot HANYA boleh menyebut harga/stok/
// status order dari data yang disuntikkan di konteks (katalog aktif, knowledge base, order
// pembeli) — kalau tidak ada data yang relevan, eskalasi ke manusia, jangan menebak.
import { db } from "./db";
import { callChatCompletion } from "./kieai";
import { formatRupiah } from "./money";

const DEFAULT_GLOBAL_PROMPT =
  "Kamu adalah asisten toko online di WhatsApp. HANYA jawab menggunakan data katalog/order/knowledge base " +
  "yang diberikan di konteks ini. JANGAN PERNAH mengarang harga, stok, atau perkiraan waktu pengiriman. " +
  "Jika pertanyaan pembeli tidak bisa dijawab dari data yang ada, atau menyangkut komplain/refund, katakan " +
  "akan diteruskan ke penjual — jangan menebak. Balas singkat, ramah, dan gunakan Bahasa Indonesia.";

const ESCALATION_KEYWORDS = [
  "komplain", "refund", "kecewa", "tipu", "penipuan", "manusia", "admin toko", "cs manusia",
  "bicara dengan", "customer service", "rusak", "cacat", "salah kirim", "tidak sesuai",
];

export function needsEscalation(text: string): boolean {
  const lower = text.toLowerCase();
  return ESCALATION_KEYWORDS.some((kw) => lower.includes(kw));
}

const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function isWithinBotSchedule(store: {
  waActiveDays: string[];
  waActiveHoursStart: string | null;
  waActiveHoursEnd: string | null;
}): boolean {
  const now = new Date();
  if (store.waActiveDays.length > 0) {
    const today = DAY_CODES[now.getDay()];
    if (!store.waActiveDays.includes(today)) return false;
  }
  if (store.waActiveHoursStart && store.waActiveHoursEnd) {
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (hhmm < store.waActiveHoursStart || hhmm > store.waActiveHoursEnd) return false;
  }
  return true;
}

// Cari produk aktif yang relevan dari kata di pesan pembeli (untuk kartu produk + auto-media).
async function findRelevantProducts(storeId: string, text: string) {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);
  if (words.length === 0) return [];
  return db.product.findMany({
    where: {
      storeId,
      active: true,
      moderation: "APPROVED",
      OR: words.map((w) => ({ name: { contains: w, mode: "insensitive" as const } })),
    },
    select: { id: true, name: true, price: true, salePrice: true, saleEndsAt: true, stock: true, imageUrl: true, slug: true },
    take: 3,
  });
}

async function findLatestOrder(storeId: string, buyerPhone: string) {
  return db.order.findFirst({
    where: { storeId, buyerPhone },
    orderBy: { createdAt: "desc" },
    select: {
      code: true, status: true, courier: true, trackingNumber: true, shipmentStatus: true, total: true,
    },
  });
}

async function findKnowledge(storeId: string) {
  return db.waKnowledgeItem.findMany({
    where: { storeId },
    orderBy: { sortOrder: "asc" },
    select: { title: true, answer: true },
    take: 20,
  });
}

type ReplyResult = { ok: true; text: string; imageUrl?: string } | { ok: false; escalate: true; reason: string };

export async function generateBotReply(
  store: {
    id: string;
    name: string;
    waPersonaPrompt: string | null;
  },
  buyerPhone: string,
  incomingText: string
): Promise<ReplyResult> {
  const [globalSetting, products, order, knowledge, history] = await Promise.all([
    db.setting.findUnique({ where: { key: "wa_global_system_prompt" } }),
    findRelevantProducts(store.id, incomingText),
    findLatestOrder(store.id, buyerPhone),
    findKnowledge(store.id),
    db.waConversation.findUnique({
      where: { storeId_buyerPhone: { storeId: store.id, buyerPhone } },
      select: { messages: { orderBy: { createdAt: "desc" }, take: 6, select: { direction: true, author: true, body: true } } },
    }),
  ]);

  const globalPrompt = globalSetting?.value?.trim() || DEFAULT_GLOBAL_PROMPT;
  const persona = store.waPersonaPrompt?.trim() || `Kamu adalah admin toko "${store.name}". Gaya bicara ramah dan santai.`;

  const catalogContext =
    products.length > 0
      ? products
          .map((p) => {
            const price = p.salePrice && p.saleEndsAt && p.saleEndsAt > new Date() ? p.salePrice : p.price;
            const stockNote = p.stock === null ? "tersedia" : p.stock > 0 ? `stok ${p.stock}` : "stok habis";
            return `- ${p.name}: ${formatRupiah(price)} (${stockNote})`;
          })
          .join("\n")
      : "(tidak ada produk katalog yang cocok dengan pertanyaan ini)";

  const orderContext = order
    ? `Order terakhir pembeli ini: ${order.code}, status ${order.status}${
        order.courier ? `, kurir ${order.courier}` : ""
      }${order.trackingNumber ? `, resi ${order.trackingNumber}` : ""}${
        order.shipmentStatus ? `, status kirim: ${order.shipmentStatus}` : ""
      }.`
    : "Pembeli ini belum punya order tercatat di toko ini.";

  const kbContext =
    knowledge.length > 0
      ? knowledge.map((k) => `Q: ${k.title}\nA: ${k.answer}`).join("\n\n")
      : "(belum ada knowledge base)";

  const historyContext =
    history?.messages
      .slice()
      .reverse()
      .map((m) => `${m.author === "BUYER" ? "Pembeli" : "Bot"}: ${m.body ?? "(media)"}`)
      .join("\n") || "(percakapan baru)";

  const systemPrompt = [
    globalPrompt,
    "",
    `Persona toko: ${persona}`,
    "",
    "=== KATALOG RELEVAN ===",
    catalogContext,
    "",
    "=== DATA ORDER PEMBELI ===",
    orderContext,
    "",
    "=== KNOWLEDGE BASE TOKO ===",
    kbContext,
  ].join("\n");

  const result = await callChatCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: `Riwayat percakapan singkat:\n${historyContext}\n\nPesan baru pembeli: ${incomingText}` },
  ]);

  if (!result.ok || !result.text) {
    return { ok: false, escalate: true, reason: result.error || "Chatbot gagal membalas" };
  }

  const text = result.text.trim();
  // Bot sendiri boleh memilih eskalasi kalau merasa tak yakin (diinstruksikan di global prompt).
  if (/diteruskan ke penjual|akan saya teruskan/i.test(text) && !order && products.length === 0) {
    return { ok: false, escalate: true, reason: "Bot tidak yakin, tidak ada data katalog/order yang cocok" };
  }

  const matchedProduct = products.find((p) => text.toLowerCase().includes(p.name.toLowerCase()));
  return { ok: true, text, imageUrl: matchedProduct?.imageUrl ?? undefined };
}
