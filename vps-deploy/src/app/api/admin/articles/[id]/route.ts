import { NextRequest, NextResponse } from "next/server";

const DB_PATH = "/home/ubuntu/articel generator/data.db";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "nuswalab2026";

function auth(req: NextRequest) {
  return req.headers.get("x-admin-token") === ADMIN_TOKEN;
}

// GET /api/admin/articles/[id] — full article including content_html
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: true });
    const article = db.prepare(`
      SELECT id, title, slug, keyword, meta_description, content_html,
             word_count, focus_keyword, secondary_keywords,
             category, tags, image_alt_text, featured_image,
             seo_score, aeo_score, geo_score,
             status, created_at, published_date
      FROM articles WHERE id = ?
    `).get(id);
    db.close();
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ article });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DB error" }, { status: 500 });
  }
}

// PUT /api/admin/articles/[id] — update article fields
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH);

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.title !== undefined)          { fields.push("title = ?");           values.push(body.title); }
    if (body.content_html !== undefined)   { fields.push("content_html = ?");    values.push(body.content_html); }
    if (body.meta_description !== undefined){ fields.push("meta_description = ?"); values.push(body.meta_description); }
    if (body.slug !== undefined)           { fields.push("slug = ?");            values.push(body.slug); }
    if (body.category !== undefined)       { fields.push("category = ?");        values.push(body.category); }
    if (body.status !== undefined) {
      fields.push("status = ?");
      values.push(body.status);
      if (body.status === "published") fields.push("published_date = datetime('now')");
    }
    if (body.featured_image !== undefined) { fields.push("featured_image = ?");  values.push(body.featured_image); }

    if (fields.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    values.push(id);
    db.prepare(`UPDATE articles SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    db.close();

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DB error" }, { status: 500 });
  }
}
