import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waSend, waSendToSelf } from "@/lib/wa";
import { transcribeVoice, storeAiFeatureEnabled } from "@/lib/kieai";
import { generateBotReply, isWithinBotSchedule, needsEscalation } from "@/lib/waChat";

// Endpoint yang dipanggil wa-service (transport Baileys) tiap ada pesan masuk dari pembeli.
// Alur: catat pesan → cek blokir/mode HUMAN/jadwal → cek kata kunci eskalasi → generate
// balasan lewat lib/waChat (grounded katalog/order/KB) → kirim balasan, atau eskalasi ke
// seller kalau bot tidak yakin.
export async function POST(req: NextRequest) {
  const key = process.env.WA_SERVICE_KEY || "";
  if (!key || req.headers.get("x-api-key") !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as {
    storeId?: string;
    from?: string;
    pushName?: string | null;
    text?: string | null;
    mediaType?: "image" | "audio" | null;
    mediaBase64?: string;
    mediaMime?: string;
  } | null;
  if (!body?.storeId || !body?.from) {
    return NextResponse.json({ error: "storeId & from wajib" }, { status: 400 });
  }

  const store = await db.store.findUnique({
    where: { id: body.storeId },
    select: {
      id: true, name: true, waPersonaPrompt: true, waAutoReplyEnabled: true,
      waActiveDays: true, waActiveHoursStart: true, waActiveHoursEnd: true,
    },
  });
  if (!store) return NextResponse.json({ error: "toko tidak ditemukan" }, { status: 404 });
  const storeId = store.id;
  const buyerPhone = body.from;
  const pushName = body.pushName || buyerPhone;

  let text = body.text?.trim() || "";
  let mediaType: string | null = body.mediaType ?? null;
  let imageDataUrl: string | undefined;

  if (body.mediaType === "image" && body.mediaBase64) {
    imageDataUrl = `data:${body.mediaMime || "image/jpeg"};base64,${body.mediaBase64}`;
  } else if (body.mediaType === "audio" && body.mediaBase64) {
    const transcript = await transcribeVoice(body.mediaBase64, body.mediaMime || "audio/ogg");
    if (transcript.ok && transcript.text) {
      text = transcript.text;
      mediaType = "audio"; // body diisi hasil transkrip, mediaType tetap menandai asal voice note
    }
  }

  const conversation = await db.waConversation.upsert({
    where: { storeId_buyerPhone: { storeId, buyerPhone } },
    create: { storeId, buyerPhone, buyerName: body.pushName || null, lastMessageAt: new Date() },
    update: { buyerName: body.pushName || undefined, lastMessageAt: new Date(), unreadCount: { increment: 1 } },
  });

  await db.waMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "IN",
      author: "BUYER",
      body: text || null,
      imageUrl: imageDataUrl,
      mediaType,
    },
  });

  if (conversation.blocked || conversation.mode === "HUMAN" || !store.waAutoReplyEnabled) {
    return NextResponse.json({ ok: true, replied: false, reason: "blocked_or_human_or_disabled" });
  }
  if (!(await storeAiFeatureEnabled(storeId, "chat"))) {
    return NextResponse.json({ ok: true, replied: false, reason: "ai_chat_not_enabled" });
  }
  if (!isWithinBotSchedule(store)) {
    return NextResponse.json({ ok: true, replied: false, reason: "outside_schedule" });
  }
  if (!text) {
    return NextResponse.json({ ok: true, replied: false, reason: "no_text_to_reply" });
  }

  async function escalate(reason: string) {
    await db.waConversation.update({
      where: { id: conversation.id },
      data: { mode: "HUMAN", needsHumanSince: new Date() },
    });
    const notice = "Terima kasih, pesanmu sudah kami catat. Penjual akan segera membalas langsung ya 🙏";
    const sent = await waSend(storeId, buyerPhone, notice);
    if (sent) {
      await db.waMessage.create({
        data: { conversationId: conversation.id, direction: "OUT", author: "BOT", body: notice },
      });
    }
    await waSendToSelf(
      storeId,
      `🔔 Percakapan WA butuh perhatianmu (${reason}).\nDari: ${pushName}\nPesan: ${text.slice(0, 200)}`
    );
  }

  if (needsEscalation(text)) {
    await escalate("kata kunci eskalasi terdeteksi");
    return NextResponse.json({ ok: true, replied: true, escalated: true });
  }

  const reply = await generateBotReply(store, buyerPhone, text);
  if (!reply.ok) {
    await escalate(reply.reason);
    return NextResponse.json({ ok: true, replied: true, escalated: true });
  }

  const sent = await waSend(storeId, buyerPhone, reply.text, reply.imageUrl);
  if (sent) {
    await db.waMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "OUT",
        author: "BOT",
        body: reply.text,
        imageUrl: reply.imageUrl,
        mediaType: reply.imageUrl ? "image" : null,
      },
    });
  }

  return NextResponse.json({ ok: true, replied: sent });
}
