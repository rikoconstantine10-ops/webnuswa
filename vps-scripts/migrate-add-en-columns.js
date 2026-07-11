#!/usr/bin/env node
/**
 * Migration: add EN translation columns to articles table
 * Run once on VPS: node scripts/migrate-add-en-columns.js
 */

"use strict";

const Database = require("better-sqlite3");
const DB_PATH = "/home/ubuntu/articel generator/data.db";

const db = new Database(DB_PATH);

const columns = [
  { name: "title_en",            type: "TEXT" },
  { name: "meta_description_en", type: "TEXT" },
  { name: "content_html_en",     type: "TEXT" },
];

for (const col of columns) {
  try {
    db.prepare(`ALTER TABLE articles ADD COLUMN ${col.name} ${col.type}`).run();
    console.log(`✓ Added column: ${col.name}`);
  } catch (e) {
    if (e.message.includes("duplicate column name")) {
      console.log(`⟳ Already exists: ${col.name}`);
    } else {
      throw e;
    }
  }
}

const count = db.prepare("SELECT COUNT(*) as n FROM articles WHERE status='published'").get();
console.log(`\nDB has ${count.n} published articles. EN columns ready.`);
console.log("Run the article gen or visit /en/blog/<slug> to auto-translate.");

db.close();
