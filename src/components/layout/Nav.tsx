"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import {
  ChevronDown, Menu, X, Sparkles, ArrowRight,
  Target, Share2, BarChart3, Search, Globe, Palette,
  Users, Camera, ShoppingBag, Video, Smartphone, Zap,
  Building2, Heart, GraduationCap, UtensilsCrossed, Landmark, Store,
  Info, BookOpen, ImageIcon, Handshake, FileText, Star,
} from "lucide-react";

const navServices = [
  {
    group: "Marketing & Ads",
    items: [
      { label: "360° Digital Marketing", href: "/service/jasa-digital-marketing-360", icon: Target, desc: "Strategi end-to-end" },
      { label: "Social Media Management", href: "/service/social-media-management", icon: Share2, desc: "Kelola semua platform" },
      { label: "Digital Campaign / Ads", href: "/service/digital-campaign", icon: BarChart3, desc: "Meta, Google, TikTok, YouTube",
        sub: [
          { label: "Meta Ads", href: "/service/digital-campaign/meta-ads" },
          { label: "Instagram Ads", href: "/service/digital-campaign/instagram-ads" },
          { label: "TikTok Ads", href: "/service/digital-campaign/tiktok-ads" },
          { label: "Google Ads", href: "/service/digital-campaign/google-ads" },
          { label: "Facebook Ads", href: "/service/digital-campaign/facebook-ads" },
          { label: "YouTube Ads", href: "/service/digital-campaign/youtube-ads" },
        ],
      },
      { label: "SEO & Local SEO", href: "/service/jasa-seo", icon: Search, desc: "Peringkat #1 Google" },
    ],
  },
  {
    group: "Creative & Content",
    items: [
      { label: "Branding & Design", href: "/service/branding", icon: Palette, desc: "Logo & identitas visual",
        sub: [
          { label: "Jasa Desain", href: "/service/branding/jasa-desain" },
          { label: "Desain Logo", href: "/service/branding/jasa-desain/logo" },
          { label: "Banner & Brosur", href: "/service/branding/jasa-desain/banner-brosur" },
        ],
      },
      { label: "Commercial Photography", href: "/service/commercial-photography", icon: Camera, desc: "Foto profesional" },
      { label: "Foto Produk", href: "/service/jasa-foto-produk", icon: ShoppingBag, desc: "Untuk e-commerce & sosmed" },
      { label: "Video Production", href: "/service/video-production", icon: Video, desc: "Animasi & konten video" },
    ],
  },
  {
    group: "Tech & Growth",
    items: [
      { label: "Website Development", href: "/service/jasa-pembuatan-website", icon: Globe, desc: "Modern & SEO-ready" },
      { label: "Apps Development", href: "/service/apps-development", icon: Smartphone, desc: "Web & mobile apps custom" },
      { label: "AI Automation", href: "/service/ai-automation", icon: Zap, desc: "Chatbot, CRM, workflow" },
      { label: "KOL & Affiliate", href: "/service/affiliate-marketing", icon: Users, desc: "Influencer berbasis data" },
    ],
  },
];

const navSolutions = [
  { label: "Enterprise / Brand", href: "/solution/enterprise", icon: Building2, desc: "Skala korporat" },
  { label: "Healthcare", href: "/solution/healthcare", icon: Heart, desc: "Klinik & rumah sakit" },
  { label: "Education", href: "/solution/education", icon: GraduationCap, desc: "Sekolah & universitas" },
  { label: "F&B / Kuliner", href: "/solution/fnb", icon: UtensilsCrossed, desc: "Restoran & UMKM kuliner" },
  { label: "Organisasi & NGO", href: "/solution/organization", icon: Landmark, desc: "Lembaga & komunitas" },
  { label: "Retail & Toko Online", href: "/solution/retail", icon: Store, desc: "E-commerce & marketplace" },
];

