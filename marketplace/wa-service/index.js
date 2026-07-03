/**
 * nuswa-wa-service — WhatsApp gateway multi-sesi untuk marketplace.
 * Satu sesi Baileys per toko (storeId). Seller menghubungkan nomor WA-nya
 * sendiri lewat QR di dashboard; platform hanya menyediakan layanannya.
 *
 * API (semua butuh header x-api-key = WA_SERVICE_KEY):
 *   POST /sessions/:storeId/start   → mulai / lanjutkan sesi (QR terbit jika belum login)
 *   GET  /sessions/:storeId/status  → { status: disconnected|qr|connecting|connected, qr?: dataURL, phone? }
 *   POST /sessions/:storeId/send    → { to: "628xx", message: "..." }
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
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const PORT = parseInt(process.env.WA_PORT || "3006", 10);
const API_KEY = process.env.WA_SERVICE_KEY || "";
const SESSIONS_DIR = process.env.WA_SESSIONS_DIR || "./wa-sessions";
const logger = pino({ level: "warn" });

fs.mkdirSync(SESSIONS_DIR, { recursive: true });

/** storeId → { sock, status, qrDataUrl, phone, stopping } */
const sessions = new Map();

function sessionDir(storeId) {
  return path.join(SESSIONS_DIR, storeId.replace(/[^a-zA-Z0-9_-]/g, "_"));
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

  return state;
}

// Pulihkan semua sesi yang pernah login saat service restart.
for (const dir of fs.readdirSync(SESSIONS_DIR)) {
  if (fs.existsSync(path.join(SESSIONS_DIR, dir, "creds.json"))) {
    startSession(dir).catch((e) => console.error(`[wa] restore ${dir} gagal:`, e.message));
  }
}

const app = express();
app.use(express.json());
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
  const { to, message } = req.body || {};
  const phone = String(to || "").replace(/\D/g, "");
  if (!phone || !message) return res.status(400).json({ error: "to & message wajib" });
  try {
    await s.sock.sendMessage(`${phone}@s.whatsapp.net`, { text: String(message) });
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
