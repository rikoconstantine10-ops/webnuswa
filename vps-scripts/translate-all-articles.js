#!/usr/bin/env node
/**
 * Batch translate all published articles to English
 * Uses OpenAI-compatible API (openagentic.id)
 * Run: AI_API_KEY=... node scripts/translate-all-articles.js
 */

"use strict";

const https    = require("https");
const Database = require("better-sqlite3");

const DB_PATH  = "/home/ubuntu/articel generator/data.db";
const API_KEY  = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
const BASE_URL = process.env.AI_BASE_URL || "https://openagentic.id/api/v1";
const MODEL    = process.env.AI_MODEL    || "claude-haiku-4-5-20251001";
const DELAY_MS = 2000;

if (!API_KEY) { console.error("✗ AI_API_KEY not set"); process.exit(1); }

const db = new Database(DB_PATH);

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function chatCompletion(messages, maxTokens) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages,
    });
    const url = new URL(`${BASE_URL}/chat/completions`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 300000,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`${res.statusCode} ${data.substring(0, 300)}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          resolve(json.choices?.[0]?.message?.content || "");
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });
    req.write(body);
    req.end();
  });
}

async function translateArticle(article) {
  const [metaText, contentHtml] = await Promise.all([
    chatCompletion([{
      role: "user",
      content: `Translate from Indonesian to English. Return only valid JSON with keys "title" and "meta_description".

TITLE: ${article.title}
META_DESCRIPTION: ${article.meta_description}`,
    }], 512),
    chatCompletion([{
      role: "user",
      content: `Translate this Indonesian HTML article to English. Rules:
- Keep ALL HTML tags exactly as-is
- Keep brand names (Nuswa Lab, Google Ads, WhatsApp, Meta Ads, SEO, Pexels) unchanged
- Keep URLs and href values unchanged
- Translate only visible text content
- Return ONLY the translated HTML, nothing else

${article.content_html}`,
    }], 8000),
  ]);

  const cleanMeta = metaText.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
  const metaJson  = JSON.parse(cleanMeta);

  return {
    title_en:            metaJson.title,
    meta_description_en: metaJson.meta_description,
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
  if (pending.length === 0) { log("Nothing to do."); db.close(); return; }

  const update = db.prepare(
    "UPDATE articles SET title_en = ?, meta_description_en = ?, content_html_en = ? WHERE id = ?"
  );

  let ok = 0, fail = 0;
  for (const article of pending) {
    log(`\n[${ok + fail + 1}/${pending.length}] "${article.title}" (id:${article.id})`);
    try {
      const en = await translateArticle(article);
      update.run(en.title_en, en.meta_description_en, en.content_html_en, article.id);
      log(`  ✓ "${en.title_en}"`);
      ok++;
    } catch (err) {
      log(`  ✗ Error: ${err.message}`);
      fail++;
    }

    if (ok + fail < pending.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  db.close();
  log(`\n=== DONE: ${ok} translated, ${fail} failed ===`);
}

main().catch(err => { console.error("[FATAL]", err.message); process.exit(1); });
