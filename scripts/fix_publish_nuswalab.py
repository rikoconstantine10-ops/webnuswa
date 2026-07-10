#!/usr/bin/env python3
"""
Patch article generator to publish directly to nuswalab blog (local JSON files)
instead of WordPress. Also adds ISR revalidate to nuswalab blog pages.
"""
import re, sys

PIPELINE = "/home/ubuntu/articel generator/src/pipeline.js"

with open(PIPELINE, 'r') as f:
    code = f.read()

# ── 1. Revert uploadImage → saveImageLocally ────────────────────────────────
code = code.replace(
    "const { createPost, getRecentPosts, uploadImage } = require('./wordpress');",
    "const { createPost, getRecentPosts } = require('./wordpress');"
)
code = code.replace(
    "const media  = await uploadImage(buffer, fname, featuredAlt);",
    "const media  = await saveImageLocally(buffer, fname);"
)
code = code.replace(
    "const media  = await uploadImage(buffer, fname, enrichedAlt);",
    "const media  = await saveImageLocally(buffer, fname);"
)

# ── 2. Replace entire WP block (step 9) with local JSON publish ─────────────
# Find the block: from "// 9. Save to nuswalab blog JSON" through the closing }
# and the wp_url/RankMath setTimeout block, up to "// 10. GSheet sync"
WP_BLOCK_START = "    // 9. Save to nuswalab blog JSON (skip WP if WP_URL not configured)"
GSHEET_BLOCK = "    // 10. GSheet sync"

start_idx = code.find(WP_BLOCK_START)
end_idx   = code.find(GSHEET_BLOCK)

if start_idx == -1 or end_idx == -1:
    print(f"ERROR: Could not find WP block markers. start={start_idx}, end={end_idx}", file=sys.stderr)
    sys.exit(1)

NEW_PUBLISH_BLOCK = """\
    // 9. Publish to nuswalab blog (local JSON file — same VPS)
    const BLOG_DATA_DIR = '/home/ubuntu/nuswalab/src/data/blog';
    const blogSlug = generated.slug || (article.keyword || article.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const nuswaUrl = `https://nuswalab.com/blog/${blogSlug}`;
    let wpResult = { id: null, url: nuswaUrl };
    try {
      fs.mkdirSync(BLOG_DATA_DIR, { recursive: true });
      const blogPost = {
        slug:            blogSlug,
        title:           generated.title || article.title,
        metaDescription: generated.meta_description || '',
        focusKeyword:    generated.focus_keyword || article.keyword || '',
        content:         generated.content_html || '',
        wordCount:       generated.word_count || 0,
        publishedAt:     new Date().toISOString(),
        updatedAt:       new Date().toISOString(),
        category:        (generated.wp_categories && generated.wp_categories[0]) || 'Digital Marketing',
        tags:            generated.tags || [],
        featuredImage:   generated.featuredImage || null,
        qcScore:         qcResult.score || 0,
      };
      fs.writeFileSync(
        path.join(BLOG_DATA_DIR, `${blogSlug}.json`),
        JSON.stringify(blogPost, null, 2),
        'utf8'
      );
      wpResult = { id: null, url: nuswaUrl };
      db.prepare("UPDATE articles SET status='published', wp_url=?, published_date=?, updated_at=datetime('now') WHERE id=?")
        .run(nuswaUrl, new Date().toISOString(), articleId);
      log(articleId, 'info', `Published to nuswalab: ${nuswaUrl}`);
      console.log(`[pipeline] Blog JSON written: ${blogSlug}.json`);
    } catch(pubErr) {
      log(articleId, 'warn', 'Publish to nuswalab failed: ' + pubErr.message);
    }

"""

code = code[:start_idx] + NEW_PUBLISH_BLOCK + code[end_idx:]

# ── 3. Fix return statement at end of runPipeline ────────────────────────────
# Replace old WP-centric log and return
code = code.replace(
    "log(articleId, 'info', `Pipeline complete. WP draft ID: ${wpResult.id}`)",
    "log(articleId, 'info', `Pipeline complete. Published: ${wpResult.url || 'local'}`)"
)
code = code.replace(
    "return { success: true, articleId, wpPostId: wpResult.id, wpUrl: wpResult.url, qcScore: qcResult.score };",
    "return { success: true, articleId, wpPostId: null, wpUrl: wpResult.url, nuswaUrl: wpResult.url, qcScore: qcResult.score };"
)

