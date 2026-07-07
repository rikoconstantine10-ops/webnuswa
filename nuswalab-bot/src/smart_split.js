'use strict';

const MAX_BUBBLES = 4;
const MIN_CONTENT_FOR_CTA_SPLIT = 80;
const MAX_BUBBLE_LEN = 320;

function smartSplit(text) {
  if (!text || !text.trim()) return [text || ''];

  let normalized = text.replace(/^-{3,}\s*$/gm, '---SPLIT---');
  normalized = normalized.replace(/---SPL[O0]?I?T?I?T?---/g, '---SPLIT---');
  normalized = normalized.replace(/---SPILT---/g, '---SPLIT---');
  normalized = normalized.replace(/---SPLITT---/g, '---SPLIT---');
  normalized = normalized.replace(/(---SPLIT---\s*){2,}/g, '---SPLIT---');

  const parts = normalized.split('---SPLIT---').map(p => p.trim()).filter(p => p.length > 0);

  if (parts.length > 1 && parts.length <= MAX_BUBBLES) return parts;

  const raw = parts.join('\n\n');
  return [raw];
}

module.exports = { smartSplit };
