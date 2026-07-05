import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";
import { currentUser, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import ServiceWorker from "@/components/ServiceWorker";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NuswaMart",
  description: "Marketplace produk digital & fisik — jual apa saja, bayar mudah via QRIS & VA.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "NuswaMart", statusBarStyle: "default" },
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
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-extrabold text-teal-600">
              Nuswa<span className="text-slate-800">Mart</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/market" className="text-slate-600 hover:text-teal-600">
                Belanja
              </Link>
              <Link href="/cart" className="text-slate-600 hover:text-teal-600">
                🛒 Keranjang
              </Link>
              {user ? (
                <>
                  <Link href="/akun" className="text-slate-600 hover:text-teal-600">
                    Akun
                  </Link>
                  <Link href="/affiliate" className="text-slate-600 hover:text-teal-600 hidden sm:inline">
                    Afiliasi
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" className="text-slate-600 hover:text-teal-600">
                      Admin
                    </Link>
                  )}
                  {user.store ? (
                    <Link href="/dashboard" className="text-slate-600 hover:text-teal-600">
                      Dashboard Toko
                    </Link>
                  ) : (
                    <Link href="/register-seller" className="text-slate-600 hover:text-teal-600">
                      Buka Toko
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button className="text-slate-500 hover:text-red-600 cursor-pointer">
                      Keluar
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700"
                >
                  Masuk
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-sm text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/market" className="hover:text-teal-600">Belanja</Link>
            <Link href="/bantuan" className="hover:text-teal-600">Bantuan</Link>
            <Link href="/terms" className="hover:text-teal-600">Syarat &amp; Ketentuan</Link>
            <Link href="/privacy" className="hover:text-teal-600">Privasi</Link>
          </div>
          <p>© {new Date().getFullYear()} NuswaMart — Marketplace produk digital &amp; fisik</p>
        </footer>
      </body>
    </html>
  );
}
