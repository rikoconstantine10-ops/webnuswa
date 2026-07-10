#!/usr/bin/env node
'use strict';
/**
 * Patch article generator on VPS:
 * 1. pipeline.js — use uploadImage() instead of saveImageLocally() for WP posts
 * 2. pexels.js   — fix fallback keywords from education → digital marketing
 */
const fs = require('fs');

// ── pipeline.js patches ────────────────────────────────────────────────────────
const PIPELINE = "/home/ubuntu/articel generator/src/pipeline.js";
let pipeline = fs.readFileSync(PIPELINE, 'utf8');

// 1a. Add uploadImage to wordpress require
pipeline = pipeline.replace(
  "const { createPost, getRecentPosts } = require('./wordpress');",
  "const { createPost, getRecentPosts, uploadImage } = require('./wordpress');"
);

// 1b. Replace saveImageLocally with uploadImage for featured image
pipeline = pipeline.replace(
  "const media  = await saveImageLocally(buffer, fname, featuredAlt);",
  "const media  = await uploadImage(buffer, fname, featuredAlt);"
);

// 1c. Replace saveImageLocally with uploadImage for inline images
pipeline = pipeline.replace(
  "const media  = await saveImageLocally(buffer, fname, enrichedAlt);",
  "const media  = await uploadImage(buffer, fname, enrichedAlt);"
);

// 1d. Fix inline image src — after uploadImage, media.url is the full WP URL, so keep as-is
// but also update the featuredImage fallback to use full URL from WP
// (uploadImage returns { id, url } where url is already absolute WP media URL)

fs.writeFileSync(PIPELINE, pipeline, 'utf8');
console.log('[pipeline.js] Patched: uploadImage replaces saveImageLocally');

// ── pexels.js patches ─────────────────────────────────────────────────────────
const PEXELS = "/home/ubuntu/articel generator/src/pexels.js";
let pexels = fs.readFileSync(PEXELS, 'utf8');

// 2a. Replace education fallback queries in fetchFromPexels with digital marketing
pexels = pexels.replace(
  `    'university students campus',
    'international students study abroad',
    'university lecture hall',`,
  `    'digital marketing agency office',
    'business team meeting laptop',
    'social media marketing professional',`
);

// 2b. Replace Unsplash fallback queries
pexels = pexels.replace(
  `    'university campus students',
    'college students study',`,
  `    'digital marketing business',
    'office professional team',`
);

fs.writeFileSync(PEXELS, pexels, 'utf8');
console.log('[pexels.js] Patched: fallback keywords updated to digital marketing');

console.log('All patches applied successfully.');
