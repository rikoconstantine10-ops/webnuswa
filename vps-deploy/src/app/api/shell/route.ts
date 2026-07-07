import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const SHELL_TOKEN = process.env.SHELL_TOKEN || process.env.ADMIN_TOKEN || "nuswalab-admin";

export async function POST(req: Request) {
  if (req.headers.get("x-shell-token") !== SHELL_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { command, cwd } = await req.json().catch(() => ({ command: "", cwd: undefined }));
  if (!command) return NextResponse.json({ error: "No command" }, { status: 400 });

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || "/home/ubuntu/nuswalab",
      timeout: 120000,
      env: { ...process.env, PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin" },
    });
    return NextResponse.json({ ok: true, stdout, stderr });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      stdout: e.stdout || "",
      stderr: e.stderr || e.message || "Error",
      code: e.code,
    }, { status: 200 }); // 200 so n8n doesn't fail on error exit codes
  }
}
