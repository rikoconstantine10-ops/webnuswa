import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Health check ringan untuk monitoring uptime.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
