"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AiFeature = "image" | "video" | "caption" | "chat";
type NavItem = { href: string; label: string; icon: string; feature?: AiFeature };
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
      { href: "/dashboard/products", label: "Produk", icon: "📦" },
      { href: "/dashboard/orders", label: "Pesanan", icon: "🧾" },
      { href: "/dashboard/reviews", label: "Ulasan", icon: "⭐" },
      { href: "/dashboard/questions", label: "Tanya Jawab", icon: "❓" },
      { href: "/dashboard/vouchers", label: "Voucher", icon: "🎟️" },
    ],
  },
  {
    title: "AI Studio",
    accent: "amber",
    items: [
      { href: "/dashboard/ai-studio", label: "Generate Foto", icon: "✨", feature: "image" },
      { href: "/dashboard/ai-studio/video", label: "Generate Video", icon: "🎬", feature: "video" },
      { href: "/dashboard/ai-studio/caption", label: "Generate Caption", icon: "📝", feature: "caption" },
      { href: "/dashboard/ai-credits", label: "Kredit AI", icon: "💎" },
      { href: "/dashboard/inbox", label: "Chatbot WA", icon: "🤖", feature: "chat" },
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

export default function SidebarNav({
  unreadCount,
  collapsed = false,
  onNavigate,
  aiImageEnabled = true,
  aiVideoEnabled = true,
  aiCaptionEnabled = true,
  aiChatEnabled = true,
}: {
  unreadCount: number;
  collapsed?: boolean;
  onNavigate?: () => void;
  aiImageEnabled?: boolean;
  aiVideoEnabled?: boolean;
  aiCaptionEnabled?: boolean;
  aiChatEnabled?: boolean;
}) {
  const pathname = usePathname();
  const featureOn: Record<AiFeature, boolean> = {
    image: aiImageEnabled,
    video: aiVideoEnabled,
    caption: aiCaptionEnabled,
    chat: aiChatEnabled,
  };
  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.feature || featureOn[i.feature]),
  })).filter((g) => g.items.length > 0);

  const allHrefs = visibleGroups.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = allHrefs
    .filter((href) => matches(pathname ?? "", href))
    .sort((a, b) => b.length - a.length)[0];
  const activeGroupTitle = visibleGroups.find((g) => g.items.some((i) => i.href === activeHref))?.title;

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(NAV_GROUPS.map((g) => g.title)));
  const [hydrated, setHydrated] = useState(false);

  // Muat preferensi tersimpan sekali saat mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const collapsedTitles: string[] = raw ? JSON.parse(raw) : [];
      setOpenGroups(new Set(NAV_GROUPS.map((g) => g.title).filter((t) => !collapsedTitles.includes(t))));
    } catch {
      // localStorage tak tersedia — pakai default semua terbuka.
    }
    setHydrated(true);
  }, []);

  // Paksa buka grup yang berisi halaman aktif setiap kali pathname berubah — bukan cuma
  // saat mount — supaya navigasi client-side (Link, tanpa reload) tetap membuka kategori
  // yang relevan alih-alih meninggalkannya tertutup dari state sebelumnya.
  useEffect(() => {
    if (activeGroupTitle) setOpenGroups((prev) => new Set(prev).add(activeGroupTitle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

  return (
    <nav className="space-y-4">
      {visibleGroups.map((group) => {
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
            )}
          </div>
        );
      })}
    </nav>
  );
}
