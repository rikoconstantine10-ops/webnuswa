import { redirect } from "next/navigation";
import { currentUser, logout } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardShell from "@/components/dashboard/DashboardShell";

async function logoutAction() {
  "use server";
  await logout();
  redirect("/");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.store) redirect("/register-seller");

  const store = user.store;
  const [unreadCount, recent] = await Promise.all([
    db.notification.count({ where: { storeId: store.id, readAt: null } }),
    db.notification.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  return (
    <DashboardShell
      storeName={store.name}
      storeSlug={store.slug}
      storeStatus={store.status}
      storePaused={store.paused}
      aiImageEnabled={store.aiImageEnabled}
      aiVideoEnabled={store.aiVideoEnabled}
      aiCaptionEnabled={store.aiCaptionEnabled}
      aiChatEnabled={store.aiChatEnabled}
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
    </DashboardShell>
  );
}
