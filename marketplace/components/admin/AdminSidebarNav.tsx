"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };
type NavGroup = { title: string; accent: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Utama",
    accent: "indigo",
    items: [
      { href: "/admin", label: "Ringkasan", icon: "🏠" },
      { href: "/admin/notifications", label: "Notifikasi", icon: "🔔" },
      { href: "/admin/analytics/heatmap", label: "Heatmap", icon: "📈" },
    ],
  },
  {
    title: "Moderasi",
    accent: "amber",
    items: [
      { href: "/admin/sellers", label: "Seller", icon: "🏪" },
      { href: "/admin/moderation", label: "Moderasi Produk", icon: "🔍" },
      { href: "/admin/reports", label: "Laporan Produk", icon: "🚩" },
      { href: "/admin/disputes", label: "Sengketa", icon: "⚖️" },
    ],
  },
  {
    title: "Keuangan",
    accent: "emerald",
    items: [
      { href: "/admin/transactions", label: "Transaksi", icon: "💳" },
      { href: "/admin/withdrawals", label: "Penarikan Dana", icon: "💰" },
      { href: "/admin/affiliates", label: "Afiliasi", icon: "🤝" },
    ],
  },
  {
    title: "Konten",
    accent: "fuchsia",
    items: [
      { href: "/admin/categories", label: "Kategori", icon: "🏷️" },
      { href: "/admin/vouchers", label: "Voucher Platform", icon: "🎟️" },
      { href: "/admin/announcements", label: "Pengumuman", icon: "📢" },
    ],
  },
  {
    title: "Fitur AI",
    accent: "violet",
    items: [
      { href: "/admin/ai-usage", label: "AI Studio", icon: "✨" },
      { href: "/admin/inbox", label: "Inbox Chatbot", icon: "📥" },
    ],
  },
  {
    title: "Sistem",
    accent: "slate",
    items: [
      { href: "/admin/audit", label: "Log Aktivitas", icon: "📜" },
      { href: "/admin/errors", label: "Log Error", icon: "🐞" },
      { href: "/admin/settings", label: "Pengaturan", icon: "⚙️" },
    ],
  },
];

const ACCENT_ACTIVE: Record<string, string> = {
  indigo: "bg-indigo-600 text-white shadow-sm shadow-indigo-200",
  amber: "bg-amber-500 text-white shadow-sm shadow-amber-200",
  emerald: "bg-emerald-600 text-white shadow-sm shadow-emerald-200",
  fuchsia: "bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-200",
  violet: "bg-violet-600 text-white shadow-sm shadow-violet-200",
  slate: "bg-slate-700 text-white shadow-sm",
};

const ACCENT_TITLE: Record<string, string> = {
  indigo: "text-indigo-500",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
  fuchsia: "text-fuchsia-600",
  violet: "text-violet-600",
  slate: "text-slate-400",
};

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebarNav({
  unreadCount,
  collapsed = false,
  onNavigate,
}: {
  unreadCount: number;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const allHrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = allHrefs.filter((href) => matches(pathname ?? "", href)).sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          {!collapsed && (
            <p className={`text-[10px] font-bold uppercase tracking-wide px-3 mb-1.5 ${ACCENT_TITLE[group.accent]}`}>
              {group.title}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-xl transition ${
                    collapsed ? "justify-center" : "justify-between"
                  } ${
                    active ? ACCENT_ACTIVE[group.accent] : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className={`flex items-center gap-2.5 min-w-0 ${collapsed ? "" : ""}`}>
                    <span className="text-base shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                  </span>
                  {!collapsed && item.href === "/admin/notifications" && unreadCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        active ? "bg-white/25 text-white" : "bg-rose-500 text-white"
                      }`}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
