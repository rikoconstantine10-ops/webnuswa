import { NextRequest, NextResponse } from "next/server";
import { sendMetaCAPIEvent } from "@/lib/meta-capi";

export async function POST(req: NextRequest) {
  try {
    const { event_name, event_id, email, fbp, fbc, page_url, custom_data } = await req.json();
    if (!event_name) return NextResponse.json({ error: "event_name required" }, { status: 400 });

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const ua = req.headers.get("user-agent") || undefined;

    await sendMetaCAPIEvent([
      {
        event_name,
        event_id,
        event_source_url: page_url ?? "https://nuswalab.com",
        action_source: "website",
        user_data: { em: email, client_ip_address: ip, client_user_agent: ua, fbp, fbc },
        custom_data,
      },
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
