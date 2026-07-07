'use strict';
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

const SESSIONS_DIR = path.join(__dirname, '../data/baileys_sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

class BaileysManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.reconnectTimers = new Map();
  }

  async connect(sessionName, pairingPhone = null) {
    if (this.sessions.has(sessionName)) {
      const s = this.sessions.get(sessionName);
      if (s.status === 'connected') return;
      if (s.sock) { try { s.sock.ws?.close(); } catch(e) {} }
      if (this.reconnectTimers.has(sessionName)) { clearTimeout(this.reconnectTimers.get(sessionName)); this.reconnectTimers.delete(sessionName); }
      this.sessions.delete(sessionName);
    }

    console.log('[BAILEYS] Connecting:', sessionName);
    const sessionDir = path.join(SESSIONS_DIR, sessionName);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
      browser: Browsers.macOS('Safari'),
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
    });

    this.sessions.set(sessionName, { sock, qr: null, status: 'connecting', phone: null, pairingCode: null, pairingRequested: false, pairingPhone: pairingPhone || null });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        const session = this.sessions.get(sessionName);
        if (session) session.qr = qr;
        if (pairingPhone && session && !session.pairingRequested) {
          session.pairingRequested = true;
          try {
            const cleanPhone = String(pairingPhone).replace(/[^0-9]/g, '');
            const pCode = await sock.requestPairingCode(cleanPhone);
            session.pairingCode = pCode;
            console.log('[BAILEYS] Pairing code for', sessionName, ':', pCode);
            this.emit('pairing_code', { sessionName, code: pCode });
          } catch(pe) { console.error('[BAILEYS] Pairing code error:', pe.message); }
        } else {
          this.emit('qr', { sessionName, qr });
        }
      }
      if (connection === 'open') {
        const session = this.sessions.get(sessionName);
        const phone = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0] || '';
        if (session) { session.status = 'connected'; session.qr = null; session.phone = phone; }
        console.log('[BAILEYS]', sessionName, 'connected! Phone:', phone);
        this.emit('connected', { sessionName, phone });
        if (this.reconnectTimers.has(sessionName)) { clearTimeout(this.reconnectTimers.get(sessionName)); this.reconnectTimers.delete(sessionName); }
      }
      if (connection === 'close') {
        const session = this.sessions.get(sessionName);
        if (session) session.status = 'disconnected';
        const statusCode = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output.statusCode : null;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log('[BAILEYS]', sessionName, 'closed. Code:', statusCode, '| Reconnect:', shouldReconnect);
        this.emit('disconnected', { sessionName, statusCode, shouldReconnect });
        if (shouldReconnect) {
          const delay = statusCode === 408 ? 30000 : 5000;
          const savedPairingPhone = session?.pairingPhone || null;
          const timer = setTimeout(() => {
            this.connect(sessionName, savedPairingPhone).catch(e => console.error('[BAILEYS] Reconnect error:', e.message));
          }, delay);
          this.reconnectTimers.set(sessionName, timer);
        } else {
          console.log('[BAILEYS]', sessionName, 'logged out. Deleting session...');
          this.sessions.delete(sessionName);
          try { fs.rmSync(path.join(SESSIONS_DIR, sessionName), { recursive: true, force: true }); } catch(e) {}
          this.emit('logout', { sessionName });
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' && type !== 'append') return;
      for (const msg of messages) {
        try {
          if (msg.key.fromMe) continue;
          const remoteJid = msg.key.remoteJid || '';
          const isGroup = remoteJid.endsWith('@g.us');
          if (isGroup || remoteJid === 'status@broadcast') continue;

          let phone = '';
          if (remoteJid.includes('@s.whatsapp.net')) {
            phone = remoteJid.split('@')[0].replace(/[^0-9]/g, '');
          } else if (remoteJid.includes('@lid')) {
            try { const pnM=sock.signalRepository?.lidMapping; if(pnM){const pnJ=await pnM.getPNForLID(remoteJid).catch(()=>null);if(pnJ)phone=String(pnJ).split('@')[0].replace(/[^0-9]/g,'');} } catch(e){}
            if(!phone){const pt=msg.key.participant||msg.participant||'';if(pt&&pt.includes('@s.whatsapp.net'))phone=pt.split('@')[0].replace(/[^0-9]/g,'');}
            if(!phone) phone='lid_'+remoteJid.split('@')[0];
          } else {
            phone = remoteJid.split('@')[0].replace(/[^0-9]/g, '');
          }
          if (!phone) continue;

          const pushName = msg.pushName || phone;
          const msgContent = msg.message || {};
          const innerContent = msgContent.ephemeralMessage?.message || msgContent;
          const text =
            innerContent.conversation ||
            innerContent.extendedTextMessage?.text ||
            innerContent.imageMessage?.caption ||
            innerContent.videoMessage?.caption ||
            innerContent.documentMessage?.caption ||
            innerContent.interactiveResponseMessage?.body?.text ||
            innerContent.listResponseMessage?.title ||
            innerContent.buttonsResponseMessage?.selectedDisplayText ||
            '';
          const msgType = msgContent.imageMessage ? 'image' : msgContent.videoMessage ? 'video' : msgContent.audioMessage ? 'audio' : 'text';

          this.emit('message', { sessionName, phone, pushName, text: String(text || ''), type: msgType, isGroup, realJid: remoteJid, raw: msg });
          try { await sock.readMessages([msg.key]); } catch(e) {}
        } catch(e) { console.error('[BAILEYS] Message parse error:', e.message); }
      }
    });

    return sock;
  }

  async downloadMedia(sessionName, rawMsg) {
    const session = this.sessions.get(sessionName);
    if (!session || !session.sock) throw new Error('Session not connected');
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const msgContent = rawMsg.message || {};
    let stream, mimeType, msgType;
    if (msgContent.imageMessage) { stream = await downloadContentFromMessage(msgContent.imageMessage, 'image'); mimeType = msgContent.imageMessage.mimetype||'image/jpeg'; msgType='image'; }
    else if (msgContent.videoMessage) { stream = await downloadContentFromMessage(msgContent.videoMessage, 'video'); mimeType = msgContent.videoMessage.mimetype||'video/mp4'; msgType='video'; }
    else if (msgContent.audioMessage) { stream = await downloadContentFromMessage(msgContent.audioMessage, 'audio'); mimeType = msgContent.audioMessage.mimetype||'audio/ogg'; msgType='audio'; }
    else return null;
    const chunks = []; for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    return { buffer, mimeType, msgType, base64: buffer.toString('base64') };
  }

  async sendTyping(sessionName, phone, durationMs) {
    try {
      const session = this.sessions.get(sessionName);
      if (!session || !session.sock) return;
      const jid = phone.includes('@') ? phone : phone.replace(/[^0-9]/g,'') + '@s.whatsapp.net';
      await session.sock.sendPresenceUpdate('composing', jid);
      await new Promise(r => setTimeout(r, durationMs || 1000));
      await session.sock.sendPresenceUpdate('paused', jid);
    } catch(e) {}
  }

  async sendText(sessionName, phone, text) {
    const session = this.sessions.get(sessionName);
    if (!session || session.status !== 'connected') throw new Error('Session ' + sessionName + ' not connected');
    const jid = phone.includes('@') ? phone : String(phone).replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await session.sock.sendMessage(jid, { text: String(text) });
    return true;
  }

  async sendMedia(sessionName, phone, filePath, caption, mimetype) {
    const session = this.sessions.get(sessionName);
    if (!session || session.status !== 'connected') throw new Error('Session ' + sessionName + ' not connected');
    const jid = phone.includes('@') ? phone : phone + '@s.whatsapp.net';
    const buf = fs.readFileSync(filePath);
    const mime = mimetype || 'application/octet-stream';
    let msg;
    if (mime.startsWith('image/')) msg = { image: buf, caption: caption||'', mimetype: mime };
    else if (mime.startsWith('video/')) msg = { video: buf, caption: caption||'', mimetype: mime };
    else msg = { document: buf, caption: caption||'', mimetype: mime, fileName: path.basename(filePath) };
    await session.sock.sendMessage(jid, msg);
    return true;
  }

  async disconnect(sessionName) {
    const session = this.sessions.get(sessionName);
    if (!session) return;
    if (this.reconnectTimers.has(sessionName)) { clearTimeout(this.reconnectTimers.get(sessionName)); this.reconnectTimers.delete(sessionName); }
    try { await session.sock.logout(); } catch(e) {}
    this.sessions.delete(sessionName);
  }

  getStatus() {
    const result = {};
    for (const [name, s] of this.sessions) { result[name] = { status: s.status, phone: s.phone, hasQr: !!s.qr }; }
    return result;
  }

  getQR(sessionName) { const s = this.sessions.get(sessionName); return s ? s.qr : null; }
  getPairingCode(sessionName) { const s = this.sessions.get(sessionName); return s ? s.pairingCode : null; }

  async getProfilePicture(sessionName, phone) {
    const session = this.sessions.get(sessionName);
    if (!session || session.status !== 'connected') return null;
    try { const jid = phone.includes('@') ? phone : phone + '@s.whatsapp.net'; return await session.sock.profilePictureUrl(jid, 'image') || null; } catch(e) { return null; }
  }

  async loadExistingSessions(sessionNames) {
    for (const name of sessionNames) {
      const sessionDir = path.join(SESSIONS_DIR, name);
      if (fs.existsSync(sessionDir)) {
        console.log('[BAILEYS] Auto-loading session:', name);
        await this.connect(name).catch(e => console.error('[BAILEYS] Load error:', name, e.message));
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}

module.exports = new BaileysManager();
