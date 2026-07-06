import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendMail, MAILBOX } from "@/lib/mailer";
import { formatRupiah } from "@/lib/money";
import { cartRecoveryEmail } from "@/lib/emailTemplates";

// Recovery keranjang terbengkalai: kirim email sekali ke pembeli yang menaruh
// produk di keranjang > 6 jam tapi < 3 hari dan belum di-remind.
// Panggil: GET /api/cron/cart-recovery?key={CRON_SECRET}
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.nextUrl.searchParams.get("key") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const appUrl = process.env.APP_URL || "https://nuswamart.com";

  const items = await db.cartItem.findMany({
    where: {
      remindedAt: null,
      createdAt: { lt: new Date(now - 6 * 3600 * 1000), gt: new Date(now - 3 * 86400 * 1000) },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      product: { select: { name: true, price: true, salePrice: true, active: true } },
    },
    take: 300,
  });

  // Kelompokkan per pembeli.
  const byUser = new Map<string, { email: string; name: string | null; items: typeof items }>();
  for (const it of items) {
    if (!it.product.active) continue;
    const g = byUser.get(it.userId) ?? { email: it.user.email, name: it.user.name, items: [] as typeof items };
    g.items.push(it);
    byUser.set(it.userId, g);
  }

  let emailed = 0;
  for (const [, g] of byUser) {
    if (g.items.length === 0) continue;
    const lines = g.items.map(
      (it) => `${it.product.name} — ${formatRupiah(it.product.salePrice ?? it.product.price)}${it.qty > 1 ? ` ×${it.qty}` : ""}`
    );
    const mail = cartRecoveryEmail({ name: g.name || "Sobat NuswaMart", lines, appUrl });
    const ok = await sendMail(g.email, mail.subject, mail.text, { html: mail.html, replyTo: MAILBOX.hello })
      .then(() => true)
      .catch(() => false);
    if (ok) {
      await db.cartItem.updateMany({
        where: { id: { in: g.items.map((i) => i.id) } },
        data: { remindedAt: new Date() },
      });
      emailed++;
    }
  }

  return NextResponse.json({ checkedItems: items.length, buyersEmailed: emailed });
}
