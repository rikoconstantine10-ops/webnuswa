import { db } from "./db";

export async function audit(actor: string, action: string, detail?: string) {
  try {
    await db.auditLog.create({ data: { actor, action, detail } });
  } catch (e) {
    console.error("[AUDIT] gagal mencatat:", e);
  }
}
