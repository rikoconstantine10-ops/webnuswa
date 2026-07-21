"use client";

import { ReactNode, useEffect, useState } from "react";
import DashboardTopbar from "./DashboardTopbar";
import SidebarNav from "./SidebarNav";

type NotifItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function DashboardShell({
  storeName,
  storeSlug,
  storeStatus,
  storePaused,
  aiImageEnabled,
  aiVideoEnabled,
  aiCaptionEnabled,
  aiChatEnabled,
  landingPageEnabled,
  unreadCount,
  recentNotifications,
  logoutAction,
  children,
}: {
  storeName: string;
  storeSlug: string;
  storeStatus: string;
  storePaused: boolean;
  aiImageEnabled: boolean;
  aiVideoEnabled: boolean;
  aiCaptionEnabled: boolean;
  aiChatEnabled: boolean;
  landingPageEnabled: boolean;
  unreadCount: number;
  recentNotifications: NotifItem[];
  logoutAction: () => void;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("seller_sidebar_collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      window.localStorage.setItem("seller_sidebar_collapsed", !v ? "1" : "0");
      return !v;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-sky-50">
      <DashboardTopbar
        storeName={storeName}
        storeSlug={storeSlug}
        storeStatus={storeStatus}
        storePaused={storePaused}
        unreadCount={unreadCount}
        recentNotifications={recentNotifications}
        logoutAction={logoutAction}
        onToggleSidebar={() => setMobileOpen((v) => !v)}
      />

      <div className="flex">
        <aside
          className={`hidden md:block shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-200 bg-white/70 backdrop-blur transition-all ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          <div className="p-3">
            <SidebarNav
              unreadCount={unreadCount}
              collapsed={collapsed}
              aiImageEnabled={aiImageEnabled}
              aiVideoEnabled={aiVideoEnabled}
              aiCaptionEnabled={aiCaptionEnabled}
              aiChatEnabled={aiChatEnabled}
              landingPageEnabled={landingPageEnabled}
            />
          </div>
          <button
            onClick={toggleCollapsed}
            className="mx-3 mb-3 text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1.5"
          >
            {collapsed ? "»" : "« Ciutkan"}
          </button>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto p-3">
              <div className="flex items-center justify-between px-2 py-2 mb-1">
                <span className="flex items-center gap-2 font-extrabold text-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nuswamart-icon.png" alt="" className="h-5 w-auto" />
                  Nuswa<span className="text-teal-600">Mart</span> Seller
                </span>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 text-xl leading-none">
                  ×
                </button>
              </div>
              <SidebarNav
                unreadCount={unreadCount}
                onNavigate={() => setMobileOpen(false)}
                aiImageEnabled={aiImageEnabled}
                aiVideoEnabled={aiVideoEnabled}
                aiCaptionEnabled={aiCaptionEnabled}
                aiChatEnabled={aiChatEnabled}
              />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 md:px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
