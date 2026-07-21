/**
 * nuswa-wa-service — WhatsApp gateway multi-sesi untuk marketplace.
 * Satu sesi Baileys per toko (storeId). Seller menghubungkan nomor WA-nya
 * sendiri lewat QR di dashboard; platform hanya menyediakan layanannya.
 *
 * Servis ini murni TRANSPORT — semua logika bot/persona/eskalasi ada di app utama
 * (lihat POST /api/wa/inbound). Pesan masuk (teks/gambar/voice note) diteruskan ke
 * app; app yang memutuskan balasannya, lalu memanggil endpoint /send di sini.
 *
 * API (semua butuh header x-api-key = WA_SERVICE_KEY):
 *   POST /sessions/:storeId/start   → mulai / lanjutkan sesi (QR terbit jika belum login)
 *   GET  /sessions/:storeId/status  → { status: disconnected|qr|connecting|connected, qr?: dataURL, phone? }
 *   POST /sessions/:storeId/send    → { to: "628xx", message?: "...", imageUrl?: "https://..." }
 *   POST /sessions/:storeId/logout  → putuskan & hapus kredensial
 *
 * Jalankan HANYA di localhost (bind 127.0.0.1) — jangan diekspos ke publik.
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const QRCode = require("qrcode");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadMediaMessage,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const PORT = parseInt(process.env.WA_PORT || "3006", 10);
const API_KEY = process.env.WA_SERVICE_KEY || "";
const SESSIONS_DIR = process.env.WA_SESSIONS_DIR || "./wa-sessions";
const APP_URL = process.env.APP_URL || "http://127.0.0.1:3005";
const logger = pino({ level: "warn" });

fs.mkdirSync(SESSIONS_DIR, { recursive: true });

/** storeId → { sock, status, qrDataUrl, phone, stopping } */
const sessions = new Map();

function sessionDir(storeId) {
  return path.join(SESSIONS_DIR, storeId.replace(/[^a-zA-Z0-9_-]/g, "_"));
}

// Ekstrak teks/media dari satu pesan Baileys. Tipe yang tak didukung (stiker, lokasi,
// dokumen, dst) diabaikan di v1 — cukup teks, gambar, dan voice note.
async function extractIncoming(msg) {
  const m = msg.message;
  if (!m) return null;

  if (m.conversation) return { text: m.conversation, mediaType: null };
  if (m.extendedTextMessage?.text) return { text: m.extendedTextMessage.text, mediaType: null };

  if (m.imageMessage) {
    try {
      const buf = await downloadMediaMessage(msg, "buffer", {});
      return {
        text: m.imageMessage.caption || null,
        mediaType: "image",
        mediaBase64: buf.toString("base64"),
        mediaMime: m.imageMessage.mimetype || "image/jpeg",
      };
    } catch (e) {
      console.error("[wa] gagal unduh gambar:", e.message);
      return null;
    }
  }

  if (m.audioMessage) {
    try {
      const buf = await downloadMediaMessage(msg, "buffer", {});
      return {
        text: null,
        mediaType: "audio",
        mediaBase64: buf.toString("base64"),
        mediaMime: m.audioMessage.mimetype || "audio/ogg",
      };
    } catch (e) {
      console.error("[wa] gagal unduh voice note:", e.message);
      return null;
    }
  }

  return null;
}

