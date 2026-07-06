'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const QRCode = require('qrcode');

const db = require('./db');
const baileys = require('./baileys_manager');
const { getAIReply, getAIReplyWithMedia } = require('./ai');
const { smartSplit } = require('./smart_split');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'nuswalab-secret-2026';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'nuswalab123';

const UPLOADS_DIR = path.join(__dirname, '../data/uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve dashboard at /bot/
app.use('/bot', express.static(path.join(__dirname, '../public')));
app.get('/bot', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

// ── Auth middleware ───────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch(e) { res.status(401).json({ error: 'Invalid token' }); }
};

// ── Login ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USER || password !== ADMIN_PASS) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
app.get('/api/stats', auth, (req, res) => res.json(db.getStats()));

// ── WA Accounts ──────────────────────────────────────────────────────────────
app.get('/api/wa', auth, (req, res) => {
  const accounts = db.getWaAccounts();
  const status = baileys.getStatus();
  const result = accounts.map(a => ({ ...a, runtime_status: status[a.session_name]?.status || 'stopped', phone: status[a.session_name]?.phone || a.phone, hasQr: status[a.session_name]?.hasQr || false }));
  res.json(result);
});

app.post('/api/wa', auth, async (req, res) => {
  const { session_name, label, pairing_phone } = req.body;
  if (!session_name) return res.status(400).json({ error: 'session_name required' });
  const acct = db.createWaAccount(session_name, label);
  await baileys.connect(session_name, pairing_phone || null).catch(e => console.error('[START]', e.message));
  res.json(acct);
});

app.delete('/api/wa/:session', auth, async (req, res) => {
  await baileys.disconnect(req.params.session).catch(() => {});
  db.deleteWaAccount(req.params.session);
  res.json({ ok: true });
});

app.get('/api/wa/:session/qr', auth, async (req, res) => {
  const qr = baileys.getQR(req.params.session);
  if (!qr) return res.json({ qr: null, pairingCode: baileys.getPairingCode(req.params.session) });
  try {
    const dataUrl = await QRCode.toDataURL(qr, { width: 280 });
    res.json({ qr: dataUrl, pairingCode: null });
  } catch(e) { res.json({ qr: null }); }
});

app.post('/api/wa/:session/restart', auth, async (req, res) => {
  await baileys.disconnect(req.params.session).catch(() => {});
  await baileys.connect(req.params.session).catch(e => console.error('[RESTART]', e.message));
  res.json({ ok: true });
});

app.put('/api/wa/:session', auth, (req, res) => {
  const { label, system_prompt } = req.body;
  db.updateWaAccount(req.params.session, { label, system_prompt });
  res.json({ ok: true });
});

// ── Conversations ─────────────────────────────────────────────────────────────
app.get('/api/conversations', auth, (req, res) => res.json(db.getConversations(100)));
app.get('/api/messages/:phone', auth, (req, res) => res.json(db.getMessages(req.params.phone, 100)));

app.post('/api/send', auth, async (req, res) => {
  const { session_name, phone, message } = req.body;
  if (!session_name || !phone || !message) return res.status(400).json({ error: 'Missing fields' });
  try {
    await baileys.sendText(session_name, phone, message);
    db.saveMessage(phone, 'out', message, session_name);
    db.touchContactLastSeen(phone);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/contacts/:phone/pause', auth, (req, res) => {
  const { paused } = req.body;
  db.setBotPaused(req.params.phone, !!paused);
  res.json({ ok: true });
});

app.put('/api/contacts/:phone', auth, (req, res) => {
  const { name, notes, tags, label } = req.body;
  db.updateContact(req.params.phone, { name, notes, tags, label });
  res.json({ ok: true });
});

// ── Knowledge Base ────────────────────────────────────────────────────────────
app.get('/api/knowledge', auth, (req, res) => res.json(db.getAllKnowledge()));
app.post('/api/knowledge', auth, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing fields' });
  const r = db.addKnowledge(title, content);
  res.json({ ok: true, id: r.lastInsertRowid });
});
app.put('/api/knowledge/:id', auth, (req, res) => {
  db.updateKnowledge(req.params.id, req.body);
  res.json({ ok: true });
});
app.delete('/api/knowledge/:id', auth, (req, res) => {
  db.deleteKnowledge(req.params.id);
  res.json({ ok: true });
});

// ── Settings ──────────────────────────────────────────────────────────────────
app.get('/api/settings', auth, (req, res) => {
  const s = db.getAllSettings();
  // Mask keys
  const safe = { ...s };
  ['sumopod_key1','sumopod_key2','anthropic_key','ai_api_key','ai_fb2_key1','ai_fb2_key2'].forEach(k => { if (safe[k]) safe[k] = safe[k].slice(0,8) + '***'; });
  res.json(safe);
});
app.post('/api/settings', auth, (req, res) => {
  for (const [k, v] of Object.entries(req.body)) {
    if (typeof v === 'string') db.setSetting(k, v);
  }
  res.json({ ok: true });
});

// ── Media ─────────────────────────────────────────────────────────────────────
const upload = multer({ storage: multer.diskStorage({ destination: (req,file,cb) => cb(null, UPLOADS_DIR), filename: (req,file,cb) => cb(null, Date.now()+'_'+file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_')) }), limits: { fileSize: 50*1024*1024 } });

app.get('/api/media', auth, (req, res) => res.json(db.getMediaAssets()));
app.post('/api/media', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const r = db.addMediaAsset(req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.body.tags||'', req.body.description||'', req.body.ai_instruction||'');
  res.json({ ok: true, id: r.lastInsertRowid });
});
app.delete('/api/media/:id', auth, (req, res) => {
  const assets = db.getMediaAssets();
  const asset = assets.find(a => a.id == req.params.id);
  if (asset) { try { fs.unlinkSync(path.join(UPLOADS_DIR, asset.filename)); } catch(e) {} }
  db.deleteMediaAsset(req.params.id);
  res.json({ ok: true });
});

// ── Alias & stub routes for mantabot-compatible frontend ─────────────────────

// Auth / me
app.get('/api/me', auth, (req, res) => res.json({ username: req.user.username, role: req.user.role }));

// Dashboard stats aliases
app.get('/api/status', auth, (req, res) => res.json(db.getStats()));
app.get('/api/dashboard/stats', auth, (req, res) => res.json(db.getStats()));

// WA accounts aliases (mantabot uses /api/wa/accounts instead of /api/wa)
app.get('/api/wa/accounts', auth, (req, res) => {
  const accounts = db.getWaAccounts();
  const status = baileys.getStatus();
  const result = accounts.map(a => ({ ...a, runtime_status: status[a.session_name]?.status || 'stopped', phone: status[a.session_name]?.phone || a.phone, hasQr: status[a.session_name]?.hasQr || false }));
  res.json(result);
});
app.post('/api/wa/accounts', auth, async (req, res) => {
  const { session_name, label, pairing_phone } = req.body;
  if (!session_name) return res.status(400).json({ error: 'session_name required' });
  const acct = db.createWaAccount(session_name, label);
  await baileys.connect(session_name, pairing_phone || null).catch(e => console.error('[START]', e.message));
  res.json(acct);
});
app.get('/api/wa/accounts/:session', auth, (req, res) => {
  const accounts = db.getWaAccounts();
  const status = baileys.getStatus();
  const a = accounts.find(x => x.session_name === req.params.session);
  if (!a) return res.status(404).json({ error: 'Not found' });
  res.json({ ...a, runtime_status: status[a.session_name]?.status || 'stopped', phone: status[a.session_name]?.phone || a.phone, hasQr: status[a.session_name]?.hasQr || false });
});
app.put('/api/wa/accounts/:session', auth, (req, res) => {
  const { label, system_prompt, ai_enabled } = req.body;
  db.updateWaAccount(req.params.session, { label, system_prompt, ai_enabled });
  res.json({ ok: true });
});
app.delete('/api/wa/accounts/:session', auth, async (req, res) => {
  await baileys.disconnect(req.params.session).catch(() => {});
  db.deleteWaAccount(req.params.session);
  res.json({ ok: true });
});
app.post('/api/wa/accounts/:session/regenerate-webhook', auth, (req, res) => res.json({ ok: true, webhook_url: '' }));
app.post('/api/wa/accounts/:session/test', auth, async (req, res) => {
  const { phone, message } = req.body;
  try { await baileys.sendText(req.params.session, phone, message || 'Test'); res.json({ ok: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// WA connect/disconnect
app.post('/api/wa/:session/connect', auth, async (req, res) => {
  await baileys.connect(req.params.session).catch(e => console.error('[CONNECT]', e.message));
  res.json({ ok: true });
});
app.post('/api/wa/:session/disconnect', auth, async (req, res) => {
  await baileys.disconnect(req.params.session).catch(() => {});
  res.json({ ok: true });
});
app.get('/api/wa/:session/pairing-code', auth, (req, res) => {
  res.json({ pairingCode: baileys.getPairingCode(req.params.session) || null });
});
app.get('/api/baileys/status', auth, (req, res) => res.json(baileys.getStatus()));

// Contacts
app.get('/api/contacts', auth, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json(db.getConversations(limit));
});
app.get('/api/contacts/with-last-message', auth, (req, res) => res.json(db.getConversations(100)));
app.get('/api/contacts/:phone', auth, (req, res) => {
  const convs = db.getConversations(9999);
  const c = convs.find(x => x.phone === req.params.phone);
  res.json(c || { phone: req.params.phone });
});
app.post('/api/contacts/:phone/resume', auth, (req, res) => {
  db.setBotPaused(req.params.phone, false);
  res.json({ ok: true });
});
app.get('/api/messages/:phone/count', auth, (req, res) => {
  const msgs = db.getMessages(req.params.phone, 9999);
  res.json({ count: msgs.length });
});

// Stub routes for unimplemented features
app.get('/api/ig/accounts', auth, (req, res) => res.json([]));
app.post('/api/ig/login', auth, (req, res) => res.json({ ok: false, error: 'Not implemented' }));
app.delete('/api/ig/accounts/:id', auth, (req, res) => res.json({ ok: true }));
app.post('/api/ig/challenge', auth, (req, res) => res.json({ ok: false, error: 'Not implemented' }));

app.get('/api/meta/accounts', auth, (req, res) => res.json([]));
app.post('/api/meta/accounts', auth, (req, res) => res.json({ ok: false, error: 'Not implemented' }));
app.delete('/api/meta/accounts/:id', auth, (req, res) => res.json({ ok: true }));
app.put('/api/meta/accounts/:id', auth, (req, res) => res.json({ ok: true }));

app.get('/api/followup/templates', auth, (req, res) => res.json([]));
app.post('/api/followup/templates', auth, (req, res) => res.json({ ok: true, id: 1 }));
app.put('/api/followup/templates/:id', auth, (req, res) => res.json({ ok: true }));
app.delete('/api/followup/templates/:id', auth, (req, res) => res.json({ ok: true }));
app.get('/api/followup/queue', auth, (req, res) => res.json([]));
app.post('/api/followup/queue', auth, (req, res) => res.json({ ok: true }));
app.delete('/api/followup/queue/:id', auth, (req, res) => res.json({ ok: true }));
app.get('/api/followup/contact-history', auth, (req, res) => res.json([]));
app.get('/api/followup/contact-history/:phone', auth, (req, res) => res.json([]));

app.get('/api/broadcast', auth, (req, res) => res.json([]));
app.post('/api/broadcast', auth, (req, res) => res.json({ ok: true, id: 1 }));
app.put('/api/broadcast/:id', auth, (req, res) => res.json({ ok: true }));
app.delete('/api/broadcast/:id', auth, (req, res) => res.json({ ok: true }));
app.get('/api/broadcast/preview', auth, (req, res) => res.json({ count: 0 }));
app.get('/api/broadcast/:id/status', auth, (req, res) => res.json({ campaign: {}, stats: {}, recent: [] }));
app.post('/api/broadcast/:id/start', auth, (req, res) => res.json({ ok: true }));
app.post('/api/broadcast/:id/stop', auth, (req, res) => res.json({ ok: true }));
app.post('/api/broadcast/:id/delete', auth, (req, res) => res.json({ ok: true }));
app.post('/api/broadcast/upload-image', auth, upload.single('file'), (req, res) => res.json({ ok: true, path: '' }));

app.get('/api/webhook-info', auth, (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  const baseWebhook = `${host}/bot-api/api/webhook`;
  const accounts = db.getWaAccounts();
  const status = baileys.getStatus();
  res.json({
    webhook_url: baseWebhook,
    accounts: accounts.map(a => ({
      session: a.session_name,
      label: a.label || a.session_name,
      webhook_url: `${baseWebhook}/${a.session_name}`,
      status: status[a.session_name]?.status || 'stopped',
      phone: status[a.session_name]?.phone || a.phone || ''
    }))
  });
});

// ── Incoming webhook endpoint (external WA providers) ─────────────────────────
app.post('/api/webhook/:session', async (req, res) => {
  const { session } = req.params;
  const { phone, message, pushName, type } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });
  try {
    const acctRow = db.db.prepare('SELECT * FROM wa_accounts WHERE session_name = ?').get(session);
    const acctPrompt = acctRow?.system_prompt || '';
    db.upsertContact(phone, pushName || '', session);
    db.saveMessage(phone, 'in', message, session);
    db.touchContactLastSeen(phone);
    if (!db.isBotPaused(phone)) {
      const reply = await getAIReply(phone, message, acctPrompt);
      if (reply) {
        const { smartSplit } = require('./smart_split');
        const bubbles = smartSplit(reply);
        for (const bubble of bubbles) {
          if (!bubble.trim()) continue;
          await baileys.sendText(session, phone, bubble).catch(() => {});
          db.saveMessage(phone, 'out', bubble, session);
        }
      }
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users', auth, (req, res) => res.json([{ id: 1, username: ADMIN_USER, role: 'admin' }]));
app.post('/api/users', auth, (req, res) => res.json({ ok: true, id: 2 }));
app.put('/api/users/:id', auth, (req, res) => res.json({ ok: true }));
app.delete('/api/users/:id', auth, (req, res) => res.json({ ok: true }));

app.get('/api/ai/fetch-models', auth, (req, res) => res.json({ models: [] }));

// ── Incoming WA message handler ───────────────────────────────────────────────
baileys.on('message', async ({ sessionName, phone, pushName, text, type, raw }) => {
  try {
    const acctRow = db.db.prepare('SELECT * FROM wa_accounts WHERE session_name = ?').get(sessionName);
    const acctPrompt = acctRow?.system_prompt || '';

    db.upsertContact(phone, pushName, sessionName);
    db.saveMessage(phone, 'in', text || `[${type}]`, sessionName);
    db.touchContactLastSeen(phone);

    if (db.isBotPaused(phone)) { console.log('[BOT] Paused for', phone); return; }
    if (!text && type === 'text') return;

    let aiReply;
    if (type !== 'text' && type !== '' && raw?.message) {
      try {
        const mediaData = await baileys.downloadMedia(sessionName, raw);
        if (mediaData) {
          aiReply = await getAIReplyWithMedia(phone, text, mediaData, acctPrompt);
        } else {
          aiReply = await getAIReply(phone, text || `[${type} message]`, acctPrompt);
        }
      } catch(e) {
        aiReply = await getAIReply(phone, text || `[${type} message]`, acctPrompt);
      }
    } else {
      aiReply = await getAIReply(phone, text, acctPrompt);
    }

    if (!aiReply) return;

    // Handle [SEND_MEDIA:ID] tokens
    const mediaTokens = [...(aiReply.matchAll(/\[SEND_MEDIA:(\d+)\]/g))].map(m => parseInt(m[1]));
    const cleanReply = aiReply.replace(/\[SEND_MEDIA:\d+\]/g, '').trim();

    const bubbles = smartSplit(cleanReply);
    for (const bubble of bubbles) {
      if (!bubble.trim()) continue;
      const typingMs = Math.min(Math.max(bubble.length * 30, 500), 3000);
      await baileys.sendTyping(sessionName, phone, typingMs);
      await baileys.sendText(sessionName, phone, bubble);
      db.saveMessage(phone, 'out', bubble, sessionName);
      if (bubbles.length > 1) await new Promise(r => setTimeout(r, 300));
    }

    // Send media assets
    for (const mediaId of mediaTokens) {
      const assets = db.getMediaAssets();
      const asset = assets.find(a => a.id === mediaId);
      if (asset) {
        const filePath = path.join(UPLOADS_DIR, asset.filename);
        if (fs.existsSync(filePath)) {
          await baileys.sendMedia(sessionName, phone, filePath, '', asset.mimetype).catch(e => console.error('[MEDIA SEND]', e.message));
        }
      }
    }
  } catch(e) {
    console.error('[MESSAGE HANDLER]', e.message);
  }
});

baileys.on('connected', ({ sessionName, phone }) => {
  db.updateWaAccount(sessionName, { status: 'connected', phone });
  console.log('[BOT] WA connected:', sessionName, phone);
});
baileys.on('disconnected', ({ sessionName }) => {
  db.updateWaAccount(sessionName, { status: 'disconnected' });
});
baileys.on('logout', ({ sessionName }) => {
  db.updateWaAccount(sessionName, { status: 'stopped' });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  const accounts = db.getWaAccounts();
  if (accounts.length > 0) {
    console.log('[BOT] Auto-loading', accounts.length, 'WA session(s)...');
    await baileys.loadExistingSessions(accounts.map(a => a.session_name));
  }
  app.listen(PORT, () => console.log('[BOT] Nuswalab Bot running on port', PORT));
}

boot().catch(e => { console.error('[BOOT]', e.message); process.exit(1); });
