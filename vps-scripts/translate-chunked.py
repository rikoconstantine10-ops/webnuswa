#!/usr/bin/env python3
import sqlite3, json, http.client, os, re, time, sys

DB_PATH = '/home/ubuntu/articel generator/data.db'
API_KEY = os.environ.get('AI_API_KEY') or os.environ.get('ANTHROPIC_API_KEY')
MODEL = 'claude-sonnet-4-6'
BASE_HOST = 'openagentic.id'
BASE_PATH = '/api/v1/chat/completions'

if not API_KEY:
    print('No API key', flush=True)
    sys.exit(1)

def chat(content, max_tokens=4096):
    body = json.dumps({
        'model': MODEL,
        'max_tokens': max_tokens,
        'stream': False,
        'messages': [{'role': 'user', 'content': content}]
    }).encode('utf-8')
    conn = http.client.HTTPSConnection(BASE_HOST, timeout=300)
    conn.request('POST', BASE_PATH, body, {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': len(body),
    })
    resp = conn.getresponse()
    data = resp.read().decode('utf-8')
    conn.close()
    if resp.status >= 400:
        raise Exception(str(resp.status) + ' ' + data[:300])
    j = json.loads(data)
    return j['choices'][0]['message']['content']

def split_html(html, max_bytes=10000):
    # Mark split points after block-closing tags, then split on the marker
    marked = re.sub(r'(</(?:p|h[1-6]|li|div|section|article|blockquote|pre)>)', lambda m: m.group(1) + '\x00', html)
    parts = marked.split('\x00')
    chunks, current, current_len = [], [], 0
    for part in parts:
        part_len = len(part.encode('utf-8'))
        if current_len + part_len > max_bytes and current:
            chunks.append(''.join(current))
            current, current_len = [part], part_len
        else:
            current.append(part)
            current_len += part_len
    if current:
        chunks.append(''.join(current))
    return chunks

def translate_chunk(chunk, i, total):
    print('  chunk ' + str(i) + '/' + str(total) + ' (' + str(len(chunk)) + ' bytes)', flush=True)
    prompt = ('Translate this Indonesian HTML to English. Rules:\n'
              '- Keep ALL HTML tags exactly as-is\n'
              '- Keep brand names (Nuswa Lab, Google Ads, WhatsApp, Meta Ads, SEO, Pexels) unchanged\n'
              '- Keep URLs and href values unchanged\n'
              '- Translate only visible text content\n'
              '- Return ONLY the translated HTML, nothing else\n\n' + chunk)
    return chat(prompt, max_tokens=4096)

db = sqlite3.connect(DB_PATH)
rows = db.execute(
    "SELECT id, title, meta_description, content_html FROM articles "
    "WHERE status='published' AND (title_en IS NULL OR title_en='') ORDER BY id"
).fetchall()

print('Found ' + str(len(rows)) + ' articles', flush=True)

for art_id, title, meta_desc, content_html in rows:
    print('\n[id:' + str(art_id) + '] ' + title[:60], flush=True)
    try:
        print('  meta...', flush=True)
        meta_raw = chat(
            'Translate from Indonesian to English. Return only valid JSON with keys "title" and "meta_description".\n\n'
            'TITLE: ' + title + '\nMETA_DESCRIPTION: ' + meta_desc,
            max_tokens=512
        )
        s, e = meta_raw.find('{'), meta_raw.rfind('}')
        if s == -1:
            raise Exception('No JSON: ' + meta_raw[:100])
        meta = json.loads(meta_raw[s:e+1])

        time.sleep(2)
        chunks = split_html(content_html, max_bytes=10000)
        print('  ' + str(len(chunks)) + ' chunks', flush=True)
        parts = []
        for i, chunk in enumerate(chunks, 1):
            if i > 1:
                time.sleep(2)
            parts.append(translate_chunk(chunk, i, len(chunks)))

        content_en = ''.join(parts)
        db.execute(
            "UPDATE articles SET title_en=?, meta_description_en=?, content_html_en=? WHERE id=?",
            (meta['title'], meta['meta_description'], content_en, art_id)
        )
        db.commit()
        print('  OK: ' + meta['title'], flush=True)
    except Exception as ex:
        print('  ERROR: ' + str(ex), flush=True)

db.close()
print('\n=== DONE ===', flush=True)
