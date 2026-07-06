'use strict';

let _openaiPkg = null;
function getOpenAI() { if (!_openaiPkg) _openaiPkg = require('openai'); return _openaiPkg; }

async function callSingleProvider(messages, systemPrompt, apiKey, provider, model, baseUrl) {
  if (!apiKey || !apiKey.trim()) throw new Error('No API key');
  if ((provider || 'openai').toLowerCase() !== 'anthropic') {
    const OAI = getOpenAI();
    const opts = { apiKey: apiKey.trim() };
    if (baseUrl) { let b = baseUrl.trim().replace(/\/+$/, ''); if (!b.endsWith('/v1')) b += '/v1'; opts.baseURL = b; }
    const client = new OAI(opts);
    const oaiMsgs = [];
    if (systemPrompt) oaiMsgs.push({ role: 'system', content: systemPrompt });
    oaiMsgs.push(...messages);
    const isGemini = (model || '').toLowerCase().includes('gemini');
    const reqBody = { model: model || 'gemini/gemini-2.5-flash', max_tokens: 2048, temperature: 0.7, messages: oaiMsgs };
    if (isGemini) reqBody.thinking = { type: 'disabled' };
    const resp = await client.chat.completions.create(reqBody);
    const choice = resp.choices && resp.choices[0];
    if (!choice) return null;
    let content = choice.message?.content;
    if (!content && choice.message?.parts) content = choice.message.parts.map(p => p.text || '').join('');
    return content || null;
  }
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.Anthropic({ apiKey: apiKey.trim() });
  const antMsgs = messages.filter(m => m.role === 'user' || m.role === 'assistant');
  const resp = await client.messages.create({ model: model || 'claude-haiku-4-5-20251001', max_tokens: 2048, system: systemPrompt || undefined, messages: antMsgs });
  const block = resp.content && resp.content[0];
  return (block && block.type === 'text' ? block.text : null) || null;
}

async function callAI(messages, systemPrompt, settings) {
  const prov = settings.ai_provider || 'custom';
  const modelId = settings.ai_model_id || settings.model || 'gemini/gemini-2.5-flash';
  const baseUrl = (prov === 'custom' || prov === 'openai-compatible') ? (settings.ai_base_url || 'https://ai.sumopod.com') : '';
  const chains = [
    // Primary key
    { name: 'Primary-key1', provider: prov, key: settings.ai_api_key || settings.sumopod_key1 || '', model: modelId, base: baseUrl },
    // Backup key (same provider)
    { name: 'Primary-key2', provider: prov, key: settings.ai_key2 || settings.sumopod_key2 || '', model: modelId, base: baseUrl },
    // Fallback Provider 1 key1
    { name: 'FB1-key1', provider: settings.ai_fb1_provider || 'openai', key: settings.ai_fb1_key1 || '', model: settings.ai_fb1_model || '', base: settings.ai_fb1_base_url || '' },
    // Fallback Provider 1 key2
    { name: 'FB1-key2', provider: settings.ai_fb1_provider || 'openai', key: settings.ai_fb1_key2 || '', model: settings.ai_fb1_model || '', base: settings.ai_fb1_base_url || '' },
    // Fallback Provider 2 key1
    { name: 'FB2-key1', provider: settings.ai_fb2_provider || 'openai', key: settings.ai_fb2_key1 || '', model: settings.ai_fb2_model || '', base: settings.ai_fb2_base_url || '' },
    // Fallback Provider 2 key2
    { name: 'FB2-key2', provider: settings.ai_fb2_provider || 'openai', key: settings.ai_fb2_key2 || '', model: settings.ai_fb2_model || '', base: settings.ai_fb2_base_url || '' },
    // Legacy
    { name: 'Legacy-Anthropic', provider: 'anthropic', key: settings.anthropic_key || '', model: 'claude-haiku-4-5-20251001', base: null },
  ];
  for (const c of chains) {
    if (!c.key || !c.key.trim()) continue;
    try {
      const reply = await callSingleProvider(messages, systemPrompt, c.key, c.provider, c.model, c.base);
      if (reply) { console.log('[AI] Success via', c.name); return reply; }
    } catch(e) { console.warn('[AI]', c.name, 'failed:', e.message); }
  }
  throw new Error('All AI providers failed');
}

const db = require('./db');

