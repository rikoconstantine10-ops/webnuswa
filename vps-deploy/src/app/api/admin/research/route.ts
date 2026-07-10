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
  const apiKey = (envContent.match(/^OPENAI_API_KEY=(.+)$/m) || [])[1]?.trim()
    || (envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1]?.trim()
    || process.env.OPENAI_API_KEY || "";
  const baseUrl = (envContent.match(/^OPENAI_BASE_URL=(.+)$/m) || [])[1]?.trim()
    || process.env.OPENAI_BASE_URL || "https://openagentic.id/api/v1";
  const model = (envContent.match(/^OPENAI_MODEL=(.+)$/m) || [])[1]?.trim()
    || process.env.OPENAI_MODEL || "claude-sonnet-5";

  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 400 });

  const systemPrompt = "You are an SEO expert for Indonesian digital marketing. Return ONLY a valid JSON array with no other text. No markdown, no explanation.";
  const userPrompt = type === "competitor"
    ? `Given the competitor domain or brand "${seed}", suggest 15 long-tail keywords in Bahasa Indonesia they likely target in the "${category || "Digital Marketing"}" niche. Each item: {"keyword": "...", "search_intent": "informational|commercial|transactional", "category": "...", "reason": "short reason why"}`
    : `Generate 15 long-tail keyword variations in Bahasa Indonesia based on seed keyword "${seed}" for "${category || "Digital Marketing"}" category. Mix intents. Each item: {"keyword": "...", "search_intent": "informational|commercial|transactional", "category": "...", "reason": "short reason why"}`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const keywords = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ keywords });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "API error" }, { status: 500 });
  }
}
