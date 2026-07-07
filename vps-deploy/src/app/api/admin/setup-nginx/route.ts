import { NextResponse } from "next/server";
import { execSync } from "child_process";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "nuswalab-admin";

export async function POST(req: Request) {
  if (req.headers.get("x-admin-token") !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    const conf = `/etc/nginx/sites-available/seo.nuswalab.com`;
    const enabled = `/etc/nginx/sites-enabled/seo.nuswalab.com`;
    const src = `/home/ubuntu/nuswalab/vps-scripts/nginx-seo-subdomain.conf`;

    results.push(execSync(`cp ${src} ${conf} && echo "copied"`).toString().trim());
    results.push(execSync(`ln -sf ${conf} ${enabled} && echo "linked"`).toString().trim());
    results.push(execSync(`nginx -t 2>&1`).toString().trim());
    results.push(execSync(`nginx -s reload 2>&1 && echo "nginx reloaded"`).toString().trim());
    results.push(
      execSync(
        `certbot --nginx -d seo.nuswalab.com --non-interactive --agree-tos -m admin@nuswalab.com --redirect 2>&1`,
        { timeout: 60000 }
      ).toString().trim()
    );

    return NextResponse.json({ ok: true, results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, results }, { status: 500 });
  }
}
