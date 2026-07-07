#!/usr/bin/env node
/**
 * Keyword-First Article Generator — Nuswa Lab
 *
 * Reads target keywords from scripts/keywords.json, generates original SEO/AEO/AIO-optimized
 * articles via Claude API, fetches featured images from Unsplash, saves to SQLite, and rebuilds.
 *
 * Setup:
 *   npm install rss-parser @anthropic-ai/sdk better-sqlite3   (run once)
 *   ANTHROPIC_API_KEY=sk-ant-... UNSPLASH_ACCESS_KEY=xxx node scripts/keyword-article-gen.js
 *
 * Crontab (daily 02:00 WIB / 19:00 UTC):
 *   0 19 * * * cd /home/ubuntu/nuswalab && ANTHROPIC_API_KEY=sk-ant-xxx UNSPLASH_ACCESS_KEY=xxx node scripts/keyword-article-gen.js >> logs/article-gen.log 2>&1
 */

"use strict";

const https      = require("https");
const http       = require("http");
const fs         = require("fs");
const path       = require("path");
const Anthropic  = require("@anthropic-ai/sdk");
const Database   = require("better-sqlite3");

// ─── Config ──────────────────────────────────────────────────────────────────

const VPS_ROOT        = "/home/ubuntu/nuswalab";
const DB_PATH         = "/home/ubuntu/articel generator/data.db";
const KEYWORDS_FILE   = path.join(VPS_ROOT, "scripts/keywords.json");
const IMAGE_DIR       = path.join(VPS_ROOT, "public/images/blog");
const API_KEY         = process.env.ANTHROPIC_API_KEY;
const UNSPLASH_KEY    = process.env.UNSPLASH_ACCESS_KEY;
const BASE_URL        = process.env.ANTHROPIC_BASE_URL || "https://ai.sumopod.com";
const MODEL           = process.env.ANTHROPIC_MODEL    || "claude-opus-4-8";
const DRY_RUN         = process.env.DRY_RUN === "1";
const MAX_DAILY       = parseInt(process.env.MAX_DAILY || "3");

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
  if (!UNSPLASH_KEY) {
    log("⚠ UNSPLASH_ACCESS_KEY not set — skipping image");
    return null;
  }

  const query = encodeURIComponent(keyword + " business marketing");
  const apiUrl = `https://api.unsplash.com/search/photos?query=${query}&orientation=landscape&per_page=5&order_by=relevant`;

  try {
    const data = await fetchJson(apiUrl, { Authorization: `Client-ID ${UNSPLASH_KEY}` });
    if (!data.results || data.results.length === 0) {
      log(`⚠ No Unsplash results for "${keyword}"`);
      return null;
    }

    // Pick a random result from top 5 for variety
    const idx = Math.floor(Math.random() * Math.min(5, data.results.length));
    const photo = data.results[idx];
    const imageUrl = photo.urls.regular; // ~1080px wide

    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    const dest = path.join(IMAGE_DIR, `${slug}.jpg`);
    await downloadFile(imageUrl, dest);
    log(`✓ Image saved: /images/blog/${slug}.jpg (by ${photo.user.name} on Unsplash)`);
    return `/images/blog/${slug}.jpg`;
  } catch (err) {
    log(`⚠ Image fetch failed: ${err.message}`);
    return null;
  }
}

// ─── Claude Article Generation ────────────────────────────────────────────────

async function generateArticle(kw, client) {
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
8. Penutup <h2> dengan CTA natural ke layanan Nuswa Lab

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

  const message = await client.messages.create({
    model:      MODEL,
    max_tokens: 6000,
    system:     systemPrompt,
    messages:   [{ role: "user", content: userPrompt }],
  });

  return message.content[0].text.trim();
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

  if (!API_KEY) { log("✗ ANTHROPIC_API_KEY not set. Exiting."); process.exit(1); }
  if (!UNSPLASH_KEY) log("⚠ UNSPLASH_ACCESS_KEY not set — articles will have no featured image");
  if (DRY_RUN) log("⚠ DRY RUN mode — nothing will be written to DB or rebuilt");

  const client = new Anthropic({ apiKey: API_KEY, baseURL: BASE_URL });
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
      rawHtml = await generateArticle(kw, client);
    } catch (err) {
      log(`✗ Claude error: ${err.message}`);
      const idx = keywords.findIndex(k => k.keyword === kw.keyword);
      if (idx !== -1) keywords[idx].status = "error";
      continue;
    }

    const contentHtml = processHtml(rawHtml);
    const plain       = stripHtml(contentHtml);
    const scores      = scoreArticle(contentHtml, kw.keyword);

    log(`  → ${scores.word_count} words | SEO: ${scores.seo_score} | AEO: ${scores.aeo_score} | AIO: ${scores.aio_score}`);

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

    // 2. Fetch image
    let featuredImage = null;
    if (!DRY_RUN) {
      featuredImage = await fetchAndSaveImage(kw.keyword, slug);
    } else {
      log(`  [DRY RUN] Would fetch Unsplash image for: ${kw.keyword}`);
    }

    // 3. Save to DB
    if (DRY_RUN) {
      log(`  [DRY RUN] Would insert: ${slug}`);
      log(`  HTML preview: ${contentHtml.slice(0, 200)}...`);
    } else {
      db.prepare(`
        INSERT INTO articles (
          title, slug, keyword, meta_description, content_html,
          word_count, focus_keyword, secondary_keywords,
          category, tags, image_alt_text, featured_image,
          seo_score, aeo_score, geo_score,
          created_at, published_date, status
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          datetime('now'), datetime('now'), 'published'
        )
      `).run(
        title, slug, kw.keyword, metaDesc, contentHtml,
        scores.word_count, kw.keyword, secondaryKw,
        kw.category, tags, `Ilustrasi artikel tentang ${kw.keyword}`, featuredImage,
        scores.seo_score, scores.aeo_score, scores.aio_score,
      );
      log(`  ✓ Inserted [published]: ${slug}`);
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
      execSync("npm run build && pm2 restart nuswalab", {
        cwd:   VPS_ROOT,
        stdio: "inherit",
      });
      log("✓ Build & restart complete");
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
