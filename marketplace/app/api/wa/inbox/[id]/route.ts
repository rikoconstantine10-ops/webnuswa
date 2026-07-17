import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { waSend } from "@/lib/wa";

async function loadOwnedConversation(storeId: string, id: string) {
  return db.waConversation.findFirst({ where: { id, storeId } });
}

// Thread satu percakapan + tandai terbaca.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { store } = await requireSeller();
  const { id } = await params;
  const conversation = await loadOwnedConversation(store.id, id);
  if (!conversation) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });

  const messages = await db.waMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  if (conversation.unreadCount > 0) {
    await db.waConversation.update({ where: { id }, data: { unreadCount: 0 } });
  }

  return NextResponse.json({ conversation, messages });
}

// Seller kirim balasan manual (mode HUMAN atau selagi bot masih aktif — seller boleh
// menyela kapan saja). Kirim pesan otomatis memindahkan mode ke HUMAN supaya bot berhenti
// menimpali percakapan yang sudah ditangani manusia.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { store } = await requireSeller();
  const { id } = await params;
  const conversation = await loadOwnedConversation(store.id, id);
  if (!conversation) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });

  const { text, imageUrl } = (await req.json().catch(() => ({}))) as { text?: string; imageUrl?: string };
  if (!text && !imageUrl) return NextResponse.json({ error: "text/imageUrl wajib" }, { status: 400 });

  const sent = await waSend(store.id, conversation.buyerPhone, text || "", imageUrl);
  if (!sent) return NextResponse.json({ error: "WA toko belum terhubung" }, { status: 409 });

  await db.waMessage.create({
    data: {
      conversationId: id,
      direction: "OUT",
      author: "SELLER",
      body: text || null,
      imageUrl,
      mediaType: imageUrl ? "image" : null,
    },
  });
  await db.waConversation.update({
    where: { id },
    data: { mode: "HUMAN", lastMessageAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// Update mode (BOT/HUMAN), blokir, atau tag percakapan.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { store } = await requireSeller();
  const { id } = await params;
  const conversation = await loadOwnedConversation(store.id, id);
  if (!conversation) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { mode?: string; blocked?: boolean; tags?: string[] };
  const data: Record<string, unknown> = {};
  if (body.mode === "BOT" || body.mode === "HUMAN") {
    data.mode = body.mode;
    if (body.mode === "BOT") data.needsHumanSince = null;
  }
  if (typeof body.blocked === "boolean") data.blocked = body.blocked;
  if (Array.isArray(body.tags)) data.tags = body.tags.map(String).slice(0, 10);

  await db.waConversation.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
