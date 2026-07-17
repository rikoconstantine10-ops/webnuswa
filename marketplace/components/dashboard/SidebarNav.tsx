"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string; children?: NavItem[] };
type NavGroup = { title: string; accent: string; items: NavItem[]; alwaysOpen?: boolean };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Toko",
    accent: "teal",
    alwaysOpen: true,
    items: [
      { href: "/dashboard", label: "Ringkasan", icon: "🏠" },
      { href: "/dashboard/notifications", label: "Notifikasi", icon: "🔔" },
    ],
  },
  {
    title: "Jualan",
    accent: "sky",
    items: [
      {
        href: "/dashboard/products",
        label: "Produk",
        icon: "📦",
        children: [
          { href: "/dashboard/ai-studio", label: "AI Studio", icon: "✨" },
          { href: "/dashboard/ai-credits", label: "Kredit AI", icon: "💎" },
        ],
      },
      { href: "/dashboard/orders", label: "Pesanan", icon: "🧾" },
      { href: "/dashboard/reviews", label: "Ulasan", icon: "⭐" },
      { href: "/dashboard/questions", label: "Tanya Jawab", icon: "❓" },
      { href: "/dashboard/vouchers", label: "Voucher", icon: "🎟️" },
    ],
  },
  {
    title: "Chatbot WA",
    accent: "amber",
    items: [
      { href: "/dashboard/inbox", label: "Inbox", icon: "📥" },
      { href: "/dashboard/knowledge", label: "Basis Pengetahuan", icon: "📚" },
      { href: "/dashboard/whatsapp", label: "Pengaturan Bot", icon: "💬" },
    ],
  },
  {
    title: "Pertumbuhan",
    accent: "violet",
    items: [
      { href: "/dashboard/analytics", label: "Analitik", icon: "📊" },
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
  amber: "bg-amber-600 text-white shadow-sm shadow-amber-200",
  violet: "bg-violet-600 text-white shadow-sm shadow-violet-200",
  emerald: "bg-emerald-600 text-white shadow-sm shadow-emerald-200",
  slate: "bg-slate-700 text-white shadow-sm",
};

const ACCENT_TITLE: Record<string, string> = {
  teal: "text-teal-500",
  sky: "text-sky-500",
  amber: "text-amber-600",
  violet: "text-violet-600",
  emerald: "text-emerald-600",
  slate: "text-slate-400",
};

const STORAGE_KEY = "dashboard-nav-collapsed-groups";

// Beberapa href saling bertumpuk (mis. /dashboard/store adalah prefix dari
// /dashboard/store/builder). Supaya cuma satu item yang aktif, pilih href
// yang paling spesifik (terpanjang) di antara yang cocok dengan pathname.
function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function flattenHrefs(items: NavItem[]): string[] {
  return items.flatMap((i) => [i.href, ...(i.children ? flattenHrefs(i.children) : [])]);
}

function groupContainsHref(group: NavGroup, href: string) {
  return flattenHrefs(group.items).includes(href);
}

function NavLink({
  item,
  active,
  accent,
  collapsed,
  hasOpenChildren,
  onToggleChildren,
  onNavigate,
  nested,
  unreadCount,
}: {
  item: NavItem;
  active: boolean;
  accent: string;
  collapsed: boolean;
  hasOpenChildren?: boolean;
  onToggleChildren?: () => void;
  onNavigate?: () => void;
  nested?: boolean;
  unreadCount: number;
}) {
  return (
    <div className={`flex items-center gap-1 ${nested && !collapsed ? "pl-3" : ""}`}>
      <Link
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={`flex-1 flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-xl transition min-w-0 ${
          collapsed ? "justify-center" : "justify-between"
        } ${active ? ACCENT_ACTIVE[accent] : "text-slate-600 hover:bg-slate-100"}`}
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
      {!collapsed && item.children && item.children.length > 0 && (
        <button
          type="button"
          onClick={onToggleChildren}
          aria-label={hasOpenChildren ? "Sembunyikan submenu" : "Tampilkan submenu"}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
        >
          <span className={`inline-block transition-transform text-xs ${hasOpenChildren ? "rotate-90" : ""}`}>▶</span>
        </button>
      )}
    </div>
  );
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
  const allHrefs = NAV_GROUPS.flatMap((g) => flattenHrefs(g.items));
  const activeHref = allHrefs
    .filter((href) => matches(pathname ?? "", href))
    .sort((a, b) => b.length - a.length)[0];

  const activeGroupTitle = NAV_GROUPS.find((g) => activeHref && groupContainsHref(g, activeHref))?.title;
  const activeParentHref = NAV_GROUPS.flatMap((g) => g.items).find(
    (i) => i.children && activeHref && flattenHrefs(i.children).includes(activeHref)
  )?.href;

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(NAV_GROUPS.map((g) => g.title)));
  const [openParents, setOpenParents] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  // Muat preferensi tersimpan sekali saat mount, lalu paksa buka grup/parent yang berisi
  // halaman aktif saat ini (supaya link yang baru diklik tidak "hilang" tertutup).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const collapsedTitles: string[] = raw ? JSON.parse(raw) : [];
      const next = new Set(NAV_GROUPS.map((g) => g.title).filter((t) => !collapsedTitles.includes(t)));
      if (activeGroupTitle) next.add(activeGroupTitle);
      setOpenGroups(next);
    } catch {
      // localStorage tak tersedia — pakai default semua terbuka.
    }
    if (activeParentHref) setOpenParents((prev) => new Set(prev).add(activeParentHref));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const collapsedTitles = NAV_GROUPS.map((g) => g.title).filter((t) => !openGroups.has(t));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedTitles));
    } catch {
      // abaikan — bukan fitur kritikal
    }
  }, [openGroups, hydrated]);

  function toggleGroup(title: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function toggleParent(href: string) {
    setOpenParents((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  return (
    <nav className="space-y-4">
      {NAV_GROUPS.map((group) => {
        const isOpen = collapsed || group.alwaysOpen || openGroups.has(group.title);
        return (
          <div key={group.title}>
            {!collapsed && (
              <button
                type="button"
                onClick={() => !group.alwaysOpen && toggleGroup(group.title)}
                className={`w-full flex items-center justify-between px-3 mb-1.5 ${
                  group.alwaysOpen ? "cursor-default" : ""
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wide ${ACCENT_TITLE[group.accent]}`}>
                  {group.title}
                </span>
                {!group.alwaysOpen && (
                  <span className={`text-[10px] text-slate-300 transition-transform ${isOpen ? "rotate-90" : ""}`}>
                    ▶
                  </span>
                )}
              </button>
            )}
            {isOpen && (
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = item.href === activeHref;
                  const childOpen = collapsed || openParents.has(item.href);
                  return (
                    <div key={item.href}>
                      <NavLink
                        item={item}
                        active={active}
                        accent={group.accent}
                        collapsed={collapsed}
                        hasOpenChildren={childOpen}
                        onToggleChildren={() => toggleParent(item.href)}
                        onNavigate={onNavigate}
                        unreadCount={unreadCount}
                      />
                      {item.children && childOpen && (
                        <div className="space-y-1 mt-1">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.href}
                              item={child}
                              active={child.href === activeHref}
                              accent={group.accent}
                              collapsed={collapsed}
                              onNavigate={onNavigate}
                              nested
                              unreadCount={unreadCount}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