const navCompany = [
  { label: "Tentang Kami", href: "/about", icon: Info, desc: "Misi & tim kami" },
  { label: "How it Works", href: "/how-it-works", icon: BookOpen, desc: "Cara kerja Nuswa Lab" },
  { label: "Portfolio", href: "/portfolio", icon: ImageIcon, desc: "Hasil kerja terbaik" },
  { label: "Our Clients", href: "/our-client", icon: Star, desc: "1.000+ brand terpercaya" },
  { label: "Partnership", href: "/partnership", icon: Handshake, desc: "Jadi mitra kami" },
  { label: "Blog", href: "/blog", icon: FileText, desc: "Tips & insight digital" },
];

// Per-icon bg colors: marketing=blue, creative=warm, tech=green
const iconColors: Record<string, { bg: string; fg: string }> = {
  Target:          { bg: "oklch(0.92 0.07 265)", fg: "oklch(0.38 0.18 265)" },
  Share2:          { bg: "oklch(0.92 0.07 220)", fg: "oklch(0.38 0.18 220)" },
  BarChart3:       { bg: "oklch(0.92 0.07 290)", fg: "oklch(0.38 0.18 290)" },
  Search:          { bg: "oklch(0.92 0.07 240)", fg: "oklch(0.38 0.18 240)" },
  Palette:         { bg: "oklch(0.93 0.07 35)",  fg: "oklch(0.40 0.18 35)"  },
  Camera:          { bg: "oklch(0.93 0.07 355)", fg: "oklch(0.40 0.18 355)" },
  ShoppingBag:     { bg: "oklch(0.93 0.07 55)",  fg: "oklch(0.40 0.18 55)"  },
  Video:           { bg: "oklch(0.93 0.07 320)", fg: "oklch(0.40 0.18 320)" },
  Globe:           { bg: "oklch(0.92 0.07 175)", fg: "oklch(0.38 0.18 175)" },
  Smartphone:      { bg: "oklch(0.92 0.07 155)", fg: "oklch(0.38 0.18 155)" },
  Zap:             { bg: "oklch(0.93 0.08 90)",  fg: "oklch(0.40 0.20 90)"  },
  Users:           { bg: "oklch(0.92 0.07 195)", fg: "oklch(0.38 0.18 195)" },
  Building2:       { bg: "oklch(0.92 0.06 230)", fg: "oklch(0.38 0.16 230)" },
  Heart:           { bg: "oklch(0.93 0.07 10)",  fg: "oklch(0.42 0.20 10)"  },
  GraduationCap:   { bg: "oklch(0.92 0.07 155)", fg: "oklch(0.38 0.18 155)" },
  UtensilsCrossed: { bg: "oklch(0.93 0.07 50)",  fg: "oklch(0.40 0.18 50)"  },
  Landmark:        { bg: "oklch(0.92 0.06 270)", fg: "oklch(0.38 0.16 270)" },
  Store:           { bg: "oklch(0.92 0.07 195)", fg: "oklch(0.38 0.18 195)" },
  Info:            { bg: "oklch(0.92 0.07 265)", fg: "oklch(0.38 0.18 265)" },
  BookOpen:        { bg: "oklch(0.92 0.07 290)", fg: "oklch(0.38 0.18 290)" },
  ImageIcon:       { bg: "oklch(0.92 0.06 240)", fg: "oklch(0.38 0.16 240)" },
  Star:            { bg: "oklch(0.93 0.08 75)",  fg: "oklch(0.40 0.20 75)"  },
  Handshake:       { bg: "oklch(0.92 0.07 160)", fg: "oklch(0.38 0.18 160)" },
  FileText:        { bg: "oklch(0.92 0.06 220)", fg: "oklch(0.38 0.16 220)" },
};

