'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(__dirname, '../data/data.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// Auto-migration
const migrations = [
  'ALTER TABLE contacts ADD COLUMN profile_pic TEXT',
  'ALTER TABLE contacts ADD COLUMN phone_display TEXT',
  'ALTER TABLE contacts ADD COLUMN bot_paused INTEGER DEFAULT 0',
  'ALTER TABLE contacts ADD COLUMN last_seen DATETIME',
  'ALTER TABLE contacts ADD COLUMN wa_session TEXT',
  'ALTER TABLE contacts ADD COLUMN label TEXT DEFAULT "LEAD"',
  'ALTER TABLE messages ADD COLUMN wa_session TEXT',
  'ALTER TABLE media_assets ADD COLUMN description TEXT',
  'ALTER TABLE media_assets ADD COLUMN tags TEXT',
  'ALTER TABLE media_assets ADD COLUMN ai_instruction TEXT',
  'ALTER TABLE media_assets ADD COLUMN type TEXT',
  'ALTER TABLE media_assets ADD COLUMN file_size INTEGER',
  'ALTER TABLE media_assets ADD COLUMN mimetype TEXT',
  'ALTER TABLE contacts ADD COLUMN customer_profile TEXT',
  'ALTER TABLE contacts ADD COLUMN last_followup_at DATETIME',
];
for (const m of migrations) {
  try { db.prepare(m).run(); } catch(e) {}
}

