"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type User = {
  role: string;
  store?: { id: string } | null;
} | null;

export default function SiteHeader({
  user,
  logoutAction,
}: {
  user: User;
  logoutAction: () => void;
}) {
  const pathname = usePathname();
  const inDashboard = pathname === "/dashboard" || pathname?.startsWith("/dashboard/");
  const inAdmin = pathname === "/admin" || pathname?.startsWith("/admin/");

  if (inAdmin || inDashboard) {
    return null;
  }

  return (
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
                <button className="text-slate-500 hover:text-red-600 cursor-pointer">Keluar</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-teal-600 hidden sm:inline">
                Masuk Pembeli
              </Link>
              <Link
                href="/register-seller"
                className="bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700"
              >
                Buka Toko
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
