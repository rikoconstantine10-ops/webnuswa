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

async function getAIReply(phone, message, acctPrompt) {
  const settings = db.getAllSettings ? db.getAllSettings() : {};
  const botName = settings.bot_name || 'NuswaBot';
  const globalPrompt = settings.system_prompt || `Kamu adalah ${botName}, asisten yang ramah dan profesional. Jawab singkat dan natural seperti chat WhatsApp.`;
  const systemPromptBase = acctPrompt ? globalPrompt + '\n\n=== PERSONA AKUN ===\n' + acctPrompt : globalPrompt;

  const history = await db.getHistory(phone, 30);
  const memory = db.getMemory(phone);
  const knowledgeCtx = await buildKnowledgeContext();
  const mediaCtx = buildMediaContext();
  const memCtx = memory ? `\n\n${memory}\n\nGunakan konteks di atas, jangan tanya ulang info yang sudah ada.` : '';
  const systemPrompt = systemPromptBase + knowledgeCtx + mediaCtx + memCtx + '\n\nPenting: Jawab singkat dan natural seperti chat WA. Jangan terlalu panjang. Gunakan emoji secukupnya.\n\nBaca history chat. Jika customer sudah menyebutkan data, JANGAN tanya ulang.';

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
    // Update memory
    if (history.length >= 3) {
      const recent = history.slice(-6);
      const summary = `Customer: ${message}\nAI: ${reply}\n\nRiwayat:\n${recent.map(m => `${m.direction}: ${m.body}`).join('\n')}`;
      db.setMemory(phone, summary);
    }
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
