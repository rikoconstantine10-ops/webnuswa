import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireAdmin();
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-2">Log Aktivitas</h1>
      <p className="text-sm text-slate-500 mb-6">
        Jejak semua aksi penting: persetujuan toko, penarikan dana, perubahan pengaturan.
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 font-mono">
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{l.detail}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-10">Belum ada aktivitas tercatat.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
