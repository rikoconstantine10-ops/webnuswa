import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "nuswalab2026";
const VPS_ROOT = "/home/ubuntu/nuswalab";

function auth(req: Request) {
  return req.headers.get("x-admin-token") === ADMIN_TOKEN;
}

export async function POST(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { seed, category, type } = await req.json().catch(() => ({}));
  if (!seed) return NextResponse.json({ error: "seed required" }, { status: 400 });

  const envFile = path.join(VPS_ROOT, ".env.local");
  const envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf-8") : "";
  const apiKey = (envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1]?.trim() || process.env.ANTHROPIC_API_KEY || "";

  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 400 });

  const prompt = type === "competitor"
    ? `You are an SEO expert for Indonesian digital marketing. Given the competitor domain or brand "${seed}", suggest 15 long-tail keywords in Bahasa Indonesia they likely target in the "${category || "Digital Marketing"}" niche. Return ONLY a valid JSON array with no other text. Each item: {"keyword": "...", "search_intent": "informational|commercial|transactional", "category": "...", "reason": "short reason why"}`
    : `You are an SEO expert for Indonesian digital marketing. Generate 15 long-tail keyword variations in Bahasa Indonesia based on seed keyword "${seed}" for "${category || "Digital Marketing"}" category. Mix intents. Return ONLY a valid JSON array with no other text. Each item: {"keyword": "...", "search_intent": "informational|commercial|transactional", "category": "...", "reason": "short reason why"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const keywords = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ keywords });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "API error" }, { status: 500 });
  }
}
