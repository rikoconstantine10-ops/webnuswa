import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ENV_FILE = process.env.ENV_FILE_PATH || "/home/ubuntu/nuswalab/.env.local";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "nuswalab2026";

function auth(req: NextRequest) {
  return req.headers.get("x-admin-token") === ADMIN_TOKEN;
}

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    result[key] = val;
  }
  return result;
}

function serializeEnv(existing: string, updates: Record<string, string>): string {
  const lines = existing.split("\n");
  const written = new Set<string>();

  const result = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const idx = trimmed.indexOf("=");
    if (idx < 0) return line;
    const key = trimmed.slice(0, idx).trim();
    if (key in updates) {
      written.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  // Append new keys not already present
  for (const [key, val] of Object.entries(updates)) {
    if (!written.has(key)) result.push(`${key}=${val}`);
  }

  return result.join("\n");
}

// GET — return current settings (masked)
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let env: Record<string, string> = {};
  try {
    const content = fs.readFileSync(ENV_FILE, "utf-8");
    env = parseEnv(content);
  } catch {
    // file may not exist yet
  }

  return NextResponse.json({
    openai_api_key: env.OPENAI_API_KEY ? maskKey(env.OPENAI_API_KEY) : "",
    openai_base_url: env.OPENAI_BASE_URL || "https://openagentic.id/api/v1",
    openai_model: env.OPENAI_MODEL || "claude-sonnet-5",
    pexels_api_key: env.PEXELS_API_KEY ? maskKey(env.PEXELS_API_KEY) : "",
    anthropic_api_key: env.ANTHROPIC_API_KEY ? maskKey(env.ANTHROPIC_API_KEY) : "",
    has_openai_key: !!env.OPENAI_API_KEY,
    has_anthropic_key: !!env.ANTHROPIC_API_KEY,
    has_pexels_key: !!env.PEXELS_API_KEY,
  });
}

function maskKey(key: string) {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 6) + "••••••••" + key.slice(-4);
}

// POST — update settings or fetch models
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Action: fetch available models from the configured API
  if (body.action === "fetch_models") {
    const { api_key, base_url } = body;
    if (!api_key || !base_url) {
      return NextResponse.json({ error: "api_key and base_url required" }, { status: 400 });
    }
    try {
      const url = base_url.replace(/\/$/, "") + "/models";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${api_key}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `API returned ${res.status}: ${text.slice(0, 200)}` }, { status: 502 });
      }
      const data = await res.json();
      // Handle OpenAI-compatible response: { data: [{id, ...}] } or { models: [...] } or [{id,...}]
      const models: string[] = [];
      const list = Array.isArray(data) ? data : (data.data ?? data.models ?? []);
      for (const m of list) {
        if (typeof m === "string") models.push(m);
        else if (m?.id) models.push(m.id);
        else if (m?.name) models.push(m.name);
      }
      return NextResponse.json({ models });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to fetch models" }, { status: 502 });
    }
  }

  // Action: save settings
  if (body.action === "save") {
    const updates: Record<string, string> = {};
    if (body.openai_api_key && !body.openai_api_key.includes("•")) updates.OPENAI_API_KEY = body.openai_api_key;
    if (body.openai_base_url) updates.OPENAI_BASE_URL = body.openai_base_url;
    if (body.openai_model) updates.OPENAI_MODEL = body.openai_model;
    if (body.pexels_api_key && !body.pexels_api_key.includes("•")) updates.PEXELS_API_KEY = body.pexels_api_key;
    if (body.anthropic_api_key && !body.anthropic_api_key.includes("•")) updates.ANTHROPIC_API_KEY = body.anthropic_api_key;

    try {
      let existing = "";
      try { existing = fs.readFileSync(ENV_FILE, "utf-8"); } catch {}
      const updated = serializeEnv(existing, updates);
      fs.mkdirSync(path.dirname(ENV_FILE), { recursive: true });
      fs.writeFileSync(ENV_FILE, updated, "utf-8");
      return NextResponse.json({ ok: true, updated: Object.keys(updates) });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