async function buildKnowledgeContext() {
  let ctx = '';
  try {
    const kb = db.getKnowledge();
    const valid = (kb||[]).filter(k => k.content && k.content.length > 10);
    if (valid.length > 0) {
      ctx = '\n\n=== KNOWLEDGE BASE ===\n';
      ctx += valid.map(k => `[${k.title||'Info'}]:\n${k.content}`).join('\n---\n');
      ctx += '\n=== END KNOWLEDGE BASE ===';
    }
  } catch(e) {}
  return ctx;
}

function buildMediaContext() {
  let ctx = '';
  try {
    const media = db.getMediaAssets();
    if (media && media.length > 0) {
      const mediaList = media.map(m => {
        let info = `[MEDIA ID:${m.id}] ${m.original_name||m.filename} | ${m.type||'file'}`;
        if (m.tags) info += ` | Tags: ${m.tags}`;
        if (m.ai_instruction) info += ` | Instruksi: ${m.ai_instruction}`;
        info += ` | Token: [SEND_MEDIA:${m.id}]`;
        return info;
      }).join('\n');
      ctx = `\n\nMEDIA LIBRARY:\n${mediaList}\nSertakan [SEND_MEDIA:ID] di akhir reply HANYA jika customer minta lihat gambar/foto/video produk.`;
    }
  } catch(e) {}
  return ctx;
}

async function extractAndSaveProfile(phone, history, existingProfile, settings) {
  try {
    if (history.length < 4) return;
    const recent = history.slice(-10);
    const convo = recent.map(m => `${m.direction === 'in' ? 'customer' : 'bot'}: ${m.body}`).join('\n');
    const extractPrompt = `Berdasarkan percakapan ini, ekstrak info customer dalam format JSON.
Isi hanya field yang ada info jelas. Gunakan null untuk yang tidak diketahui.
Stage: EXPLORING (baru tanya-tanya) | INTERESTED (diskusi layanan/harga) | READY (siap lanjut/minta konsultasi) | BOOKED (sudah booking meeting).
Kembalikan JSON saja tanpa penjelasan lain.

Format: {"bisnis":"...","kebutuhan":"...","layanan_dibahas":[],"budget":"...","stage":"...","keberatan":"..."}

Percakapan:
${convo}`;

    const result = await callAI([{ role: 'user', content: extractPrompt }], 'Kamu adalah sistem ekstraksi data. Kembalikan JSON saja.', settings);
    if (!result) return;

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    const extracted = JSON.parse(jsonMatch[0]);

    // Merge: don't overwrite existing non-null fields with null
    const merged = { ...(existingProfile || {}), updated: new Date().toISOString().slice(0, 10) };
    for (const [k, v] of Object.entries(extracted)) {
      if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) {
        if (k === 'layanan_dibahas' && Array.isArray(v)) {
          merged[k] = [...new Set([...(merged[k] || []), ...v])];
        } else {
          merged[k] = v;
        }
      }
    }
    db.setCustomerProfile(phone, merged);
    console.log('[PROFILE] Updated for', phone, '→ stage:', merged.stage);
  } catch(e) {
    // Silent — never block main flow
  }
}

async function getAIReply(phone, message, acctPrompt) {
  const settings = db.getAllSettings ? db.getAllSettings() : {};
  const botName = settings.bot_name || 'NuswaBot';
  const globalPrompt = settings.system_prompt || `Kamu adalah ${botName}, asisten yang ramah dan profesional. Jawab singkat dan natural seperti chat WhatsApp.`;
  const systemPromptBase = acctPrompt ? globalPrompt + '\n\n=== PERSONA AKUN ===\n' + acctPrompt : globalPrompt;

  const history = await db.getHistory(phone, 30);
  const profile = db.getCustomerProfile(phone);
  const knowledgeCtx = await buildKnowledgeContext();
  const mediaCtx = buildMediaContext();

  let profileCtx = '';
  if (profile) {
    const lines = [];
    if (profile.bisnis) lines.push(`- Bisnis: ${profile.bisnis}`);
    if (profile.kebutuhan) lines.push(`- Kebutuhan: ${profile.kebutuhan}`);
    if (profile.layanan_dibahas?.length) lines.push(`- Layanan dibahas: ${profile.layanan_dibahas.join(', ')}`);
    if (profile.budget) lines.push(`- Budget: ${profile.budget}`);
    if (profile.stage) lines.push(`- Stage: ${profile.stage}`);
    if (profile.keberatan) lines.push(`- Keberatan: ${profile.keberatan}`);
    if (lines.length) {
      profileCtx = `\n\n=== PROFIL CUSTOMER ===\n${lines.join('\n')}\nGunakan info ini. Jangan tanya ulang hal yang sudah diketahui.\n=== END PROFIL ===`;
    }
  }

  const systemPrompt = systemPromptBase + knowledgeCtx + mediaCtx + profileCtx + '\n\nPenting: Jawab singkat dan natural seperti chat WA. Jangan terlalu panjang. Gunakan emoji secukupnya.\n\nBaca history chat. Jika customer sudah menyebutkan data, JANGAN tanya ulang.';

  const messages = [];
  for (const h of history) {
    const role = (h.direction === 'in' || h.role === 'user') ? 'user' : 'assistant';
    const content = String(h.body || h.content || '');
    if (content) messages.push({ role, content });
  }
  messages.push({ role: 'user', content: String(message) });

  // Deduplicate consecutive same-role
  const deduped = [];
  for (const m of messages) {
    if (deduped.length > 0 && deduped[deduped.length-1].role === m.role) deduped[deduped.length-1].content += '\n' + m.content;
    else deduped.push({ ...m });
  }

  try {
    const reply = await callAI(deduped, systemPrompt, settings);
    // Fire-and-forget profile extraction (don't block reply)
    extractAndSaveProfile(phone, history, profile, settings).catch(() => {});
    return reply;
  } catch(e) {
    console.error('[AI] Error:', e.message);
    return 'Maaf, sistem sedang sibuk. Silakan coba lagi ya 😊';
  }
}

