#!/usr/bin/env node
'use strict';
/**
 * Manage topical keyword clusters for content strategy.
 * Merges with existing keywords.json, preserving statuses.
 */

const fs = require('fs');
const path = require('path');

const KEYWORDS_FILE = '/home/ubuntu/nuswalab/scripts/keywords.json';

const CLUSTERS = [
  {
    name: 'Google Ads',
    pillar: { keyword: 'jasa google ads', search_intent: 'commercial', is_pillar: true },
    spokes: [
      { keyword: 'jasa google ads jakarta', search_intent: 'commercial' },
      { keyword: 'jasa google ads surabaya', search_intent: 'commercial' },
      { keyword: 'cara setting google ads untuk pemula', search_intent: 'informational' },
      { keyword: 'biaya jasa google ads indonesia', search_intent: 'commercial' },
      { keyword: 'google ads vs facebook ads mana yang lebih baik', search_intent: 'informational' },
      { keyword: 'jenis jenis iklan google ads', search_intent: 'informational' },
      { keyword: 'cara optimasi google ads agar hemat budget', search_intent: 'informational' },
    ],
  },
  {
    name: 'SEO',
    pillar: { keyword: 'jasa seo website', search_intent: 'commercial', is_pillar: true },
    spokes: [
      { keyword: 'jasa seo website jakarta', search_intent: 'commercial' },
      { keyword: 'jasa seo toko online', search_intent: 'commercial' },
      { keyword: 'cara meningkatkan ranking google', search_intent: 'informational' },
      { keyword: 'teknik seo on page terbaik', search_intent: 'informational' },
      { keyword: 'jasa seo lokal indonesia', search_intent: 'commercial' },
      { keyword: 'berapa harga jasa seo website', search_intent: 'informational' },
      { keyword: 'perbedaan seo dan sem', search_intent: 'informational' },
    ],
  },
  {
    name: 'Social Media',
    pillar: { keyword: 'jasa social media management', search_intent: 'commercial', is_pillar: true },
    spokes: [
      { keyword: 'jasa kelola instagram bisnis', search_intent: 'commercial' },
      { keyword: 'jasa facebook ads indonesia', search_intent: 'commercial' },
      { keyword: 'strategi konten instagram untuk bisnis', search_intent: 'informational' },
      { keyword: 'cara meningkatkan followers instagram organik', search_intent: 'informational' },
      { keyword: 'jasa tiktok ads indonesia', search_intent: 'commercial' },
      { keyword: 'social media marketing untuk umkm', search_intent: 'informational' },
    ],
  },
  {
    name: 'Website',
    pillar: { keyword: 'jasa pembuatan website profesional', search_intent: 'commercial', is_pillar: true },
    spokes: [
      { keyword: 'jasa pembuatan website toko online', search_intent: 'commercial' },
      { keyword: 'berapa biaya buat website perusahaan', search_intent: 'informational' },
      { keyword: 'website wordpress vs next js', search_intent: 'informational' },
      { keyword: 'jasa maintenance website murah', search_intent: 'commercial' },
      { keyword: 'cara memilih jasa web developer', search_intent: 'informational' },
    ],
  },
  {
    name: 'Digital Marketing',
    pillar: { keyword: 'jasa digital marketing indonesia', search_intent: 'commercial', is_pillar: true },
    spokes: [
      { keyword: 'strategi digital marketing untuk umkm', search_intent: 'informational' },
      { keyword: 'digital marketing vs traditional marketing', search_intent: 'informational' },
      { keyword: 'cara membuat strategi pemasaran digital', search_intent: 'informational' },
      { keyword: 'tools digital marketing terbaik 2026', search_intent: 'informational' },
      { keyword: 'jasa digital marketing surabaya', search_intent: 'commercial' },
      { keyword: 'jasa digital marketing bandung', search_intent: 'commercial' },
    ],
  },
];

// Load existing keywords
let existing = [];
if (fs.existsSync(KEYWORDS_FILE)) {
  try {
    existing = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf8'));
    if (!Array.isArray(existing)) existing = [];
  } catch (e) {
    existing = [];
  }
}

const existingMap = {};
for (const kw of existing) {
  existingMap[kw.keyword.toLowerCase()] = kw;
}

let added = 0;
const merged = [...existing];

for (const cluster of CLUSTERS) {
  const allKeywords = [
    { ...cluster.pillar, cluster: cluster.name, category: cluster.name },
    ...cluster.spokes.map(s => ({ ...s, cluster: cluster.name, category: cluster.name, is_pillar: false })),
  ];

  for (const entry of allKeywords) {
    const key = entry.keyword.toLowerCase();
    if (!existingMap[key]) {
      merged.push({ keyword: entry.keyword, category: entry.category, search_intent: entry.search_intent, cluster: entry.cluster, is_pillar: !!entry.is_pillar, status: 'pending' });
      existingMap[key] = true;
      added++;
    }
  }
}

fs.mkdirSync(path.dirname(KEYWORDS_FILE), { recursive: true });
fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(merged, null, 2), 'utf8');

console.log(`Done. Added ${added} new keywords, ${existing.length} already existed.`);
console.log(`Total: ${merged.length} keywords in ${KEYWORDS_FILE}`);
