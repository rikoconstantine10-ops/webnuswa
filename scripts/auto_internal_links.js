#!/usr/bin/env node
'use strict';
/**
 * Inject internal links between blog articles.
 * For each article, finds other articles' focusKeyword in content and links them.
 */

const fs = require('fs');
const path = require('path');

const BLOG_DATA_DIR = '/home/ubuntu/nuswalab/src/data/blog';

const jsonFiles = fs.readdirSync(BLOG_DATA_DIR).filter(f => f.endsWith('.json'));
const posts = jsonFiles.map(f => JSON.parse(fs.readFileSync(path.join(BLOG_DATA_DIR, f), 'utf8')));

// Build keyword → slug map (skip very short keywords)
const kwMap = [];
for (const p of posts) {
  if (p.focusKeyword && p.focusKeyword.length >= 5 && p.slug) {
    kwMap.push({ keyword: p.focusKeyword.toLowerCase(), slug: p.slug });
  }
}

let totalLinks = 0;

for (const post of posts) {
  let html = post.content || '';
  let linksAdded = 0;

  for (const { keyword, slug } of kwMap) {
    // Skip linking to self
    if (slug === post.slug) continue;

    // Skip if already linked to this slug
    if (html.includes(`href="/blog/${slug}"`)) continue;

    // Find first occurrence not already inside an <a> tag
    const escapedKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![">])\\b(${escapedKw})\\b(?![^<]*<\\/a>)`, 'i');
    const match = re.exec(html);
    if (!match) continue;

    html = html.slice(0, match.index) +
      `<a href="/blog/${slug}">${match[1]}</a>` +
      html.slice(match.index + match[1].length);
    linksAdded++;
  }

  if (linksAdded > 0) {
    post.content = html;
    post.updatedAt = new Date().toISOString();
    fs.writeFileSync(path.join(BLOG_DATA_DIR, `${post.slug}.json`), JSON.stringify(post, null, 2), 'utf8');
    console.log(`[${post.slug}] +${linksAdded} internal link(s)`);
    totalLinks += linksAdded;
  } else {
    console.log(`[${post.slug}] no changes`);
  }
}

console.log(`\nDone. Added ${totalLinks} internal links across ${posts.length} articles.`);
