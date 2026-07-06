import { db } from "./db";

// Logger error terpusat: catat ke konsol + tabel ErrorLog (best-effort, tak pernah melempar).
export async function logError(scope: string, err: unknown, context?: Record<string, unknown>): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  // eslint-disable-next-line no-console
  console.error(`[${scope}]`, message, context ?? "");
  try {
    await db.errorLog.create({
      data: {
        level: "error",
        message: `${scope}: ${message}`.slice(0, 500),
        context: JSON.stringify({ ...context, stack: stack?.slice(0, 1000) }).slice(0, 2000),
      },
    });
  } catch {
    // jangan sampai logging menggagalkan request
  }
}

export async function logWarn(scope: string, message: string, context?: Record<string, unknown>): Promise<void> {
  // eslint-disable-next-line no-console
  console.warn(`[${scope}]`, message, context ?? "");
  try {
    await db.errorLog.create({
      data: { level: "warn", message: `${scope}: ${message}`.slice(0, 500), context: context ? JSON.stringify(context).slice(0, 2000) : null },
    });
  } catch {
    /* noop */
  }
}