const GROUP_META: Record<string, { pill: string; pillText: string; dot: string }> = {
  "Marketing & Ads":    { pill: "oklch(0.90 0.09 265)", pillText: "oklch(0.32 0.18 265)", dot: "oklch(0.55 0.22 265)" },
  "Creative & Content": { pill: "oklch(0.91 0.09 355)", pillText: "oklch(0.35 0.18 355)", dot: "oklch(0.55 0.22 355)" },
  "Tech & Growth":      { pill: "oklch(0.90 0.09 160)", pillText: "oklch(0.32 0.18 160)", dot: "oklch(0.50 0.22 160)" },
};

const BADGE_NEW = new Set(["AI Automation"]);

type ServiceItem = { label: string; href: string; icon: React.ElementType; desc?: string; sub?: { label: string; href: string }[] };
type ServiceGroup = { group: string; items: ServiceItem[] };
type SimpleItem = { label: string; href: string; icon: React.ElementType; desc?: string };

function ServicesMegaMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 rounded-2xl z-50 overflow-visible"
      style={{
        width: "760px",
        background: "oklch(1 0 0 / 0.99)",
        backdropFilter: "blur(40px) saturate(180%)",
        border: "1px solid oklch(0.88 0.03 265 / 0.5)",
        boxShadow: "0 32px 80px -12px oklch(0.35 0.14 265 / 0.22), 0 0 0 1px oklch(0.9 0.02 265 / 0.25)",
      }}
    >
      {/* Header strip */}
      <div
        className="px-5 py-3 flex items-center justify-between rounded-t-2xl"
        style={{
          background: "linear-gradient(90deg, oklch(0.97 0.04 265) 0%, oklch(0.98 0.02 300) 50%, oklch(0.97 0.03 175) 100%)",
          borderBottom: "1px solid oklch(0.90 0.03 265 / 0.4)",
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-primary)" }}>
            Layanan Nuswa Lab
          </span>
        </div>
        <Link
          href="/service"
          onClick={onClose}
          className="text-xs font-semibold flex items-center gap-1 px-3 py-1 rounded-full transition-all hover:opacity-80"
          style={{ color: "var(--color-primary)", background: "oklch(0.92 0.06 265 / 0.5)" }}
        >
          Lihat semua <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-3 divide-x p-0" style={{ divideColor: "oklch(0.93 0.02 265 / 0.4)" }}>
        {(navServices as ServiceGroup[]).map((group, gi) => {
          const gMeta = GROUP_META[group.group] ?? { pill: "oklch(0.92 0.05 265)", pillText: "oklch(0.38 0.16 265)", dot: "oklch(0.55 0.22 265)" };
          return (
            <div key={group.group} className="p-4" style={gi < 2 ? { borderRight: "1px solid oklch(0.92 0.02 265 / 0.4)" } : {}}>
              {/* Group header pill */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: gMeta.dot }}
                />
                <span
                  className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{ background: gMeta.pill, color: gMeta.pillText }}
                >
                  {group.group}
                </span>
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const iName = (Icon as { displayName?: string }).displayName ?? Icon.name ?? "";
                  const col = iconColors[iName] ?? { bg: "oklch(0.92 0.06 265)", fg: "oklch(0.38 0.16 265)" };
                  const isNew = BADGE_NEW.has(item.label);
                  return (
                    <div
                      key={item.href}
                      className="relative"
                      onMouseEnter={() => item.sub ? setHoveredSub(item.href) : setHoveredSub(null)}
                      onMouseLeave={() => {}}
                    >
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer"
                        style={{ color: "var(--color-foreground)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = col.bg + "88"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                      >
                        <span
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:shadow-sm"
                          style={{ background: col.bg }}
                        >
                          <Icon className="w-4 h-4" style={{ color: col.fg }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold leading-tight truncate" style={{ color: "oklch(0.18 0.03 265)" }}>
                              {item.label}
                            </span>
                            {isNew && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: "oklch(0.90 0.12 160)", color: "oklch(0.30 0.18 160)" }}>
                                Baru
                              </span>
                            )}
                          </div>
                          {item.desc && (
                            <div className="text-[11px] leading-tight mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>
                              {item.desc}
                            </div>
                          )}
                        </div>
                        {item.sub && <ChevronDown className="w-3 h-3 -rotate-90 flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" />}
                      </Link>

                      {/* Flyout sub-menu */}
                      {item.sub && hoveredSub === item.href && (
                        <div
                          className="absolute left-full top-0 ml-2 w-52 rounded-2xl overflow-hidden z-[60]"
                          style={{
                            background: "oklch(1 0 0 / 0.99)",
                            backdropFilter: "blur(24px)",
                            border: "1px solid oklch(0.90 0.02 265 / 0.5)",
                            boxShadow: "0 16px 40px -8px oklch(0.35 0.14 265 / 0.18)",
                          }}
                        >
                          <div className="p-2">
                            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-1"
                              style={{ color: "var(--color-muted-foreground)" }}>
                              Platform
                            </p>
                            {item.sub.map((s) => (
                              <Link
                                key={s.href}
                                href={s.href}
                                onClick={onClose}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group"
                                style={{ color: "var(--color-foreground)" }}
                                onMouseEnter={e => (e.currentTarget.style.background = col.bg + "88")}
                                onMouseLeave={e => (e.currentTarget.style.background = "")}
                              >
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                                  style={{ background: col.fg }} />
                                {s.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA footer strip */}
      <div
        className="px-5 py-3 flex items-center justify-between rounded-b-2xl"
        style={{
          background: "oklch(0.975 0.015 265)",
          borderTop: "1px solid oklch(0.91 0.02 265 / 0.4)",
        }}
      >
        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          💡 Belum tahu layanan yang tepat?
        </p>
        <Link
          href="/contact"
          onClick={onClose}
          className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full transition-all hover:opacity-80"
          style={{ background: "var(--gradient-primary)", color: "white" }}
        >
          Konsultasi gratis <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function SimpleDropdown({ label, items, open, onClose }: {
  label: string;
  items: SimpleItem[];
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="absolute top-full left-0 mt-3 rounded-2xl overflow-hidden z-50"
      style={{
        width: "272px",
        background: "oklch(1 0 0 / 0.99)",
        backdropFilter: "blur(40px) saturate(180%)",
        border: "1px solid oklch(0.88 0.03 265 / 0.5)",
        boxShadow: "0 32px 80px -12px oklch(0.35 0.14 265 / 0.22), 0 0 0 1px oklch(0.9 0.02 265 / 0.25)",
      }}
    >
      <div
        className="px-4 py-2.5"
        style={{
          background: "linear-gradient(90deg, oklch(0.96 0.05 265) 0%, oklch(0.97 0.03 300) 100%)",
          borderBottom: "1px solid oklch(0.91 0.02 265 / 0.4)",
        }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-primary)" }}>{label}</span>
      </div>
      <div className="p-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const iName = (Icon as { displayName?: string }).displayName ?? Icon.name ?? "";
          const col = iconColors[iName] ?? { bg: "oklch(0.92 0.06 265)", fg: "oklch(0.38 0.16 265)" };
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-150 group"
              style={{ color: "var(--color-foreground)" }}
              onMouseEnter={e => (e.currentTarget.style.background = col.bg + "88")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                style={{ background: col.bg }}
              >
                <Icon className="w-4 h-4" style={{ color: col.fg }} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight" style={{ color: "oklch(0.18 0.03 265)" }}>
                  {item.label}
                </div>
                {item.desc && (
                  <div className="text-[11px] leading-tight mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>
                    {item.desc}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Nav() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
  };
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };

  const handleMouseEnter = (menu: string) => { cancelClose(); setOpenMenu(menu); };
  const handleMouseLeave = () => scheduleClose();
  const close = () => setOpenMenu(null);

  const allMenuItems = [
    { key: "services", label: "Layanan", items: navServices.flatMap(g => g.items) },
    { key: "solutions", label: "Solusi", items: navSolutions },
    { key: "company", label: "Perusahaan", items: navCompany },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4">
        <nav
          className="glass rounded-2xl px-4 lg:px-6 py-3 flex items-center justify-between"
          style={{ boxShadow: "var(--shadow-glass)" }}
        >
          {/* Logo */}
          <Link href="/" onClick={close} className="flex items-center gap-2 flex-shrink-0">
            <img src="/images/nuswalab-logo.svg" alt="Nuswa Lab" className="h-10 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {/* Layanan — mega menu */}
            <div className="relative" onMouseEnter={() => handleMouseEnter("services")} onMouseLeave={handleMouseLeave}>
              <button
                onClick={() => openMenu === "services" ? close() : setOpenMenu("services")}
                className="flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium transition-all hover:bg-black/5"
                style={{ color: openMenu === "services" ? "var(--color-primary)" : "var(--color-foreground)" }}
              >
                Layanan
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === "services" ? "rotate-180" : ""}`} />
              </button>
              <ServicesMegaMenu open={openMenu === "services"} onClose={close} />
            </div>

            {/* Solusi */}
            <div className="relative" onMouseEnter={() => handleMouseEnter("solutions")} onMouseLeave={handleMouseLeave}>
              <button
                onClick={() => openMenu === "solutions" ? close() : setOpenMenu("solutions")}
                className="flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium transition-all hover:bg-black/5"
                style={{ color: openMenu === "solutions" ? "var(--color-primary)" : "var(--color-foreground)" }}
              >
                Solusi
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === "solutions" ? "rotate-180" : ""}`} />
              </button>
              <SimpleDropdown label="Solusi per Industri" items={navSolutions} open={openMenu === "solutions"} onClose={close} />
            </div>

            {/* Perusahaan */}
            <div className="relative" onMouseEnter={() => handleMouseEnter("company")} onMouseLeave={handleMouseLeave}>
              <button
                onClick={() => openMenu === "company" ? close() : setOpenMenu("company")}
                className="flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium transition-all hover:bg-black/5"
                style={{ color: openMenu === "company" ? "var(--color-primary)" : "var(--color-foreground)" }}
              >
                Perusahaan
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenu === "company" ? "rotate-180" : ""}`} />
              </button>
              <SimpleDropdown label="Perusahaan" items={navCompany} open={openMenu === "company"} onClose={close} />
            </div>
          </div>

          {/* CTA + Mobile */}
          <div className="flex items-center gap-3">
            <Link href="/contact" className="btn-primary hidden lg:flex !py-2 !px-4 !text-sm gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Konsultasi Gratis
            </Link>
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-black/5 transition"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="lg:hidden mt-2 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: "oklch(1 0 0 / 0.98)",
              backdropFilter: "blur(32px)",
              border: "1px solid oklch(0.9 0.02 265 / 0.6)",
            }}
          >
            <div className="p-3">
              {allMenuItems.map(({ key, label, items }) => (
                <div key={key} className="mb-1">
                  <button
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm hover:bg-black/5 transition"
                    onClick={() => setMobileExpanded((p) => (p === key ? null : key))}
                  >
                    {label}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileExpanded === key ? "rotate-180" : ""}`} />
                  </button>
                  {mobileExpanded === key && (
                    <div className="mt-1 ml-2 space-y-0.5">
                      {(items as ServiceItem[]).map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => { close(); setMobileOpen(false); }}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition"
                            style={{ color: "var(--color-foreground)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.97 0.02 265)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "")}
                          >
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.94 0.04 265)" }}>
                              <Icon className="w-3 h-3" style={{ color: "var(--color-primary)" }} />
                            </span>
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-3 pt-0 border-t" style={{ borderColor: "oklch(0.92 0.02 265 / 0.4)" }}>
              <Link
                href="/contact"
                className="btn-primary w-full justify-center gap-1.5 mt-3"
                onClick={() => setMobileOpen(false)}
              >
                <Sparkles className="w-3.5 h-3.5" /> Konsultasi Gratis
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
