import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "nuswalab-admin";
const VPS_ROOT = "/home/ubuntu/nuswalab";
const LOG_FILE = path.join(VPS_ROOT, "logs/article-gen.log");

function auth(req: Request) {
  return req.headers.get("x-admin-token") === ADMIN_TOKEN;
}

export async function GET(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let log = "";
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, "utf-8").split("\n");
    log = lines.slice(-100).join("\n");
  }
  return NextResponse.json({ log });
}

export async function POST(req: Request) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dry_run, max } = await req.json().catch(() => ({}));

  try {
    const envFile = path.join(VPS_ROOT, ".env.local");
    const envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf-8") : "";

    const apiKey = (envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1]?.trim() || "";
    const unsplashKey = (envContent.match(/^UNSPLASH_ACCESS_KEY=(.+)$/m) || [])[1]?.trim() || "";

    if (!apiKey || apiKey.includes("YOUR_KEY")) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured in .env.local" }, { status: 400 });
    }

    const env = [
      `ANTHROPIC_API_KEY=${apiKey}`,
      unsplashKey && !unsplashKey.includes("YOUR_") ? `UNSPLASH_ACCESS_KEY=${unsplashKey}` : "",
      dry_run ? "DRY_RUN=1" : "",
      max ? `MAX_DAILY=${max}` : "",
    ].filter(Boolean).join(" ");

    execSync(
      `nohup bash -c '${env} node ${VPS_ROOT}/scripts/keyword-article-gen.js >> ${LOG_FILE} 2>&1' &`,
      { cwd: VPS_ROOT }
    );

    return NextResponse.json({ ok: true, message: "Generation started in background. Check logs." });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
