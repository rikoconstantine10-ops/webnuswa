"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SearchResult = {
  stores: { id: string; name: string; slug: string; owner: { email: string } }[];
  orders: { id: string; code: string; buyerName: string; status: string; storeId: string }[];
  products: { id: string; name: string; storeId: string; slug: string }[];
};

type NotifItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  DISPUTE_OPENED: "⚠️",
  NEW_SELLER: "🏪",
  WITHDRAWAL_REQUESTED: "💸",
  REPORT_SUBMITTED: "🚩",
};

export default function AdminTopbar({
  email,
  unreadCount,
  recentNotifications,
  logoutAction,
  onToggleSidebar,
}: {
  email: string;
  unreadCount: number;
  recentNotifications: NotifItem[];
  logoutAction: () => void;
  onToggleSidebar: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((data: SearchResult) => setResults(data))
        .catch(() => setResults(null));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const hasResults = results && (results.stores.length + results.orders.length + results.products.length > 0);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="h-16 px-4 md:px-6 flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 md:hidden"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <Link href="/admin" className="shrink-0 flex items-center gap-2 mr-2">
          <span className="w-8 h-8 rounded-xl bg-white ring-1 ring-slate-900/5 flex items-center justify-center shadow-sm shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nuswamart-icon.png" alt="" className="h-5 w-auto" />
          </span>
          <span className="hidden sm:block font-extrabold text-slate-900 leading-tight">
            Nuswa<span className="text-indigo-600">Mart</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Admin</span>
          </span>
        </Link>

        <div ref={boxRef} className="relative flex-1 max-w-md">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Cari seller, order, produk..."
            className="w-full bg-slate-100 border border-transparent focus:border-indigo-300 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-sm outline-none transition"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>

          {searchOpen && query.trim().length >= 2 && (
            <div className="absolute mt-2 left-0 right-0 bg-white rounded-2xl shadow-lg ring-1 ring-slate-900/10 max-h-96 overflow-y-auto z-50">
              {!results ? (
                <p className="text-sm text-slate-400 px-4 py-4">Mencari...</p>
              ) : !hasResults ? (
                <p className="text-sm text-slate-400 px-4 py-4">Tidak ada hasil untuk &quot;{query}&quot;</p>
              ) : (
                <div className="py-2">
                  {results.stores.length > 0 && (
                    <div className="px-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">Seller</p>
                      {results.stores.map((s) => (
                        <Link
                          key={s.id}
                          href={`/admin/sellers/${s.id}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-indigo-50 text-sm"
                        >
                          <span>🏪</span>
                          <span className="min-w-0">
                            <span className="block font-medium truncate">{s.name}</span>
                            <span className="block text-xs text-slate-400 truncate">{s.owner.email}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.orders.length > 0 && (
                    <div className="px-2 mt-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">Order</p>
                      {results.orders.map((o) => (
                        <Link
                          key={o.id}
                          href={`/admin/sellers/${o.storeId}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-indigo-50 text-sm"
                        >
                          <span>🧾</span>
                          <span className="min-w-0">
                            <span className="block font-mono text-xs font-bold truncate">{o.code}</span>
                            <span className="block text-xs text-slate-400 truncate">{o.buyerName} · {o.status}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.products.length > 0 && (
                    <div className="px-2 mt-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">Produk</p>
                      {results.products.map((p) => (
                        <Link
                          key={p.id}
                          href={`/admin/sellers/${p.storeId}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-indigo-50 text-sm"
                        >
                          <span>📦</span>
                          <span className="truncate">{p.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div ref={notifRef} className="relative shrink-0">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-lg text-slate-500 hover:bg-slate-100"
            aria-label="Notifikasi"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg ring-1 ring-slate-900/10 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="font-bold text-sm">Notifikasi</p>
                <Link href="/admin/notifications" onClick={() => setNotifOpen(false)} className="text-xs text-indigo-600 hover:underline">
                  Lihat semua
                </Link>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentNotifications.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Belum ada notifikasi</p>
                ) : (
                  recentNotifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link ?? "/admin/notifications"}
                      onClick={() => setNotifOpen(false)}
                      className={`flex items-start gap-2 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 ${!n.readAt ? "bg-indigo-50/40" : ""}`}
                    >
                      <span className="text-base shrink-0">{TYPE_ICON[n.type] ?? "🔔"}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold truncate">{n.title}</span>
                        <span className="block text-xs text-slate-500 truncate">{n.body}</span>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative shrink-0">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100"
          >
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center text-xs font-bold">
              {email.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden md:block text-xs text-slate-500 max-w-32 truncate">{email}</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg ring-1 ring-slate-900/10 overflow-hidden z-50 py-1">
              <p className="px-4 py-2 text-xs text-slate-400 truncate border-b border-slate-50">{email}</p>
              <Link href="/admin/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">
                ⚙️ Pengaturan
              </Link>
              <Link href="/" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-slate-50">
                ← Ke NuswaMart
              </Link>
              <form action={logoutAction}>
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                  Keluar
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
