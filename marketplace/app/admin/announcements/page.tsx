import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createAnnouncementAction,
  toggleAnnouncementAction,
  deleteAnnouncementAction,
} from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const announcements = await db.announcement.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-2">Pengumuman ke Seller</h1>
      <p className="text-sm text-slate-500 mb-6">
        Pengumuman aktif tampil sebagai banner di dashboard semua seller.
      </p>

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

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3">
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
                <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600">
                  Hapus
                </button>
              </form>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8 bg-white rounded-2xl border border-slate-200">
            Belum ada pengumuman.
          </p>
        )}
      </div>
    </div>
  );
}
