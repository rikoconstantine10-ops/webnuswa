import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isTrackedPath } from "@/lib/heatmap";
import { logError } from "@/lib/errors";

const MAX_CLICKS = 200;

function clampPct(n: unknown): number | null {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return null;
  return Math.min(100, Math.max(0, v));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ ok: false }, { status: 400 });

    const path = String((body as Record<string, unknown>).path ?? "").slice(0, 200);
    if (!path.startsWith("/") || !isTrackedPath(path)) return NextResponse.json({ ok: false }, { status: 400 });

    const device = (body as Record<string, unknown>).device === "mobile" ? "mobile" : "desktop";
    const rawClicks = (body as Record<string, unknown>).clicks;
    const clicks = Array.isArray(rawClicks) ? rawClicks.slice(0, MAX_CLICKS) : [];
    const scrollDepthRaw = (body as Record<string, unknown>).scrollDepthPct;

    const clickRows = clicks
      .map((c) => {
        if (!c || typeof c !== "object") return null;
        const xPct = clampPct((c as Record<string, unknown>).xPct);
        const yPct = clampPct((c as Record<string, unknown>).yPct);
        if (xPct === null || yPct === null) return null;
        return { path, device, xPct, yPct };
      })
      .filter((r): r is { path: string; device: string; xPct: number; yPct: number } => r !== null);

    if (clickRows.length > 0) {
      await db.heatmapClick.createMany({ data: clickRows });
    }

    if (scrollDepthRaw !== undefined) {
      const depthPct = clampPct(scrollDepthRaw);
      if (depthPct !== null) {
        await db.heatmapScroll.create({ data: { path, device, depthPct: Math.round(depthPct) } });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logError("heatmap.ingest", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
