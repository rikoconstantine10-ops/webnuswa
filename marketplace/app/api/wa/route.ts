import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { waStatus, waStart, waLogout } from "@/lib/wa";

// Proxy status/koneksi WA untuk seller yang sedang login (storeId dari sesi,
// tidak pernah dari input client — seller hanya bisa mengelola WA tokonya sendiri).
export async function GET() {
  const user = await currentUser();
  if (!user?.store) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await waStatus(user.store.id));
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user?.store) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { action } = (await req.json().catch(() => ({}))) as { action?: string };
  if (action === "start") {
    const ok = await waStart(user.store.id);
    return NextResponse.json({ ok });
  }
  if (action === "logout") {
    const ok = await waLogout(user.store.id);
    return NextResponse.json({ ok });
  }
  return NextResponse.json({ error: "action tidak dikenal" }, { status: 400 });
}
