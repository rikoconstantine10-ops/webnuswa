import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader, Badge, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const LEVELS = ["error", "warn"];

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string }>;
}) {
  await requireAdmin();
  const { q, level } = await searchParams;

  const [logs, count24h] = await Promise.all([
    db.errorLog.findMany({
      where: {
        ...(level && LEVELS.includes(level) ? { level } : {}),
        ...(q ? { message: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.errorLog.count({ where: { createdAt: { gt: new Date(Date.now() - 86400000) } } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Log Error"
        description={
          count24h > 0
            ? `${count24h} error dalam 24 jam terakhir.`
            : "Tidak ada error dalam 24 jam terakhir. 🎉"
        }
      />

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cari pesan error..."
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
          />
          <select name="level" defaultValue={level ?? ""} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Semua level</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <button className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700">
            Cari
          </button>
          {(q || level) && (
            <Link href="/admin/errors" className="text-sm text-slate-500 hover:underline">Reset</Link>
          )}
        </form>
      </Card>

      {logs.length === 0 ? (
        <EmptyState icon="🐞" title={q || level ? "Tidak ada error yang cocok" : "Belum ada log error"} />
      ) : (
        <Card className="!p-0 divide-y divide-slate-100">
          {logs.map((l) => (
            <details key={l.id} className="px-4 py-3">
              <summary className="cursor-pointer text-sm flex items-start gap-2">
                <Badge tone={l.level === "warn" ? "amber" : "red"}>{l.level}</Badge>
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
        </Card>
      )}
    </div>
  );
}
