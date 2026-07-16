#!/usr/bin/env node
/**
 * Keyword-First Article Generator — Nuswa Lab
 *
 * Reads target keywords from scripts/keywords.json, generates original SEO/AEO/AIO-optimized
 * articles via Claude API, fetches featured images from Unsplash, saves to SQLite, and rebuilds.
 *
 * Setup:
 *   npm install rss-parser @anthropic-ai/sdk better-sqlite3   (run once)
 *   ANTHROPIC_API_KEY=sk-ant-... PEXELS_API_KEY=xxx node scripts/keyword-article-gen.js
 *
 * Crontab (daily 02:00 WIB / 19:00 UTC):
 *   0 19 * * * cd /home/ubuntu/nuswalab && ANTHROPIC_API_KEY=sk-ant-xxx PEXELS_API_KEY=xxx node scripts/keyword-article-gen.js >> logs/article-gen.log 2>&1
 */

"use strict";

const https      = require("https");
const http       = require("http");
const fs         = require("fs");
const path       = require("path");
const { spawn }  = require("child_process");
const Database   = require("better-sqlite3");

// ─── Config ──────────────────────────────────────────────────────────────────

const VPS_ROOT        = "/home/ubuntu/nuswalab";
const DB_PATH         = "/home/ubuntu/articel generator/data.db";
const KEYWORDS_FILE   = path.join(VPS_ROOT, "scripts/keywords.json");
const IMAGE_DIR       = path.join(VPS_ROOT, "public/images/blog");
const PEXELS_KEY      = process.env.PEXELS_API_KEY;
const AI_API_KEY      = process.env.AI_API_KEY;
const AI_BASE_URL     = process.env.AI_BASE_URL        || "https://openagentic.id/api/v1";
const AI_MODEL        = process.env.AI_MODEL           || "claude-sonnet-4-6";
const DRY_RUN         = process.env.DRY_RUN === "1";
const MAX_DAILY       = parseInt(process.env.MAX_DAILY || "3");
const ARTICLE_STATUS  = process.env.ARTICLE_STATUS || "published";

// ─── Internal links for diaspora context ─────────────────────────────────────

