import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";

// Daftar percakapan WA toko yang sedang login, untuk Inbox (style messenger).
export async function GET(req: NextRequest) {
  let storeId: string;
  try {
    ({ store: { id: storeId } } = await requireSeller());
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const filter = req.nextUrl.searchParams.get("filter") || "all"; // all | unread | human

  const where: Record<string, unknown> = { storeId };
  if (filter === "unread") where.unreadCount = { gt: 0 };
  if (filter === "human") where.mode = "HUMAN";

  const conversations = await db.waConversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    select: {
      id: true, buyerPhone: true, buyerName: true, mode: true, blocked: true, tags: true,
      unreadCount: true, needsHumanSince: true, lastMessageAt: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, author: true, mediaType: true } },
    },
  });

  return NextResponse.json({ conversations });
}
