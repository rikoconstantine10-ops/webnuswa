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

const iconColors: Record<string, string> = {
  Target:   "oklch(0.94 0.05 265)",
  Share2:   "oklch(0.94 0.05 200)",
  BarChart3:"oklch(0.94 0.06 300)",
  Search:   "oklch(0.94 0.05 150)",
  Palette:  "oklch(0.94 0.06 30)",
  Camera:   "oklch(0.94 0.05 240)",
  ShoppingBag:"oklch(0.94 0.05 60)",
  Video:    "oklch(0.94 0.06 350)",
  Globe:    "oklch(0.94 0.05 190)",
  Smartphone:"oklch(0.94 0.06 265)",
  Zap:      "oklch(0.94 0.06 80)",
  Users:    "oklch(0.94 0.05 320)",
  Building2:"oklch(0.94 0.05 230)",
  Heart:    "oklch(0.94 0.06 10)",
  GraduationCap:"oklch(0.94 0.05 150)",
  UtensilsCrossed:"oklch(0.94 0.06 50)",
  Landmark: "oklch(0.94 0.05 280)",
  Store:    "oklch(0.94 0.06 200)",
  Info:     "oklch(0.94 0.05 265)",
  BookOpen: "oklch(0.94 0.05 300)",
  ImageIcon:"oklch(0.94 0.06 240)",
  Star:     "oklch(0.94 0.06 70)",
  Handshake:"oklch(0.94 0.05 160)",
  FileText: "oklch(0.94 0.05 220)",
};

type ServiceItem = { label: string; href: string; icon: React.ElementType; desc?: string; sub?: { label: string; href: string }[] };
type ServiceGroup = { group: string; items: ServiceItem[] };
type SimpleItem = { label: string; href: string; icon: React.ElementType; desc?: string };

function ServicesMegaMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 rounded-2xl overflow-hidden z-50"
      style={{
        width: "720px",
        background: "oklch(1 0 0 / 0.98)",
        backdropFilter: "blur(32px) saturate(200%)",
        border: "1px solid oklch(0.9 0.02 265 / 0.6)",
        boxShadow: "0 24px 80px -12px oklch(0.4 0.12 265 / 0.18), 0 0 0 1px oklch(0.88 0.02 265 / 0.3)",
      }}
    >
      {/* Header strip */}
      <div className="px-5 py-3 flex items-center justify-between border-b" style={{ borderColor: "oklch(0.92 0.02 265 / 0.5)", background: "oklch(0.985 0.01 265)" }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-primary)" }}>Semua Layanan</span>
        <Link href="/service" onClick={onClose} className="text-xs font-medium flex items-center gap-1 hover:opacity-70 transition" style={{ color: "var(--color-primary)" }}>
          Lihat semua <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-0 p-4">
        {(navServices as ServiceGroup[]).map((group) => (
          <div key={group.group} className="px-2">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2" style={{ color: "var(--color-muted-foreground)" }}>{group.group}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const iconBg = iconColors[Icon.displayName || ""] || "oklch(0.94 0.05 265)";
                return (
                  <div key={item.href} className="relative" onMouseEnter={() => item.sub ? setHoveredSub(item.href) : setHoveredSub(null)}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 group cursor-pointer"
                      style={{ color: "var(--color-foreground)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.97 0.02 265)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}
                    >
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: iconBg }}>
                        <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-tight truncate group-hover:text-primary transition-colors">{item.label}</div>
                        {item.desc && <div className="text-[11px] leading-tight truncate mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{item.desc}</div>}
                      </div>
                      {item.sub && <ChevronDown className="w-3 h-3 ml-auto -rotate-90 opacity-30 flex-shrink-0" />}
                    </Link>
                    {item.sub && hoveredSub === item.href && (
                      <div
                        className="absolute left-full top-0 ml-2 w-52 rounded-2xl overflow-hidden z-50"
                        style={{
                          background: "oklch(1 0 0 / 0.98)",
                          backdropFilter: "blur(24px)",
                          border: "1px solid oklch(0.9 0.02 265 / 0.6)",
                          boxShadow: "0 16px 40px -8px oklch(0.4 0.12 265 / 0.15)",
                        }}
                      >
                        <div className="p-2">
                          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-muted-foreground)" }}>Platform</p>
                          {item.sub.map((s) => (
                            <Link
                              key={s.href}
                              href={s.href}
                              onClick={onClose}
                              className="block px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                              style={{ color: "var(--color-foreground)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.97 0.02 265)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "")}
                            >
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
        ))}
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
        width: "260px",
        background: "oklch(1 0 0 / 0.98)",
        backdropFilter: "blur(32px) saturate(200%)",
        border: "1px solid oklch(0.9 0.02 265 / 0.6)",
        boxShadow: "0 24px 80px -12px oklch(0.4 0.12 265 / 0.18), 0 0 0 1px oklch(0.88 0.02 265 / 0.3)",
      }}
    >
      <div className="px-3 py-2 border-b" style={{ borderColor: "oklch(0.92 0.02 265 / 0.5)", background: "oklch(0.985 0.01 265)" }}>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-primary)" }}>{label}</span>
      </div>
      <div className="p-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 group"
              style={{ color: "var(--color-foreground)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.97 0.02 265)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: "oklch(0.94 0.04 265)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">{item.label}</div>
                {item.desc && <div className="text-[11px] leading-tight mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>{item.desc}</div>}
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