const INTERNAL_LINKS = [
  { kw: "malaysia",       path: "/country/malaysia" },
  { kw: "kuala lumpur",   path: "/country/malaysia/kuala-lumpur" },
  { kw: "johor bahru",    path: "/country/malaysia/johor-bahru" },
  { kw: "saudi arabia",   path: "/country/saudi-arabia" },
  { kw: "riyadh",         path: "/country/saudi-arabia/riyadh" },
  { kw: "jeddah",         path: "/country/saudi-arabia/jeddah" },
  { kw: "dubai",          path: "/country/uae/dubai" },
  { kw: "abu dhabi",      path: "/country/uae/abu-dhabi" },
  { kw: "uae",            path: "/country/uae" },
  { kw: "australia",      path: "/country/australia" },
  { kw: "sydney",         path: "/country/australia/sydney" },
  { kw: "melbourne",      path: "/country/australia/melbourne" },
  { kw: "japan",          path: "/country/japan" },
  { kw: "jepang",         path: "/country/japan" },
  { kw: "tokyo",          path: "/country/japan/tokyo" },
  { kw: "osaka",          path: "/country/japan/osaka" },
  { kw: "netherlands",    path: "/country/netherlands" },
  { kw: "belanda",        path: "/country/netherlands" },
  { kw: "amsterdam",      path: "/country/netherlands/amsterdam" },
  { kw: "united kingdom", path: "/country/united-kingdom" },
  { kw: "inggris",        path: "/country/united-kingdom" },
  { kw: "london",         path: "/country/united-kingdom/london" },
  { kw: "taiwan",         path: "/country/taiwan" },
  { kw: "taipei",         path: "/country/taiwan/taipei" },
  { kw: "hong kong",      path: "/country/hong-kong/hong-kong" },
  { kw: "qatar",          path: "/country/qatar" },
  { kw: "doha",           path: "/country/qatar/doha" },
  { kw: "kuwait",         path: "/country/kuwait" },
  { kw: "south korea",    path: "/country/south-korea" },
  { kw: "korea",          path: "/country/south-korea" },
  { kw: "seoul",          path: "/country/south-korea/seoul" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function stripHtml(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function injectInternalLinks(html) {
  let result = html;
  const injected = new Set();
  for (const { kw, path: linkPath } of INTERNAL_LINKS) {
    if (injected.has(linkPath)) continue;
    const regex = new RegExp(`(?<!<a[^>]*>)\\b(${kw})\\b(?![^<]*<\\/a>)`, "i");
    const before = result;
    result = result.replace(regex, `<a href="${linkPath}">$1</a>`);
    if (result !== before) injected.add(linkPath);
  }
  return result;
}

// ─── SEO / AEO / AIO Scoring ─────────────────────────────────────────────────

function scoreArticle(html, keyword) {
  const plain = stripHtml(html).toLowerCase();
  const kwLower = keyword.toLowerCase();
  const wordCount = plain.split(/\s+/).filter(Boolean).length;

  // SEO Score (0-100)
  let seo = 0;
  if (wordCount >= 1500)                                              seo += 25;
  else if (wordCount >= 800)                                          seo += 15;
  if (html.toLowerCase().includes(`<h1`))                            seo += 15;
  const h2count = (html.match(/<h2/gi) || []).length;
  if (h2count >= 4)                                                   seo += 15;
  else if (h2count >= 2)                                              seo += 8;
  if (html.toLowerCase().includes(kwLower))                          seo += 15;
  if ((html.match(/<a href/gi) || []).length >= 3)                   seo += 15;
  const imgCount = (html.match(/<img/gi) || []).length;
  if (imgCount >= 1)                                                  seo += 10;
  if (html.toLowerCase().includes("alt="))                           seo += 5;

  // AEO Score — Answer Engine Optimization (0-100)
  let aeo = 0;
  const firstPara = (html.match(/<p>(.*?)<\/p>/i) || [])[1] || "";
  const firstParaWords = stripHtml(firstPara).split(/\s+/).filter(Boolean).length;
  if (firstParaWords >= 30 && firstParaWords <= 80)                  aeo += 30; // direct answer paragraph
  const faqCount = (html.match(/<h3>/gi) || []).length;
  if (faqCount >= 5)                                                  aeo += 30;
  else if (faqCount >= 3)                                             aeo += 15;
  if (html.toLowerCase().includes("faq") || html.toLowerCase().includes("pertanyaan")) aeo += 20;
  if (html.toLowerCase().includes("<ul") || html.toLowerCase().includes("<ol")) aeo += 10;
  if (html.toLowerCase().includes("<table"))                         aeo += 10;

  // AIO Score — AI Overview Optimization (0-100)
  let aio = 0;
  if (wordCount >= 2000)                                              aio += 20;
  else if (wordCount >= 1500)                                         aio += 15;
  const statPattern = /\d+(\.\d+)?%|\d{4}|\$\d+|Rp\s*\d+/;
  if (statPattern.test(plain))                                        aio += 25;
  if (h2count >= 5)                                                   aio += 15;
  if (html.toLowerCase().includes("contoh") || html.toLowerCase().includes("misalnya")) aio += 15;
  const listItems = (html.match(/<li>/gi) || []).length;
  if (listItems >= 8)                                                 aio += 15;
  else if (listItems >= 4)                                            aio += 8;
  if (html.toLowerCase().includes("tips") || html.toLowerCase().includes("langkah")) aio += 10;

  return {
    seo_score:  Math.min(100, seo),
    aeo_score:  Math.min(100, aeo),
    aio_score:  Math.min(100, aio),
    word_count: wordCount,
  };
}

// ─── Image: Unsplash ──────────────────────────────────────────────────────────

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(dest, () => {});
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const options = {
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      headers: { "User-Agent": "NuswaLab-ArticleGen/1.0", ...headers },
    };
    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function fetchAndSaveImage(keyword, slug) {
  if (!PEXELS_KEY) {
    log("⚠ PEXELS_API_KEY not set — skipping image");
    return null;
  }

  const query = encodeURIComponent(keyword + " business marketing");
  const apiUrl = `https://api.pexels.com/v1/search?query=${query}&orientation=landscape&per_page=5`;

  try {
    const data = await fetchJson(apiUrl, { Authorization: PEXELS_KEY });
    if (!data.photos || data.photos.length === 0) {
      log(`⚠ No Pexels results for "${keyword}"`);
      return null;
    }

    // Pick a random result from top 5 for variety
    const idx = Math.floor(Math.random() * Math.min(5, data.photos.length));
    const photo = data.photos[idx];
    const imageUrl = photo.src.large; // ~940px wide

    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    const dest = path.join(IMAGE_DIR, `${slug}.jpg`);
    await downloadFile(imageUrl, dest);
    log(`✓ Image saved: /images/blog/${slug}.jpg (by ${photo.photographer} on Pexels)`);
    return `/images/blog/${slug}.jpg`;
  } catch (err) {
    log(`⚠ Image fetch failed: ${err.message}`);
    return null;
  }
}

async function fetchInlineImages(keyword, slug) {
  if (!PEXELS_KEY) return [];

  // Use broader query for variety in inline images
  const queries = [
    keyword + " team work",
    keyword + " strategy",
  ];

  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }

  const results = [];
  for (let i = 0; i < queries.length; i++) {
    try {
      const query = encodeURIComponent(queries[i]);
      // page=2 gives different results from the featured image (which uses page=1)
      const apiUrl = `https://api.pexels.com/v1/search?query=${query}&orientation=landscape&per_page=5&page=2`;
      const data = await fetchJson(apiUrl, { Authorization: PEXELS_KEY });
      if (!data.photos || data.photos.length === 0) continue;

      const photo = data.photos[i % data.photos.length];
      const filename = `${slug}-inline-${i + 1}.jpg`;
      const dest = path.join(IMAGE_DIR, filename);
      await downloadFile(photo.src.large, dest);

      results.push({
        src: `/images/blog/${filename}`,
        alt: `${keyword} — ilustrasi ${i + 1}`,
        photographer: photo.photographer,
      });
      log(`  ✓ Inline image ${i + 1} saved: ${filename}`);
    } catch (err) {
      log(`  ⚠ Inline image ${i + 1} fetch failed: ${err.message}`);
    }
  }
  return results;
}

function injectInlineImages(html, images) {
  if (images.length === 0) return html;

  // Find all <h2> tags and insert an image after the 2nd and 4th <h2> sections
  const insertAfterH2 = [1, 3]; // 0-indexed: after 2nd and 4th h2
  let h2count = 0;
  let imageIndex = 0;
  let result = html.replace(/<\/h2>/gi, (match) => {
    const current = h2count++;
    if (insertAfterH2.includes(current) && imageIndex < images.length) {
      const img = images[imageIndex++];
      return `</h2>\n<figure style="margin:1.5rem 0;text-align:center;">
  <img src="${img.src}" alt="${img.alt}" style="width:100%;max-width:800px;height:auto;border-radius:12px;object-fit:cover;" loading="lazy" />
  <figcaption style="font-size:0.8rem;color:#6b7280;margin-top:0.5rem;">Foto oleh ${img.photographer} via Pexels</figcaption>
</figure>`;
    }
    return match;
  });

  return result;
}

// ─── OpenAI-compatible chat (openagentic.id) for translations ─────────────────

function chatCompletion(messages, maxTokens) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: AI_MODEL, max_tokens: maxTokens, messages });
    const url  = new URL(`${AI_BASE_URL}/chat/completions`);
    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   "POST",
      headers: {
        "Authorization": `Bearer ${AI_API_KEY}`,
        "Content-Type":  "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 300000,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        if (res.statusCode >= 400) { reject(new Error(`${res.statusCode} ${data.substring(0, 200)}`)); return; }
        try {
          // Extract outermost JSON object — some proxies append trailing bytes
          const s = data.indexOf("{"), e = data.lastIndexOf("}");
          if (s === -1 || e === -1) { reject(new Error(`No JSON in response: ${data.substring(0, 200)}`)); return; }
          resolve(JSON.parse(data.slice(s, e + 1)).choices?.[0]?.message?.content || "");
        }
        catch (e) { reject(new Error(`JSON parse: ${e.message} — raw: ${data.substring(0, 200)}`)); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });
    req.write(body);
    req.end();
  });
}

