import { NextResponse } from "next/server";

const DB_PATH = "/home/ubuntu/articel generator/data.db";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "nuswalab2026";

function auth(req: Request) {
  return req.headers.get("x-admin-token") === ADMIN_TOKEN;
}

export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(200, parseInt(searchParams.get("limit") || "20"));
  const offset = (page - 1) * limit;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: true });

    const articles = db.prepare(`
      SELECT id, title, slug, keyword, category, status, word_count,
             seo_score, aeo_score, geo_score, featured_image,
             created_at, published_date
      FROM articles
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = (db.prepare("SELECT COUNT(*) as n FROM articles").get() as any).n;
    db.close();

    return NextResponse.json({ articles, total, page, limit });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DB error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, id, status } = await req.json();

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH);

    if (action === "set_status" && id && status) {
      db.prepare("UPDATE articles SET status = ? WHERE id = ?").run(status, id);
    } else if (action === "delete" && id) {
      db.prepare("DELETE FROM articles WHERE id = ?").run(id);
    }

    db.close();
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DB error" }, { status: 500 });
  }
}
