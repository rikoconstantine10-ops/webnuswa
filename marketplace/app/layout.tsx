import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";
import { currentUser, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import ServiceWorker from "@/components/ServiceWorker";
import HeatmapTracker from "@/components/HeatmapTracker";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import SiteHeader from "@/components/SiteHeader";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NuswaMart",
  description: "Marketplace produk digital & fisik — jual apa saja, bayar mudah via QRIS & VA.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "NuswaMart", statusBarStyle: "default" },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
};

async function logoutAction() {
  "use server";
  await logout();
  redirect("/");
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();

  return (
    <html lang="id">
      <body className={`${geist.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        <ServiceWorker />
        <HeatmapTracker />
        <GoogleAnalytics />
        <SiteHeader user={user} logoutAction={logoutAction} />
        <main className="flex-1">{children}</main>
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
      </body>
    </html>
  );
}
