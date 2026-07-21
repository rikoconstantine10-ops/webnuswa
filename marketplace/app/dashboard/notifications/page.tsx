import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/actions/notifications";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const TYPE_ICON: Record<string, string> = {
  ORDER_PAID: "💰",
  ORDER_COD_NEW: "📦",
  REVIEW_NEW: "⭐",
  QUESTION_NEW: "❓",
  DISPUTE_OPENED: "⚠️",
  WITHDRAWAL_PAID: "💸",
  LOW_STOCK: "📉",
};

export default async function NotificationsPage() {
  const { store } = await requireSeller();
  const notifications = await db.notification.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div>
      <PageHeader
        title="Notifikasi"
        action={
          unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button className="text-teal-600 text-sm font-bold hover:underline cursor-pointer">
                Tandai semua dibaca
              </button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="Belum ada notifikasi" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-2xl p-4 shadow-sm ring-1 ${
                n.readAt ? "bg-white ring-slate-900/5" : "bg-teal-50/50 ring-teal-200"
              }`}
            >
              <span className="text-xl shrink-0">{TYPE_ICON[n.type] ?? "🔔"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-sm text-slate-600">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString("id-ID")}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {n.link && (
                  <Link href={n.link} className="text-xs text-teal-600 font-semibold hover:underline">
                    Lihat →
                  </Link>
                )}
                {!n.readAt && (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className="text-xs text-slate-400 hover:underline cursor-pointer">Tandai dibaca</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
