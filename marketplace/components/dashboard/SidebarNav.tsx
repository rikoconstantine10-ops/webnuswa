"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Toko",
    items: [
      { href: "/dashboard", label: "Ringkasan", icon: "🏠" },
      { href: "/dashboard/notifications", label: "Notifikasi", icon: "🔔" },
    ],
  },
  {
    title: "Jualan",
    items: [
      { href: "/dashboard/products", label: "Produk", icon: "📦" },
      { href: "/dashboard/orders", label: "Pesanan", icon: "🧾" },
      { href: "/dashboard/reviews", label: "Ulasan", icon: "⭐" },
      { href: "/dashboard/questions", label: "Tanya Jawab", icon: "❓" },
      { href: "/dashboard/vouchers", label: "Voucher", icon: "🎟️" },
    ],
  },
  {
    title: "Pertumbuhan",
    items: [
      { href: "/dashboard/analytics", label: "Analitik", icon: "📊" },
      { href: "/dashboard/whatsapp", label: "WhatsApp", icon: "💬" },
      { href: "/dashboard/subscription", label: "Langganan Pro", icon: "👑" },
    ],
  },
  {
    title: "Keuangan",
    items: [{ href: "/dashboard/withdrawals", label: "Saldo & Penarikan", icon: "💰" }],
  },
  {
    title: "Pengaturan",
    items: [
      { href: "/dashboard/store", label: "Pengaturan Toko", icon: "⚙️" },
      { href: "/dashboard/store/builder", label: "Desain Toko", icon: "🎨" },
    ],
  },
];

// Beberapa href saling bertumpuk (mis. /dashboard/store adalah prefix dari
// /dashboard/store/builder). Supaya cuma satu item yang aktif, pilih href
// yang paling spesifik (terpanjang) di antara yang cocok dengan pathname.
function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SidebarNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();
  const allHrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = allHrefs
    .filter((href) => matches(pathname, href))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="space-y-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 px-3 mb-1">{group.title}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-xl transition ${
                    active ? "bg-teal-600 text-white font-semibold shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.href === "/dashboard/notifications" && unreadCount > 0 && (
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