// ─── Claude Article Generation ────────────────────────────────────────────────

async function generateArticle(kw) {
  const systemPrompt = `Kamu adalah expert content writer & SEO specialist untuk Nuswa Lab, digital marketing agency yang spesialis membantu bisnis diaspora Indonesia berkembang di luar negeri (Malaysia, UAE, Saudi Arabia, Australia, Jepang, UK, Belanda, Taiwan, Hong Kong, Qatar, Kuwait, Korea Selatan).

Penulisanmu: profesional, data-driven, actionable. Mix Bahasa Indonesia (70%) + English (30%). Setiap artikel harus memenuhi standar SEO modern, AEO (Answer Engine Optimization), dan AIO (AI Overview Optimization).`;

  const userPrompt = `Tulis artikel SEO lengkap untuk keyword target berikut:

KEYWORD TARGET: "${kw.keyword}"
KATEGORI: ${kw.category}
SEARCH INTENT: ${kw.search_intent}

INSTRUKSI WAJIB:

=== STRUKTUR ARTIKEL ===
1. <h1> — judul yang mengandung keyword target, menarik, max 60 karakter
2. <p class="intro"> — paragraf pembuka 50-70 kata yang LANGSUNG menjawab search intent (untuk AEO/featured snippet)
3. 5-6 <h2> sub-bagian dengan konten mendalam (300-400 kata per bagian)
4. Setiap <h2> bisa punya 1-2 <h3> untuk sub-sub-bagian
5. Gunakan <ul>, <ol>, <li> untuk tips/langkah-langkah
6. Tambahkan setidaknya 1 contoh nyata dengan angka/data spesifik
7. Di akhir, section <h2>FAQ: Pertanyaan Umum</h2> dengan 5 Q&A format:
   <h3>Pertanyaan?</h3><p>Jawaban 40-60 kata yang langsung dan informatif.</p>
8. Penutup <h2> dengan CTA natural ke layanan Nuswa Lab dan mention blog Nuswa Lab di /blog untuk baca artikel lainnya

=== SEO REQUIREMENTS ===
- Keyword "${kw.keyword}" harus muncul di: H1, intro paragraph, minimal 2 H2, dan body text (density 1-2%)
- Gunakan variasi keyword dan LSI terms
- Panjang total: 1500-2000 kata
- Sisipkan internal links: [LINK:/country/malaysia], [LINK:/country/uae], dll sesuai konteks
- Image alt text placeholder: [IMG-ALT:deskripsi gambar relevan]

=== KONTEKS DIASPORA ===
- Selalu gunakan contoh bisnis diaspora Indonesia: "restoran Indonesia di Tokyo", "freelancer WNI di London", "pengusaha Indonesia di Dubai", "toko kelontong Indonesian di Melbourne", dll
- Sebutkan layanan Nuswa Lab (Google Ads, Meta Ads, SEO, WhatsApp Marketing) secara natural 2-3 kali
- Tambahkan statistik/data relevan (bisa perkiraan realistis jika data tidak tersedia)

=== AIO OPTIMIZATION ===
- Tulis dengan authoritative tone — seperti expert yang punya pengalaman langsung
- Sertakan "berdasarkan pengalaman kami" atau "klien kami di [negara] melaporkan..." untuk E-E-A-T
- Struktur yang memudahkan AI untuk extract key points

PENTING: Return HANYA konten HTML. Mulai langsung dengan <h1>. Jangan tambahkan \`\`\`html atau wrapper apapun.`;

  const result = await chatCompletion([
    { role: "user", content: `${systemPrompt}\n\n${userPrompt}` },
  ], 6000);

  return result.trim();
}

