import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const unreadCount = await db.adminNotification.count({ where: { readAt: null } });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <aside className="md:w-64 shrink-0">
        <div className="bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden sticky top-20">
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 px-4 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
                ⚡
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">Admin Panel</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <AdminSidebarNav unreadCount={unreadCount} />
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
