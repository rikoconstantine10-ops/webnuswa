import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createAnnouncementAction,
  toggleAnnouncementAction,
  deleteAnnouncementAction,
} from "@/app/actions/admin";
import { Card, PageHeader, EmptyState } from "@/components/dashboard/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const announcements = await db.announcement.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Pengumuman ke Seller" description="Pengumuman aktif tampil sebagai banner di dashboard semua seller." />

      <form action={createAnnouncementAction} className="flex gap-2 mb-6">
        <input
          type="text"
          name="message"
          required
          minLength={5}
          placeholder="Tulis pengumuman, mis. 'Penarikan dana selama libur diproses tgl 5'"
          className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm"
        />
        <button className="bg-teal-600 text-white text-sm font-bold px-5 rounded-lg hover:bg-teal-700">
          Kirim
        </button>
      </form>

      {announcements.length === 0 ? (
        <EmptyState icon="📢" title="Belum ada pengumuman" />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-sm ${a.active ? "" : "text-slate-400 line-through"}`}>📢 {a.message}</p>
                <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString("id-ID")}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <form action={toggleAnnouncementAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className={`text-xs font-bold px-3 py-1.5 rounded-lg ${a.active ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
                    {a.active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </form>
                <form action={deleteAnnouncementAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <ConfirmButton
                    confirmMessage="Hapus pengumuman ini? Aksi ini tidak bisa dibatalkan."
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600"
                  >
                    Hapus
                  </ConfirmButton>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
