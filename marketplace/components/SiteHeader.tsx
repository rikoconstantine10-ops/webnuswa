"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type User = {
  role: string;
  store?: { id: string } | null;
} | null;

// Segmen path yang dianggap "mode belanja" (marketplace) — sisanya = mode marketing (seller).
const SHOP_SEGMENTS = ["/market", "/p", "/s", "/cart", "/order", "/akun"];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-teal-600">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/nuswamart-icon.png" alt="" className="h-7 w-auto" />
      Nuswa<span className="text-slate-800">Mart</span>
    </Link>
  );
}

function LogoutButton({ logoutAction }: { logoutAction: () => void }) {
  return (
    <form action={logoutAction}>
      <button className="text-slate-500 hover:text-red-600 cursor-pointer">Keluar</button>
    </form>
  );
}

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
  const inLanding = pathname?.startsWith("/l/");
  if (inAdmin || inDashboard || inLanding) return null;

  const seg = "/" + (pathname?.split("/")[1] ?? "");
  const shopping = SHOP_SEGMENTS.includes(seg);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        <Brand />

        {shopping ? (
          /* ===================== MODE BELANJA (pembeli) ===================== */
          <>
            <Link
              href="/market"
              className="hidden md:flex items-center gap-2 flex-1 max-w-sm bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-400 hover:border-teal-300"
            >
              🔍 Cari produk…
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium ml-auto">
              <Link href="/market" className="text-slate-600 hover:text-teal-600 hidden sm:inline">
                Kategori
              </Link>
              <Link href="/cart" className="text-slate-600 hover:text-teal-600">
                🛒 <span className="hidden sm:inline">Keranjang</span>
              </Link>
              {user ? (
                <>
                  <Link href="/akun" className="text-slate-600 hover:text-teal-600">
                    Akun
                  </Link>
                  {user.store && (
                    <Link href="/dashboard" className="text-slate-600 hover:text-teal-600 hidden sm:inline">
                      Dashboard
                    </Link>
                  )}
                  <LogoutButton logoutAction={logoutAction} />
                </>
              ) : (
                <>
                  <Link
                    href={`/login?next=${encodeURIComponent(pathname || "/market")}`}
                    className="text-slate-600 hover:text-teal-600"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register-seller"
                    className="text-teal-700 font-semibold hover:text-teal-800 hidden sm:inline"
                  >
                    Buka Toko
                  </Link>
                </>
              )}
            </nav>
          </>
        ) : (
          /* ===================== MODE MARKETING (seller) ===================== */
          <>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 ml-4">
              <Link href="/#fitur" className="hover:text-teal-600">Fitur</Link>
              <Link href="/#harga" className="hover:text-teal-600">Harga</Link>
              <Link href="/market" className="hover:text-teal-600">Belanja</Link>
            </nav>
            <nav className="flex items-center gap-3 text-sm font-medium ml-auto">
              {user ? (
                <>
                  <Link href="/akun" className="text-slate-600 hover:text-teal-600 hidden sm:inline">
                    Akun
                  </Link>
                  {user.store ? (
                    <Link
                      href="/dashboard"
                      className="bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700"
                    >
                      Dashboard Toko
                    </Link>
                  ) : (
                    <Link
                      href="/register-seller"
                      className="bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700"
                    >
                      Buka Toko Gratis
                    </Link>
                  )}
                  <LogoutButton logoutAction={logoutAction} />
                </>
              ) : (
                <>
                  <Link href="/login" className="text-slate-600 hover:text-teal-600">
                    Masuk
                  </Link>
                  <Link
                    href="/register-seller"
                    className="bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700"
                  >
                    Buka Toko Gratis
                  </Link>
                </>
              )}
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