db.exec(`
  CREATE TABLE IF NOT EXISTS wa_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_name TEXT UNIQUE NOT NULL,
    label TEXT,
    status TEXT DEFAULT 'stopped',
    phone TEXT,
    system_prompt TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS contacts (
    phone TEXT PRIMARY KEY,
    name TEXT,
    notes TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    paused INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    direction TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS media_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.pragma('wal_checkpoint(TRUNCATE)');
setInterval(() => { try { db.pragma('wal_checkpoint(PASSIVE)'); } catch(e) {} }, 5 * 60 * 1000);

// WA ACCOUNTS
const getWaAccounts = () => { try { return db.prepare('SELECT * FROM wa_accounts ORDER BY created_at DESC').all() || []; } catch(e) { return []; } };
const createWaAccount = (s, l) => { db.prepare('INSERT OR IGNORE INTO wa_accounts (session_name, label, status) VALUES (?, ?, ?)').run(s, l || s, 'starting'); return db.prepare('SELECT * FROM wa_accounts WHERE session_name = ?').get(s); };
const updateWaAccount = (s, fields) => { const entries = Object.entries(fields); if (!entries.length) return; const sets = entries.map(([k]) => `${k} = ?`).join(', '); db.prepare(`UPDATE wa_accounts SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE session_name = ?`).run(...entries.map(([,v]) => v), s); };
const deleteWaAccount = (s) => db.prepare('DELETE FROM wa_accounts WHERE session_name = ?').run(s);

// CONTACTS
const upsertContact = (phone, name, waSession, phoneDisplay, profilePic) => {
  db.prepare(`INSERT INTO contacts (phone, name, wa_session, phone_display, profile_pic, last_seen) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(phone) DO UPDATE SET
      name = COALESCE(excluded.name, name),
      wa_session = COALESCE(excluded.wa_session, wa_session),
      phone_display = COALESCE(excluded.phone_display, phone_display),
      profile_pic = COALESCE(excluded.profile_pic, profile_pic),
      last_seen = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP`).run(phone, name || phone, waSession||null, phoneDisplay||null, profilePic||null);
};
const getContacts = (limit = 50, offset = 0, search = '') => {
  if (search) return db.prepare("SELECT * FROM contacts WHERE phone LIKE ? OR name LIKE ? ORDER BY updated_at DESC LIMIT ? OFFSET ?").all(`%${search}%`, `%${search}%`, limit, offset);
  return db.prepare('SELECT * FROM contacts ORDER BY updated_at DESC LIMIT ? OFFSET ?').all(limit, offset);
};
const updateContact = (phone, fields) => {
  const entries = Object.entries(fields).filter(([k]) => ['name','notes','tags','profile_pic','phone_display','paused','label'].includes(k));
  if (!entries.length) return;
  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  db.prepare(`UPDATE contacts SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`).run(...entries.map(([,v]) => v), phone);
};
const updateContactField = (phone, field, value) => {
  try {
    const allowed = ['phone_display','profile_pic','name','notes','tags','bot_paused','label','wa_session'];
    if (!allowed.includes(field)) return;
    db.prepare('UPDATE contacts SET ' + field + '=?, updated_at=CURRENT_TIMESTAMP WHERE phone=?').run(value, phone);
  } catch(e) {}
};
const touchContactLastSeen = (phone) => { try { db.prepare('UPDATE contacts SET last_seen=CURRENT_TIMESTAMP WHERE phone=?').run(phone); } catch(e) {} };

// BOT PAUSE
const isBotPaused = (phone) => { const r = db.prepare('SELECT bot_paused FROM contacts WHERE phone = ?').get(phone); return r ? !!r.bot_paused : false; };
const setBotPaused = (phone, val) => { db.prepare('UPDATE contacts SET bot_paused = ?, paused = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?').run(val ? 1 : 0, val ? 1 : 0, phone); };

// MESSAGES
const addZ = (s) => s ? (s.endsWith("Z") ? s : s.replace(" ","T")+"Z") : s;
const saveMessage = (phone, direction, body, waSession) => { db.prepare('INSERT INTO messages (phone, direction, body, wa_session) VALUES (?, ?, ?, ?)').run(phone, direction, body, waSession||null); };
const getMessages = (phone, limit = 100) => db.prepare('SELECT * FROM messages WHERE phone = ? ORDER BY created_at DESC LIMIT ?').all(phone, limit).reverse().map(m=>({...m,created_at:addZ(m.created_at)}));
const getHistory = (phone, limit = 30) => db.prepare('SELECT * FROM messages WHERE phone = ? ORDER BY created_at DESC LIMIT ?').all(phone, limit).reverse().map(m=>({...m,created_at:addZ(m.created_at)}));
const getConversations = (limit = 100) => db.prepare(`
  SELECT c.phone, c.name, c.notes, c.tags, c.paused, c.bot_paused, c.updated_at, c.wa_session, c.profile_pic, c.phone_display, c.label,
    (SELECT body FROM messages WHERE phone = c.phone ORDER BY created_at DESC LIMIT 1) as last_message,
    (SELECT direction FROM messages WHERE phone = c.phone ORDER BY created_at DESC LIMIT 1) as last_direction,
    (SELECT created_at FROM messages WHERE phone = c.phone ORDER BY created_at DESC LIMIT 1) as last_message_at,
    (SELECT COUNT(*) FROM messages WHERE phone = c.phone AND direction = 'in') as message_count
  FROM contacts c
  WHERE EXISTS (SELECT 1 FROM messages WHERE phone = c.phone)
  ORDER BY last_message_at DESC NULLS LAST LIMIT ?
`).all(limit).map(c=>({...c, last_message_at:addZ(c.last_message_at)}));

// KNOWLEDGE
const getKnowledge = () => db.prepare('SELECT * FROM knowledge WHERE active=1 ORDER BY created_at DESC').all();
const getAllKnowledge = () => db.prepare('SELECT * FROM knowledge ORDER BY created_at DESC').all();
const addKnowledge = (title, content) => db.prepare('INSERT INTO knowledge (title, content) VALUES (?, ?)').run(title, content);
const updateKnowledge = (id, fields) => {
  const entries = Object.entries(fields).filter(([k]) => ['title','content','active'].includes(k));
  if (!entries.length) return;
  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  db.prepare(`UPDATE knowledge SET ${sets} WHERE id = ?`).run(...entries.map(([,v]) => v), id);
};
const deleteKnowledge = (id) => db.prepare('DELETE FROM knowledge WHERE id = ?').run(id);

// SETTINGS
const getSetting = (key, def = '') => { const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key); return r ? r.value : def; };
const setSetting = (key, value) => db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
const getAllSettings = () => { const rows = db.prepare('SELECT * FROM settings').all(); return Object.fromEntries(rows.map(r => [r.key, r.value])); };

// MEDIA ASSETS
const getMediaAssets = () => db.prepare('SELECT * FROM media_assets ORDER BY created_at DESC').all();
const addMediaAsset = (filename, original_name, mimetype, file_size, tags, description, ai_instruction) => db.prepare('INSERT INTO media_assets (filename, original_name, mimetype, file_size, tags, description, ai_instruction, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(filename, original_name, mimetype||'', file_size||0, tags||'', description||'', ai_instruction||'', (mimetype||'').split('/')[0]||'file');
const deleteMediaAsset = (id) => db.prepare('DELETE FROM media_assets WHERE id = ?').run(id);

// STATS
const getStats = () => {
  try {
    return {
      contacts: db.prepare('SELECT COUNT(*) as n FROM contacts').get()?.n || 0,
      messages: db.prepare('SELECT COUNT(*) as n FROM messages').get()?.n || 0,
      wa_accounts: db.prepare('SELECT COUNT(*) as n FROM wa_accounts').get()?.n || 0,
      knowledge: db.prepare('SELECT COUNT(*) as n FROM knowledge WHERE active=1').get()?.n || 0,
    };
  } catch(e) { return { contacts:0, messages:0, wa_accounts:0, knowledge:0 }; }
};

// MEMORY (for AI context)
const getMemory = (key) => { try { const r = db.prepare('SELECT value FROM settings WHERE key=?').get('mem_'+key); return r ? r.value : null; } catch(e) { return null; } };
const setMemory = (key, value) => { try { db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('mem_'+key, value); } catch(e) {} };

// CUSTOMER PROFILE (structured memory)
const getCustomerProfile = (phone) => {
  try {
    const r = db.prepare('SELECT customer_profile FROM contacts WHERE phone=?').get(phone);
    return r?.customer_profile ? JSON.parse(r.customer_profile) : null;
  } catch(e) { return null; }
};
const setCustomerProfile = (phone, profileObj) => {
  try { db.prepare('UPDATE contacts SET customer_profile=?, updated_at=CURRENT_TIMESTAMP WHERE phone=?').run(JSON.stringify(profileObj), phone); } catch(e) {}
};

// FOLLOW-UP
const getContactsForFollowup = () => {
  try {
    return db.prepare(`
      SELECT c.phone, c.name, c.wa_session, c.customer_profile,
        (SELECT body FROM messages WHERE phone=c.phone ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT direction FROM messages WHERE phone=c.phone ORDER BY created_at DESC LIMIT 1) as last_direction,
        (SELECT created_at FROM messages WHERE phone=c.phone ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE phone=c.phone AND direction='in') as inbound_count
      FROM contacts c
      WHERE c.bot_paused = 0
        AND (c.last_followup_at IS NULL OR datetime(c.last_followup_at) < datetime('now', '-72 hours'))
      HAVING last_direction = 'out'
        AND datetime(last_message_at) < datetime('now', '-24 hours')
        AND datetime(last_message_at) > datetime('now', '-72 hours')
        AND inbound_count >= 3
    `).all();
  } catch(e) { return []; }
};
const setLastFollowup = (phone) => {
  try { db.prepare('UPDATE contacts SET last_followup_at=CURRENT_TIMESTAMP WHERE phone=?').run(phone); } catch(e) {}
};

module.exports = {
  db,
  touchContactLastSeen, updateContactField,
  getWaAccounts, createWaAccount, updateWaAccount, deleteWaAccount,
  upsertContact, getContacts, updateContact,
  isBotPaused, setBotPaused,
  saveMessage, getMessages, getHistory, getConversations,
  getKnowledge, getAllKnowledge, addKnowledge, updateKnowledge, deleteKnowledge,
  getSetting, setSetting, getAllSettings,
  getMediaAssets, addMediaAsset, deleteMediaAsset,
  getStats, getMemory, setMemory,
  getCustomerProfile, setCustomerProfile,
  getContactsForFollowup, setLastFollowup,
};
