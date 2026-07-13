#!/usr/bin/env node
/**
 * Backfill featured images for articles that have none
 * Uses Pexels API to fetch and save images locally
 * Run: PEXELS_API_KEY=... node scripts/backfill-images.js
 */
"use strict";

const https    = require("https");
const fs       = require("fs");
const path     = require("path");
const Database = require("better-sqlite3");

const DB_PATH   = "/home/ubuntu/articel generator/data.db";
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const IMAGE_DIR  = "/home/ubuntu/nuswalab/public/images/blog";
const DELAY_MS   = 600;

if (!PEXELS_KEY) { console.error("✗ PEXELS_API_KEY not set"); process.exit(1); }
fs.mkdirSync(IMAGE_DIR, { recursive: true });

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function fetchJson(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname + u.search, headers: { "User-Agent": "NuswaLab/1.0", ...headers } };
    https.get(opts, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on("error", reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      const mod = u.startsWith("https") ? https : require("http");
      const file = fs.createWriteStream(dest);
      mod.get(u, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close(); fs.unlink(dest, () => {}); follow(res.headers.location);
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      }).on("error", e => { fs.unlink(dest, () => {}); reject(e); });
    };
    follow(url);
  });
}

async function main() {
  const db = new Database(DB_PATH);
  const articles = db.prepare(
    "SELECT id, keyword, slug, title FROM articles WHERE status='published' AND (featured_image IS NULL OR featured_image='')"
  ).all();

  log(`Found ${articles.length} articles without images`);
  if (!articles.length) { db.close(); return; }

  const update = db.prepare("UPDATE articles SET featured_image=? WHERE id=?");
  let ok = 0, fail = 0;

  for (const a of articles) {
    const query = encodeURIComponent(
      (a.keyword || a.title || a.slug).split(/[\s-]/).slice(0, 4).join(" ") + " business marketing"
    );
    log(`\n[${ok+fail+1}/${articles.length}] id:${a.id} — "${a.title?.substring(0,50)}"`);
    try {
      const data = await fetchJson(
        `https://api.pexels.com/v1/search?query=${query}&per_page=5&orientation=landscape`,
        { Authorization: PEXELS_KEY }
      );
      const photo = data.photos?.[0];
      if (!photo) { log(`  ⚠ No photo found`); fail++; continue; }

      const imgUrl = photo.src.large2x || photo.src.large || photo.src.medium;
      const fname  = `${a.slug}.jpg`;
      const dest   = path.join(IMAGE_DIR, fname);
      await downloadFile(imgUrl, dest);

      const imgPath = `/images/blog/${fname}`;
      update.run(imgPath, a.id);
      log(`  ✓ ${imgPath} (by ${photo.photographer})`);
      ok++;
    } catch(e) {
      log(`  ✗ ${e.message}`);
      fail++;
    }
    if (ok + fail < articles.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  db.close();
  log(`\n=== DONE: ${ok} images saved, ${fail} failed ===`);
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
