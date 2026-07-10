#!/usr/bin/env node
'use strict';
/**
 * Patch 2 for keyword-article-gen.js:
 * 1. Fix IMAGE_DIR → /public/blog-images/ (consistent with existing articles)
 * 2. Write JSON to src/data/blog/ after DB insert (blog reads from JSON, not DB)
 * 3. Fix build/restart: nohup instead of pm2
 */

const fs = require('fs');
const FILE = '/home/ubuntu/nuswalab/scripts/keyword-article-gen.js';

let src = fs.readFileSync(FILE, 'utf8');

// ── Patch 1: Fix IMAGE_DIR path ────────────────────────────────────────────

const OLD_IMAGE_DIR = `const IMAGE_DIR       = path.join(VPS_ROOT, "public/images/blog");`;
const NEW_IMAGE_DIR = `const IMAGE_DIR       = path.join(VPS_ROOT, "public/blog-images");`;

if (src.includes(OLD_IMAGE_DIR)) {
  src = src.replace(OLD_IMAGE_DIR, NEW_IMAGE_DIR);
  console.log('[patch2] IMAGE_DIR fixed: public/images/blog → public/blog-images');
} else if (src.includes(NEW_IMAGE_DIR)) {
  console.log('[patch2] IMAGE_DIR already correct');
} else {
  console.log('[patch2] WARN: IMAGE_DIR not found');
}

// ── Patch 2: Fix image return URL ─────────────────────────────────────────

const OLD_IMG_URL = "    log(`✓ Image saved: /images/blog/${slug}.jpg (by ${photo.photographer} on Pexels)`);\n    return `/images/blog/${slug}.jpg`;";
const NEW_IMG_URL = "    log(`✓ Image saved: /blog-images/${slug}.jpg (by ${photo.photographer} on Pexels)`);\n    return `/blog-images/${slug}.jpg`;";

if (src.includes(OLD_IMG_URL)) {
  src = src.replace(OLD_IMG_URL, NEW_IMG_URL);
  console.log('[patch2] Image return URL fixed: /images/blog/ → /blog-images/');
} else {
  console.log('[patch2] Image URL already correct or not found');
}

// ── Patch 3: Write JSON to src/data/blog/ after DB insert ─────────────────

const OLD_AFTER_INSERT = `      log(\`  ✓ Inserted [\${ARTICLE_STATUS}]: \${slug}\`);
    }

    // Mark keyword as done`;

const NEW_AFTER_INSERT = `      log(\`  ✓ Inserted [\${ARTICLE_STATUS}]: \${slug}\`);

      // Write JSON file to src/data/blog/ (blog reads from JSON, not DB)
      const BLOG_DATA_DIR = path.join(VPS_ROOT, 'src/data/blog');
      fs.mkdirSync(BLOG_DATA_DIR, { recursive: true });
      let parsedTags = [];
      try { parsedTags = JSON.parse(tags); } catch(e) {}
      const blogJson = {
        slug,
        title,
        metaDescription: metaDesc,
        focusKeyword: kw.keyword,
        content: contentHtml,
        wordCount: scores.word_count,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: kw.category,
        tags: parsedTags,
        featuredImage,
        author: {
          name: 'Tim Nuswa Lab',
          url: 'https://nuswalab.com/about',
          image: 'https://nuswalab.com/images/nuswalab-logo.png',
        },
        readingTime: Math.max(1, Math.round(scores.word_count / 200)),
        faqItems,
        seoScore: scores.seo_score,
        aeoScore: scores.aeo_score,
        aioScore: scores.aio_score,
      };
      const jsonPath = path.join(BLOG_DATA_DIR, \`\${slug}.json\`);
      fs.writeFileSync(jsonPath, JSON.stringify(blogJson, null, 2), 'utf8');
      log(\`  ✓ JSON written: src/data/blog/\${slug}.json\`);
    }

    // Mark keyword as done`;

if (src.includes(OLD_AFTER_INSERT)) {
  src = src.replace(OLD_AFTER_INSERT, NEW_AFTER_INSERT);
  console.log('[patch2] JSON file write added after DB insert');
} else {
  console.log('[patch2] WARN: could not find post-insert block');
}

// ── Patch 4: Fix build/restart command (pm2 → nohup) ─────────────────────

const OLD_BUILD = `      execSync("npm run build && pm2 restart nuswalab", {
        cwd:   VPS_ROOT,
        stdio: "inherit",
      });
      log("✓ Build & restart complete");`;

const NEW_BUILD = `      // Run build in background (avoids timeout), restart when done
      const { spawnSync } = require("child_process");
      const buildLog = '/tmp/nuswalab-build.log';
      fs.writeFileSync(buildLog, '');
      const buildResult = spawnSync('bash', ['-c',
        \`cd \${VPS_ROOT} && sudo -u ubuntu npm run build >> \${buildLog} 2>&1 && echo BUILD_OK >> \${buildLog}\`
      ], { timeout: 300000 });
      const logContent = fs.existsSync(buildLog) ? fs.readFileSync(buildLog, 'utf8') : '';
      if (logContent.includes('BUILD_OK')) {
        // Restart server
        const old = require('child_process').execSync(
          "ss -tlnp | grep ':3000' | grep -oP 'pid=\\\\K[0-9]+' | head -1"
        ).toString().trim();
        if (old) {
          try { process.kill(parseInt(old), 'SIGTERM'); } catch(e) {}
          log(\`  → Killed old server PID \${old}\`);
        }
        spawnSync('bash', ['-c',
          \`nohup bash -c 'cd \${VPS_ROOT} && sudo -u ubuntu npm run start > /tmp/nuswalab-server.log 2>&1' > /dev/null 2>&1 &\`
        ]);
        log("✓ Build & restart complete");
      } else {
        log(\`✗ Build may have failed. Check \${buildLog}\`);
      }`;

if (src.includes(OLD_BUILD)) {
  src = src.replace(OLD_BUILD, NEW_BUILD);
  console.log('[patch2] Build/restart fixed: pm2 → nohup');
} else {
  console.log('[patch2] WARN: build command not found or already patched');
}

// ── Write patched file ─────────────────────────────────────────────────────

fs.writeFileSync(FILE, src, 'utf8');
console.log('\n✓ Patch 2 applied to keyword-article-gen.js');
console.log('  - Images now saved to /blog-images/ (consistent with existing articles)');
console.log('  - JSON file written to src/data/blog/ automatically after generation');
console.log('  - author, readingTime, faqItems, seoScore included in JSON');
console.log('  - Build uses nohup + proper restart (no pm2)');
