import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminErrorsPage() {
  await requireAdmin();
  const [logs, count24h] = await Promise.all([
    db.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    db.errorLog.count({ where: { createdAt: { gt: new Date(Date.now() - 86400000) } } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Log Error</h1>
      <p className="text-slate-500 text-sm mb-6">
        {count24h > 0 ? (
          <span className="text-red-600 font-semibold">{count24h} error dalam 24 jam terakhir.</span>
        ) : (
          <span className="text-emerald-600 font-semibold">Tidak ada error dalam 24 jam terakhir. 🎉</span>
        )}
      </p>

      {logs.length === 0 ? (
        <p className="text-slate-500 text-center py-16 bg-white rounded-2xl border border-slate-200">
          Belum ada log error.
        </p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {logs.map((l) => (
            <details key={l.id} className="px-4 py-3">
              <summary className="cursor-pointer text-sm flex items-start gap-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${l.level === "warn" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {l.level}
                </span>
                <span className="font-medium break-all">{l.message}</span>
                <span className="text-xs text-slate-400 ml-auto shrink-0">
                  {l.createdAt.toLocaleString("id-ID")}
                </span>
              </summary>
              {l.context && (
                <pre className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all">
                  {l.context}
                </pre>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
