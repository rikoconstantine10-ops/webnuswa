import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader, Badge, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminErrorsPage() {
  await requireAdmin();
  const [logs, count24h] = await Promise.all([
    db.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
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

      {logs.length === 0 ? (
        <EmptyState icon="🐞" title="Belum ada log error" />
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