// ─── Post-process HTML ────────────────────────────────────────────────────────

function processHtml(raw) {
  // Replace [LINK:/path] placeholders
  let html = raw.replace(
    /\[LINK:(\/[^\]]+)\]/g,
    (_, p) => {
      const label = p.split("/").pop().replace(/-/g, " ");
      return `<a href="${p}">${label}</a>`;
    }
  );

  // Replace [IMG-ALT:...] placeholders (remove — used for scoring only)
  html = html.replace(/\[IMG-ALT:[^\]]+\]/g, "");

  // Inject diaspora internal links
  html = injectInternalLinks(html);

  // Append "Baca juga" section with link to blog
  html += `\n<div class="baca-juga" style="margin-top:2rem;padding:1rem 1.5rem;background:#f8f9fa;border-left:4px solid #0070f3;border-radius:4px;">
  <p style="margin:0;font-size:0.95rem;">📚 <strong>Baca juga:</strong> Temukan lebih banyak artikel seputar digital marketing, AI automation, dan strategi bisnis diaspora Indonesia di <a href="/blog" style="color:#0070f3;font-weight:600;">Blog Nuswa Lab</a>.</p>
</div>`;

  return html;
}

// ─── Keywords file management ─────────────────────────────────────────────────

function loadKeywords() {
  if (!fs.existsSync(KEYWORDS_FILE)) {
    log(`⚠ keywords.json not found at ${KEYWORDS_FILE}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(KEYWORDS_FILE, "utf-8"));
}

function saveKeywords(keywords) {
  fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(keywords, null, 2), "utf-8");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log("=== Keyword Article Generator START ===");

  if (!AI_API_KEY) { log("✗ AI_API_KEY not set. Exiting."); process.exit(1); }
  if (!PEXELS_KEY) log("⚠ PEXELS_API_KEY not set — articles will have no featured image");
  if (DRY_RUN) log("⚠ DRY RUN mode — nothing will be written to DB or rebuilt");
  const db = DRY_RUN ? null : new Database(DB_PATH);

  const keywords = loadKeywords();
  const pending = keywords.filter(k => k.status === "pending");

  log(`Found ${pending.length} pending keywords (max ${MAX_DAILY} today)`);

  if (pending.length === 0) {
    log("No pending keywords. Add more to scripts/keywords.json with status: 'pending'");
    return;
  }

  const toProcess = pending.slice(0, MAX_DAILY);
  const inserted = [];

  for (const kw of toProcess) {
    const slug = slugify(kw.keyword);

    // Skip if slug already exists in DB
    if (!DRY_RUN) {
      const exists = db.prepare("SELECT id FROM articles WHERE slug = ?").get(slug);
      if (exists) {
        log(`⟳ Skip duplicate slug: ${slug}`);
        const idx = keywords.findIndex(k => k.keyword === kw.keyword);
        if (idx !== -1) keywords[idx].status = "done";
        continue;
      }
    }

    log(`\n✎ Generating article for: "${kw.keyword}"`);

    // 1. Generate article
    let rawHtml;
    try {
      rawHtml = await generateArticle(kw);
    } catch (err) {
      log(`✗ Claude error: ${err.message}`);
      const idx = keywords.findIndex(k => k.keyword === kw.keyword);
      if (idx !== -1) keywords[idx].status = "error";
      continue;
    }

    const contentHtml = processHtml(rawHtml);
    const plain       = stripHtml(contentHtml);

    // Extract title from <h1>
    const titleMatch = contentHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title      = titleMatch ? stripHtml(titleMatch[1]) : kw.keyword;

    // Extract intro for meta description
    const introMatch = contentHtml.match(/<p[^>]*>(.*?)<\/p>/i);
    const metaDesc   = introMatch
      ? stripHtml(introMatch[1]).slice(0, 152).trimEnd() + "..."
      : plain.slice(0, 152).trimEnd() + "...";

    const secondaryKw = JSON.stringify([
      "digital marketing", "diaspora indonesia", kw.category.toLowerCase(),
    ]);
    const tags = JSON.stringify([
      "digital marketing", "indonesia diaspora", kw.category.toLowerCase(),
    ]);

    // 2. Fetch images (featured + inline)
    let featuredImage = null;
    let finalHtml = contentHtml;
    if (!DRY_RUN) {
      [featuredImage] = await Promise.all([fetchAndSaveImage(kw.keyword, slug)]);
      const inlineImages = await fetchInlineImages(kw.keyword, slug);
      if (inlineImages.length > 0) {
        finalHtml = injectInlineImages(contentHtml, inlineImages);
        log(`  ✓ Injected ${inlineImages.length} inline images`);
      }
    } else {
      log(`  [DRY RUN] Would fetch Pexels images for: ${kw.keyword}`);
    }

    const scores = scoreArticle(finalHtml, kw.keyword);
    log(`  → ${scores.word_count} words | SEO: ${scores.seo_score} | AEO: ${scores.aeo_score} | AIO: ${scores.aio_score}`);

    // 3. Translate to English (via openagentic.id)
    let titleEn = null, metaDescEn = null, contentHtmlEn = null;
    if (!DRY_RUN && AI_API_KEY) {
      log("  → Translating to English...");
      try {
        const [metaText, contentText] = await Promise.all([
          chatCompletion([{ role: "user", content: `Translate from Indonesian to English. Return only valid JSON with keys "title" and "meta_description".\n\nTITLE: ${title}\nMETA_DESCRIPTION: ${metaDesc}` }], 512),
          chatCompletion([{ role: "user", content: `Translate this Indonesian HTML article to English. Keep ALL HTML tags exactly as-is. Keep brand names (Nuswa Lab, Google Ads, WhatsApp, Meta Ads, SEO) unchanged. Keep URLs unchanged. Return ONLY the translated HTML.\n\n${finalHtml}` }], 8000),
        ]);
        const s = metaText.indexOf("{"), e = metaText.lastIndexOf("}");
        if (s === -1 || e === -1) throw new Error(`No JSON in meta response: ${metaText.substring(0, 100)}`);
        const metaJson  = JSON.parse(metaText.slice(s, e + 1));
        titleEn       = metaJson.title;
        metaDescEn    = metaJson.meta_description;
        contentHtmlEn = contentText.trim();
        log(`  ✓ EN translation done: "${titleEn}"`);
      } catch (err) {
        log(`  ⚠ EN translation failed: ${err.message} (will retry via background translate script)`);
      }
    }

    // 4. Save to DB
    if (DRY_RUN) {
      log(`  [DRY RUN] Would insert: ${slug}`);
      log(`  HTML preview: ${finalHtml.slice(0, 200)}...`);
    } else {
      db.prepare(`
        INSERT INTO articles (
          title, slug, keyword, meta_description, content_html,
          word_count, focus_keyword, secondary_keywords,
          category, tags, image_alt_text, featured_image,
          seo_score, aeo_score, geo_score,
          title_en, meta_description_en, content_html_en,
          created_at, published_date, status
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          datetime('now'), datetime('now'), ?
        )
      `).run(
        title, slug, kw.keyword, metaDesc, finalHtml,
        scores.word_count, kw.keyword, secondaryKw,
        kw.category, tags, `Ilustrasi artikel tentang ${kw.keyword}`, featuredImage,
        scores.seo_score, scores.aeo_score, scores.aio_score,
        titleEn, metaDescEn, contentHtmlEn,
        ARTICLE_STATUS,
      );
      log(`  ✓ Inserted [${ARTICLE_STATUS}]: ${slug}`);
    }

    // Mark keyword as done
    const idx = keywords.findIndex(k => k.keyword === kw.keyword);
    if (idx !== -1) keywords[idx].status = "done";
    saveKeywords(keywords);

    inserted.push(slug);

    // Rate limiting between API calls
    if (toProcess.indexOf(kw) < toProcess.length - 1) {
      log("  → Waiting 3s before next article...");
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (db) db.close();

  // 4. Build + restart
  if (inserted.length > 0 && !DRY_RUN) {
    const { execSync } = require("child_process");
    log(`\n🔨 Building site (${inserted.length} new articles)...`);
    try {
      execSync("npm run build && sudo -u ubuntu pm2 restart nuswalab", {
        cwd:   VPS_ROOT,
        stdio: "inherit",
      });
      log("✓ Build & restart complete");

      // Spawn translate-all-articles.js in background for any untranslated articles
      try {
        const fs = require("fs");
        const translateScript = require("path").join(VPS_ROOT, "scripts/translate-all-articles.js");
        const translateLog    = `/tmp/translate-bg-${Date.now()}.log`;
        const tp = spawn("node", [translateScript], {
          cwd:      VPS_ROOT,
          detached: true,
          stdio:    ["ignore", fs.openSync(translateLog, "w"), fs.openSync(translateLog, "a")],
          env:      { ...process.env, AI_API_KEY, AI_BASE_URL, AI_MODEL },
        });
        tp.unref();
        log(`✓ Background translate started (PID ${tp.pid}), log: ${translateLog}`);
      } catch (spawnErr) {
        log(`⚠ Could not start background translate: ${spawnErr.message}`);
      }
    } catch (err) {
      log(`✗ Build failed: ${err.message}`);
      process.exit(1);
    }
  } else if (inserted.length === 0 && !DRY_RUN) {
    log("No new articles inserted — skipping build");
  }

  log(`\n=== DONE: ${inserted.length} articles generated & published ===\n`);
}

main().catch(err => {
  console.error(`[FATAL] ${err.message}`);
  process.exit(1);
});
