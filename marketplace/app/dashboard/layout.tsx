import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SidebarNav from "@/components/dashboard/SidebarNav";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  PENDING: "Menunggu Persetujuan",
  SUSPENDED: "Ditangguhkan",
};

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-emerald-400/20 text-emerald-50",
  PENDING: "bg-amber-400/20 text-amber-50",
  SUSPENDED: "bg-red-400/20 text-red-50",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.store) redirect("/register-seller");

  const store = user.store;
  const unreadCount = await db.notification.count({ where: { storeId: store.id, readAt: null } });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <aside className="md:w-64 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden sticky top-20">
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 px-4 py-5 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-lg font-extrabold shrink-0">
                {store.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{store.name}</p>
                <a
                  href={`/s/${store.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-teal-100 hover:text-white hover:underline"
                >
                  🔗 Lihat Toko
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_TONE[store.status]}`}>
                {STATUS_LABEL[store.status] ?? store.status}
              </span>
              {store.paused && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/15 text-white">
                  ⏸ Tutup Sementara
                </span>
              )}
            </div>
          </div>
          <div className="p-3">
            <SidebarNav unreadCount={unreadCount} />
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
