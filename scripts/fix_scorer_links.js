#!/usr/bin/env node
'use strict';
/**
 * Fix scorer.js: internal link regex should also recognize myeducationrepublic.com
 */
const fs = require('fs');

const SCORER = "/home/ubuntu/articel generator/src/scorer.js";
let scorer = fs.readFileSync(SCORER, 'utf8');

// Fix internal link detection to include myeducationrepublic.com
scorer = scorer.replace(
  `const internalLinks = [...(content || '').matchAll(/href\\s*=\\s*[\"'](\\/[^\"']*|https?:\\/\\/nuswalab\\.com[^\"']*)[\"']/gi)];`,
  `const internalLinks = [...(content || '').matchAll(/href\\s*=\\s*[\"'](\\/[^\"']*|https?:\\/\\/(?:nuswalab|www\\.myeducationrepublic|myeducationrepublic)\\.com[^\"']*)[\"']/gi)];`
);

fs.writeFileSync(SCORER, scorer, 'utf8');
console.log('[scorer.js] Fixed: internal link regex now includes myeducationrepublic.com');