async function handleIncoming(storeId, sock, msg) {
  if (msg.key.fromMe) return;
  const remoteJid = msg.key.remoteJid || "";
  if (remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") return; // abaikan grup/status v1
  const from = remoteJid.split("@")[0];
  if (!from) return;

  const extracted = await extractIncoming(msg);
  if (!extracted || (!extracted.text && !extracted.mediaBase64)) return;

  // Tandai terbaca begitu diproses (read receipt untuk pembeli).
  sock.readMessages([msg.key]).catch(() => {});

  try {
    await fetch(`${APP_URL}/api/wa/inbound`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({
        storeId,
        from,
        pushName: msg.pushName || null,
        ...extracted,
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (e) {
    console.error(`[wa] gagal teruskan pesan masuk (${storeId}):`, e.message);
  }
}

async function startSession(storeId) {
  const existing = sessions.get(storeId);
  if (existing && ["connected", "connecting", "qr"].includes(existing.status)) return existing;

  const state = { sock: null, status: "connecting", qrDataUrl: null, phone: null, stopping: false };
  sessions.set(storeId, state);

  const { state: authState, saveCreds } = await useMultiFileAuthState(sessionDir(storeId));
  const sock = makeWASocket({ auth: authState, logger, printQRInTerminal: false });
  state.sock = sock;

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      state.status = "qr";
      state.qrDataUrl = await QRCode.toDataURL(qr, { width: 300 }).catch(() => null);
    }
    if (connection === "open") {
      state.status = "connected";
      state.qrDataUrl = null;
      state.phone = sock.user?.id?.split(":")[0] ?? null;
      console.log(`[wa] ${storeId} connected as ${state.phone}`);
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      state.status = "disconnected";
      state.qrDataUrl = null;
      if (loggedOut) {
        fs.rmSync(sessionDir(storeId), { recursive: true, force: true });
        sessions.delete(storeId);
        console.log(`[wa] ${storeId} logged out, creds removed`);
      } else if (!state.stopping) {
        console.log(`[wa] ${storeId} closed (code ${code}), reconnecting in 5s`);
        setTimeout(() => startSession(storeId).catch(() => {}), 5000);
      }
    }
  });

  sock.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      handleIncoming(storeId, sock, msg).catch((e) => console.error("[wa] handleIncoming error:", e.message));
    }
  });

  return state;
}

// Pulihkan semua sesi yang pernah login saat service restart.
for (const dir of fs.readdirSync(SESSIONS_DIR)) {
  if (fs.existsSync(path.join(SESSIONS_DIR, dir, "creds.json"))) {
    startSession(dir).catch((e) => console.error(`[wa] restore ${dir} gagal:`, e.message));
  }
}

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  if (!API_KEY || req.headers["x-api-key"] !== API_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
});

app.post("/sessions/:storeId/start", async (req, res) => {
  try {
    await startSession(req.params.storeId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/sessions/:storeId/status", (req, res) => {
  const s = sessions.get(req.params.storeId);
  if (!s) return res.json({ status: "disconnected" });
  res.json({ status: s.status, qr: s.qrDataUrl ?? undefined, phone: s.phone ?? undefined });
});

app.post("/sessions/:storeId/send", async (req, res) => {
  const s = sessions.get(req.params.storeId);
  if (!s || s.status !== "connected") {
    return res.status(409).json({ error: "wa belum terhubung" });
  }
  const { to, message, imageUrl } = req.body || {};
  const phone = String(to || "").replace(/\D/g, "");
  if (!phone || (!message && !imageUrl)) return res.status(400).json({ error: "to & message/imageUrl wajib" });
  const jid = `${phone}@s.whatsapp.net`;
  try {
    await s.sock.sendPresenceUpdate("composing", jid).catch(() => {});
    if (imageUrl) {
      await s.sock.sendMessage(jid, { image: { url: imageUrl }, caption: message ? String(message) : undefined });
    } else {
      await s.sock.sendMessage(jid, { text: String(message) });
    }
    await s.sock.sendPresenceUpdate("paused", jid).catch(() => {});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/sessions/:storeId/logout", async (req, res) => {
  const storeId = req.params.storeId;
  const s = sessions.get(storeId);
  if (s) {
    s.stopping = true;
    try {
      await s.sock?.logout();
    } catch {}
    sessions.delete(storeId);
  }
  fs.rmSync(sessionDir(storeId), { recursive: true, force: true });
  res.json({ ok: true });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`[wa] nuswa-wa-service listening on 127.0.0.1:${PORT}`);
});
