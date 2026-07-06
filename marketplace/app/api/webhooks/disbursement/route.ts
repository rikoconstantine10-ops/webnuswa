import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settleDisbursement } from "@/lib/payout";

// Webhook status pencairan dana dari provider disbursement (mis. Flip).
// Flip mengirim field `data` (JSON string) berisi {id, status}. Lindungi dengan
// FLIP_VALIDATION_TOKEN (Flip mengirim `token`), atau DISBURSEMENT_WEBHOOK_TOKEN via query.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  let payload: Record<string, unknown> = {};
  // Flip mengirim application/x-www-form-urlencoded dengan `data` = JSON string + `token`.
  try {
    const params = new URLSearchParams(raw);
    if (params.has("data")) {
      payload = { ...Object.fromEntries(params), ...(JSON.parse(params.get("data") || "{}")) };
    } else {
      payload = JSON.parse(raw || "{}");
    }
  } catch {
    payload = {};
  }

  const expected = process.env.FLIP_VALIDATION_TOKEN || process.env.DISBURSEMENT_WEBHOOK_TOKEN;
  if (expected) {
    const got = String(payload.token ?? req.nextUrl.searchParams.get("token") ?? "");
    if (got !== expected) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await db.webhookLog.create({
    data: { source: "disbursement", payload: raw.slice(0, 4000) },
  }).catch(() => {});

  const providerRef = String(payload.id ?? payload.disbursement_id ?? "");
  const status = String(payload.status ?? "");
  if (!providerRef || !status) return NextResponse.json({ ok: true, note: "no id/status" });

  const result = await settleDisbursement(providerRef, status);
  return NextResponse.json({ ok: result.ok, note: result.note });
}
