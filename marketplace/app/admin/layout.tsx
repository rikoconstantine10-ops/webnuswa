import { redirect } from "next/navigation";
import { currentUser, logout } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminShell from "@/components/admin/AdminShell";

async function logoutAction() {
  "use server";
  await logout();
  redirect("/admin-login");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const [unreadCount, recent] = await Promise.all([
    db.adminNotification.count({ where: { readAt: null } }),
    db.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  return (
    <AdminShell
      email={user.email}
      unreadCount={unreadCount}
      recentNotifications={recent.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      }))}
      logoutAction={logoutAction}
    >
      {children}
    </AdminShell>
  );
}
