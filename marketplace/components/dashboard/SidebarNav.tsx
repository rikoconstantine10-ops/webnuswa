"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };
type NavGroup = { title: string; accent: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Toko",
    accent: "teal",
    items: [
      { href: "/dashboard", label: "Ringkasan", icon: "🏠" },
      { href: "/dashboard/notifications", label: "Notifikasi", icon: "🔔" },
    ],
  },
  {
    title: "Jualan",
    accent: "sky",
    items: [
      { href: "/dashboard/products", label: "Produk", icon: "📦" },
      { href: "/dashboard/ai-studio", label: "AI Studio", icon: "✨" },
      { href: "/dashboard/orders", label: "Pesanan", icon: "🧾" },
      { href: "/dashboard/reviews", label: "Ulasan", icon: "⭐" },
      { href: "/dashboard/questions", label: "Tanya Jawab", icon: "❓" },
      { href: "/dashboard/vouchers", label: "Voucher", icon: "🎟️" },
    ],
  },
  {
    title: "Pertumbuhan",
    accent: "violet",
    items: [
      { href: "/dashboard/analytics", label: "Analitik", icon: "📊" },
      { href: "/dashboard/whatsapp", label: "WhatsApp", icon: "💬" },
      { href: "/dashboard/subscription", label: "Langganan Pro", icon: "👑" },
    ],
  },
  {
    title: "Keuangan",
    accent: "emerald",
    items: [{ href: "/dashboard/withdrawals", label: "Saldo & Penarikan", icon: "💰" }],
  },
  {
    title: "Pengaturan",
    accent: "slate",
    items: [
      { href: "/dashboard/store", label: "Pengaturan Toko", icon: "⚙️" },
      { href: "/dashboard/store/builder", label: "Desain Toko", icon: "🎨" },
    ],
  },
];

const ACCENT_ACTIVE: Record<string, string> = {
  teal: "bg-teal-600 text-white shadow-sm shadow-teal-200",
  sky: "bg-sky-600 text-white shadow-sm shadow-sky-200",
  violet: "bg-violet-600 text-white shadow-sm shadow-violet-200",
  emerald: "bg-emerald-600 text-white shadow-sm shadow-emerald-200",
  slate: "bg-slate-700 text-white shadow-sm",
};

const ACCENT_TITLE: Record<string, string> = {
  teal: "text-teal-500",
  sky: "text-sky-500",
  violet: "text-violet-600",
  emerald: "text-emerald-600",
  slate: "text-slate-400",
};

// Beberapa href saling bertumpuk (mis. /dashboard/store adalah prefix dari
// /dashboard/store/builder). Supaya cuma satu item yang aktif, pilih href
// yang paling spesifik (terpanjang) di antara yang cocok dengan pathname.
function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SidebarNav({
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
  const activeHref = allHrefs
    .filter((href) => matches(pathname ?? "", href))
    .sort((a, b) => b.length - a.length)[0];

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
                  } ${active ? ACCENT_ACTIVE[group.accent] : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                  </span>
                  {!collapsed && item.href === "/dashboard/notifications" && unreadCount > 0 && (
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
