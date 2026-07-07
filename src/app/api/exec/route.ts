import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

const API_KEY = process.env.EXEC_API_KEY || "PGFypaGOf5K23AdFob7v1gyByfzh4mgl";

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("api_key");
  if (key !== API_KEY) {
    return NextResponse.json({ success: false, output: "Unauthorized" }, { status: 401 });
  }

  let command: string;
  try {
    const body = await req.json();
    command = body.command;
  } catch {
    return NextResponse.json({ success: false, output: "Invalid JSON body" }, { status: 400 });
  }

  if (!command || typeof command !== "string") {
    return NextResponse.json({ success: false, output: "Missing command" }, { status: 400 });
  }

  try {
    const output = execSync(command, {
      encoding: "utf8",
      timeout: 60000,
      shell: "/bin/bash",
    });
    return NextResponse.json({ success: true, returncode: 0, output });
  } catch (e: unknown) {
    const err = e as { message?: string; stdout?: string; stderr?: string };
    const output = err.stdout || err.stderr || err.message || "Command failed";
    return NextResponse.json({ success: false, returncode: 1, output });
  }
}
