"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  const inAdmin = pathname === "/admin" || pathname?.startsWith("/admin/");
  const inDashboard = pathname === "/dashboard" || pathname?.startsWith("/dashboard/");
  const inLanding = pathname?.startsWith("/l/");
  if (inAdmin || inDashboard || inLanding) return null;

  return (
    <footer className="bg-white border-t border-slate-200 py-6 text-center text-sm text-slate-500 space-y-2">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Link href="/market" className="hover:text-teal-600">Belanja</Link>
        <Link href="/bantuan" className="hover:text-teal-600">Bantuan</Link>
        <Link href="/blog" className="hover:text-teal-600">Blog</Link>
        <Link href="/terms" className="hover:text-teal-600">Syarat &amp; Ketentuan</Link>
        <Link href="/privacy" className="hover:text-teal-600">Privasi</Link>
        <a href="mailto:hello@nuswamart.com" className="hover:text-teal-600">hello@nuswamart.com</a>
      </div>
      <p>© {new Date().getFullYear()} NuswaMart — Marketplace produk digital &amp; fisik</p>
    </footer>
  );
}
