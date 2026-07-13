#!/usr/bin/env node
"use strict";

const https    = require("https");
const Database = require("better-sqlite3");

const DB_PATH = "/home/ubuntu/articel generator/data.db";
const API_KEY = process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;
const MODEL   = "claude-sonnet-4-6";
const DELAY_MS = 2000;

if (!API_KEY) { console.error("No API key set"); process.exit(1); }

const db = new Database(DB_PATH);

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function chat(messages, maxTokens) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages });
    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
      },
      timeout: 300000,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`${res.statusCode} ${data.substring(0, 300)}`));
          return;
        }
        try {
          const j = JSON.parse(data);
          resolve(j.content?.[0]?.text || "");
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });
    req.write(body);
    req.end();
  });
}

async function translateArticle(a) {
  const metaText = await chat([{
    role: "user",
    content: `Translate from Indonesian to English. Return only valid JSON with keys "title" and "meta_description".\n\nTITLE: ${a.title}\nMETA_DESCRIPTION: ${a.meta_description}`,
  }], 512);

  const contentHtml = await chat([{
    role: "user",
    content: `Translate this Indonesian HTML article to English. Rules:
- Keep ALL HTML tags exactly as-is
- Keep brand names (Nuswa Lab, Google Ads, WhatsApp, Meta Ads, SEO, Pexels) unchanged
- Keep URLs and href values unchanged
- Translate only visible text content
- Return ONLY the translated HTML, nothing else

${a.content_html}`,
  }], 8000);

  const s = metaText.indexOf("{"), e = metaText.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error(`No JSON in meta: ${metaText.substring(0, 100)}`);
  const m = JSON.parse(metaText.slice(s, e + 1));
  return {
    title_en:            m.title,
    meta_description_en: m.meta_description,
    content_html_en:     contentHtml.trim(),
  };
}

async function main() {
  const pending = db.prepare(`
    SELECT id, title, slug, meta_description, content_html
    FROM articles
    WHERE status = 'published' AND (title_en IS NULL OR title_en = '')
    ORDER BY id ASC
  `).all();

  log(`Found ${pending.length} articles to translate`);
  if (!pending.length) { log("Nothing to do."); db.close(); return; }

  const update = db.prepare(
    "UPDATE articles SET title_en = ?, meta_description_en = ?, content_html_en = ? WHERE id = ?"
  );

  let ok = 0, fail = 0;
  for (const a of pending) {
    log(`\n[${ok + fail + 1}/${pending.length}] "${a.title}" (id:${a.id})`);
    try {
      const en = await translateArticle(a);
      update.run(en.title_en, en.meta_description_en, en.content_html_en, a.id);
      log(`  done: "${en.title_en}"`);
      ok++;
    } catch (err) {
      log(`  error: ${err.message}`);
      fail++;
    }
    if (ok + fail < pending.length) await new Promise(r => setTimeout(r, DELAY_MS));
  }

  db.close();
  log(`\n=== DONE: ${ok} translated, ${fail} failed ===`);
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
