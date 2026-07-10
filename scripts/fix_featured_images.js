#!/usr/bin/env node
'use strict';
/**
 * Patch existing blog JSON files: set featuredImage from /blog-images/ folder
 * matching by slug name, then also fix inline <img> src paths in content.
 */
const fs = require('fs');
const path = require('path');

const BLOG_DATA_DIR = '/home/ubuntu/nuswalab/src/data/blog';
const BLOG_IMG_DIR  = '/home/ubuntu/nuswalab/public/blog-images';

// Build a map: slug-prefix → image filename
const imgFiles = fs.existsSync(BLOG_IMG_DIR) ? fs.readdirSync(BLOG_IMG_DIR) : [];
const imgMap = {};
for (const f of imgFiles) {
  // key = basename without extension (lowercased)
  const key = f.replace(/\.[^.]+$/, '').toLowerCase();
  imgMap[key] = f;
}

const jsonFiles = fs.readdirSync(BLOG_DATA_DIR).filter(f => f.endsWith('.json'));
let patched = 0;

for (const jf of jsonFiles) {
  const jpath = path.join(BLOG_DATA_DIR, jf);
  const post = JSON.parse(fs.readFileSync(jpath, 'utf8'));
  let changed = false;

  // 1. Set featuredImage if missing
  if (!post.featuredImage) {
    const slug = post.slug || jf.replace('.json', '');
    // Try exact slug match first
    let imgFile = imgMap[slug];
    // Fallback: find any image whose filename starts with the slug
    if (!imgFile) {
      imgFile = imgFiles.find(f => f.toLowerCase().startsWith(slug.toLowerCase()));
    }
    if (imgFile) {
      post.featuredImage = '/blog-images/' + imgFile;
      post.updatedAt = new Date().toISOString();
      changed = true;
      console.log(`[${slug}] featuredImage → ${post.featuredImage}`);
    } else {
      console.log(`[${slug}] no matching image found`);
    }
  }

  if (changed) {
    fs.writeFileSync(jpath, JSON.stringify(post, null, 2), 'utf8');
    patched++;
  }
}

console.log(`\nDone. Patched ${patched}/${jsonFiles.length} articles.`);
