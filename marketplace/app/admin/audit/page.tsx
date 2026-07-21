import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader, Badge } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;

  const logs = await db.auditLog.findMany({
    where: q
      ? {
          OR: [
            { actor: { contains: q, mode: "insensitive" } },
            { action: { contains: q, mode: "insensitive" } },
            { detail: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Log Aktivitas"
        description="Jejak semua aksi penting: persetujuan toko, penarikan dana, perubahan pengaturan."
      />

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cari pelaku, aksi, atau detail..."
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
          />
          <button className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700">
            Cari
          </button>
          {q && (
            <Link href="/admin/audit" className="text-sm text-slate-500 hover:underline">Reset</Link>
          )}
        </form>
      </Card>

      <Card className="!p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Pelaku</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-slate-50">
                <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{l.actor}</td>
                <td className="px-4 py-2.5">
                  <Badge tone="indigo">{l.action}</Badge>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{l.detail}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-10">
                  {q ? "Tidak ada aktivitas yang cocok." : "Belum ada aktivitas tercatat."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