# ── 4. Simplify approveArticle: no WP, just update DB + JSON ─────────────────
OLD_APPROVE = '''// Approve article
async function approveArticle(articleId) {
  const db = getDb();
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
  if (!article || !article.wp_post_id) throw new Error('Article not found or no WP post');
  const axios = require('axios');
  const { WP_URL, WP_USERNAME, WP_APP_PASSWORD } = require('./config');
  const token = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');
  const publishDate = article.scheduled_date || null;
  const body = publishDate ? { status: 'future', date: publishDate } : { status: 'publish' };
  await axios.post(`${WP_URL}/wp-json/wp/v2/posts/${article.wp_post_id}`, body, {
    headers: { Authorization: `Basic ${token}`, 'Content-Type': 'application/json' },
    timeout: 15000
  });
  const newStatus = publishDate ? 'scheduled' : 'published';
  db.prepare(`UPDATE articles SET status=?, published_date=?, updated_at=datetime('now') WHERE id=?`)
    .run(newStatus, new Date().toISOString(), articleId);
  log(articleId, 'info', `Article ${newStatus}`);'''

if OLD_APPROVE in code:
    # Find end of the old approveArticle function (up to rejectArticle)
    approve_start = code.find('// Approve article')
    reject_start  = code.find('// Reject article')
    if approve_start != -1 and reject_start != -1:
        NEW_APPROVE = '''// Approve article (nuswalab — no WP, update DB + JSON)
async function approveArticle(articleId) {
  const db = getDb();
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
  if (!article) throw new Error('Article not found: ' + articleId);
  const newStatus = 'published';
  db.prepare(`UPDATE articles SET status=?, published_date=?, updated_at=datetime('now') WHERE id=?`)
    .run(newStatus, new Date().toISOString(), articleId);

  // Also update publishedAt in the blog JSON file
  const BLOG_DATA_DIR = '/home/ubuntu/nuswalab/src/data/blog';
  const slug = article.slug || '';
  if (slug) {
    const jsonPath = require('path').join(BLOG_DATA_DIR, `${slug}.json`);
    try {
      if (require('fs').existsSync(jsonPath)) {
        const post = JSON.parse(require('fs').readFileSync(jsonPath, 'utf8'));
        post.publishedAt = new Date().toISOString();
        post.updatedAt   = new Date().toISOString();
        require('fs').writeFileSync(jsonPath, JSON.stringify(post, null, 2), 'utf8');
      }
    } catch(e) { console.warn('[approveArticle] JSON update failed:', e.message); }
  }

  log(articleId, 'info', `Article ${newStatus}`);
  return { success: true, status: newStatus };
}

'''
        code = code[:approve_start] + NEW_APPROVE + code[reject_start:]
        print('[pipeline.js] approveArticle rewritten (no WP dependency)')
else:
    # Couldn't find the exact OLD_APPROVE block but may have been changed already
    print('[pipeline.js] approveArticle block not found — may already be patched')

with open(PIPELINE, 'w') as f:
    f.write(code)
print('[pipeline.js] Patched: publish to nuswalab JSON instead of WordPress')

# ── 5. Add revalidate to nuswalab blog pages ──────────────────────────────────
BLOG_LISTING = "/home/ubuntu/nuswalab/src/app/blog/page.tsx"
BLOG_SLUG    = "/home/ubuntu/nuswalab/src/app/blog/[slug]/page.tsx"

for fpath in [BLOG_LISTING, BLOG_SLUG]:
    try:
        with open(fpath, 'r') as f:
            content = f.read()
        if 'export const revalidate' not in content:
            # Add after the first import block (before first non-import line that's meaningful)
            content = content.replace(
                'export const metadata',
                'export const revalidate = 3600;\n\nexport const metadata',
                1
            )
            if 'export const revalidate' not in content:
                # fallback: prepend
                content = 'export const revalidate = 3600;\n\n' + content
            with open(fpath, 'w') as f:
                f.write(content)
            print(f'[{fpath.split("/")[-2]}/{fpath.split("/")[-1]}] Added revalidate = 3600')
        else:
            print(f'[{fpath.split("/")[-1]}] revalidate already set')
    except Exception as e:
        print(f'[WARN] Could not patch {fpath}: {e}')

print('All patches applied.')