async function getAIReplyWithMedia(phone, message, mediaData, acctPrompt) {
  const settings = db.getAllSettings ? db.getAllSettings() : {};
  const botName = settings.bot_name || 'NuswaBot';
  const globalPrompt = settings.system_prompt || `Kamu adalah ${botName}, asisten yang ramah dan profesional.`;
  const systemPromptBase = acctPrompt ? globalPrompt + '\n\n=== PERSONA AKUN ===\n' + acctPrompt : globalPrompt;
  const knowledgeCtx = await buildKnowledgeContext();
  const systemPrompt = systemPromptBase + knowledgeCtx + '\n\nJawab singkat dan natural seperti chat WA.';

  const prov2 = settings.ai_provider || 'custom';
  const modelId2 = settings.ai_model_id || settings.model || 'gemini/gemini-2.5-flash';
  const baseUrl2 = (prov2 === 'custom' || prov2 === 'openai-compatible') ? (settings.ai_base_url || 'https://ai.sumopod.com') : '';
  const chains = [
    { name: 'Primary-key1', provider: prov2, key: settings.ai_api_key||settings.sumopod_key1||'', model: modelId2, base: baseUrl2 },
    { name: 'Primary-key2', provider: prov2, key: settings.ai_key2||settings.sumopod_key2||'', model: modelId2, base: baseUrl2 },
    { name: 'FB2-key1', provider: settings.ai_fb2_provider||'openai', key: settings.ai_fb2_key1||'', model: settings.ai_fb2_model||modelId2, base: settings.ai_fb2_base_url||baseUrl2 },
  ];

  let userContent = [];
  if (mediaData && mediaData.msgType === 'image') {
    const mime = ['image/jpeg','image/png','image/gif','image/webp'].includes(mediaData.mimeType) ? mediaData.mimeType : 'image/jpeg';
    userContent.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${mediaData.base64}` } });
    userContent.push({ type: 'text', text: message || 'Tolong analisis gambar ini.' });
  } else {
    userContent.push({ type: 'text', text: message || 'Halo' });
  }

  for (const vc of chains) {
    if (!vc.key || !vc.key.trim()) continue;
    try {
      const OpenAI = getOpenAI();
      const clientOpts = { apiKey: vc.key };
      if (vc.base) { let b = vc.base.trim().replace(/\/+$/, ''); if (!b.endsWith('/v1')) b += '/v1'; clientOpts.baseURL = b; }
      const client = new OpenAI(clientOpts);
      const resp = await client.chat.completions.create({ model: vc.model, max_tokens: 2048, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }] });
      const reply = resp.choices[0]?.message?.content || '';
      if (reply) return reply;
    } catch(e) { console.warn('[VISION]', vc.name, 'failed:', e.message); }
  }
  return 'Maaf Kak, ada kendala saat memproses gambar. Bisa ceritakan apa yang ingin ditanyakan? 😊';
}

module.exports = { getAIReply, getAIReplyWithMedia, buildKnowledgeContext, buildMediaContext };
