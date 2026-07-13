"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Utama",
    items: [
      { href: "/admin", label: "Ringkasan", icon: "🏠" },
      { href: "/admin/notifications", label: "Notifikasi", icon: "🔔" },
      { href: "/admin/analytics/heatmap", label: "Heatmap", icon: "📈" },
    ],
  },
  {
    title: "Moderasi",
    items: [
      { href: "/admin/sellers", label: "Seller", icon: "🏪" },
      { href: "/admin/reports", label: "Laporan Produk", icon: "🚩" },
      { href: "/admin/disputes", label: "Sengketa", icon: "⚖️" },
    ],
  },
  {
    title: "Keuangan",
    items: [
      { href: "/admin/transactions", label: "Transaksi", icon: "💳" },
      { href: "/admin/withdrawals", label: "Penarikan Dana", icon: "💰" },
      { href: "/admin/affiliates", label: "Afiliasi", icon: "🤝" },
    ],
  },
  {
    title: "Konten",
    items: [
      { href: "/admin/categories", label: "Kategori", icon: "🏷️" },
      { href: "/admin/vouchers", label: "Voucher Platform", icon: "🎟️" },
      { href: "/admin/announcements", label: "Pengumuman", icon: "📢" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/audit", label: "Log Aktivitas", icon: "📜" },
      { href: "/admin/errors", label: "Log Error", icon: "🐞" },
      { href: "/admin/settings", label: "Pengaturan", icon: "⚙️" },
    ],
  },
];

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebarNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();
  const allHrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = allHrefs.filter((href) => matches(pathname, href)).sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="space-y-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 px-3 mb-1">{group.title}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-xl transition ${
                    active ? "bg-slate-700 text-white font-semibold shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.href === "/admin/notifications" && unreadCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        active ? "bg-white/25 text-white" : "bg-red-500 text-white"
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
