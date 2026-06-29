import { NextRequest, NextResponse } from "next/server";
import { sendMetaCAPIEvent } from "@/lib/meta-capi";

export async function POST(req: NextRequest) {
  try {
    const { email, source, fbp, fbc, page_url } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    const res = await fetch("http://localhost:3003/api/leads/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: source || "website" }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data.error || "Gagal menyimpan" }, { status: res.status });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const ua = req.headers.get("user-agent") || undefined;

    sendMetaCAPIEvent([
      {
        event_name: "Lead",
        event_id: `newsletter_${Date.now()}`,
        event_source_url: page_url ?? "https://nuswalab.com",
        action_source: "website",
        user_data: { em: email, client_ip_address: ip, client_user_agent: ua, fbp, fbc },
        custom_data: { content_name: "Newsletter Subscribe", content_category: source || "website" },
      },
    ]).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
