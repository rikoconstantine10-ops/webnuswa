import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const KEYWORDS_FILE = path.join(process.cwd(), "scripts/keywords.json");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "nuswalab-admin";

function auth(req: Request) {
  const token = req.headers.get("x-admin-token");
  return token === ADMIN_TOKEN;
}

export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!fs.existsSync(KEYWORDS_FILE)) return NextResponse.json([]);
  const data = JSON.parse(fs.readFileSync(KEYWORDS_FILE, "utf-8"));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { action, keyword, category, search_intent, index } = body;

  let keywords: any[] = [];
  if (fs.existsSync(KEYWORDS_FILE)) {
    keywords = JSON.parse(fs.readFileSync(KEYWORDS_FILE, "utf-8"));
  }

  if (action === "add") {
    if (!keyword) return NextResponse.json({ error: "keyword required" }, { status: 400 });
    keywords.push({
      keyword: keyword.trim(),
      category: category || "Digital Marketing",
      search_intent: search_intent || "informational",
      status: "pending",
    });
  } else if (action === "reset" && index !== undefined) {
    if (keywords[index]) keywords[index].status = "pending";
  } else if (action === "delete" && index !== undefined) {
    keywords.splice(index, 1);
  } else if (action === "reset_all") {
    keywords = keywords.map(k => ({ ...k, status: "pending" }));
  }

  fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(keywords, null, 2), "utf-8");
  return NextResponse.json({ ok: true, keywords });
}
