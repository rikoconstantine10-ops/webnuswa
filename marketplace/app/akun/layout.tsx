import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

const NAV = [
  { href: "/akun", label: "Ringkasan" },
  { href: "/akun/pesanan", label: "Pesanan Saya" },
  { href: "/akun/wishlist", label: "Favorit" },
  { href: "/akun/alamat", label: "Alamat" },
  { href: "/akun/poin", label: "Poin Loyalitas" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/akun");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <aside className="md:w-56 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-20">
          <p className="font-bold text-sm truncate">{user.name || "Akun Saya"}</p>
          <p className="text-xs text-slate-400 mb-3 truncate">{user.email}</p>
          <div className="mb-3 bg-teal-50 text-teal-700 rounded-lg px-3 py-2 text-sm font-bold">
            ⭐ {user.points.toLocaleString("id-ID")} poin
          </div>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm px-3 py-2 rounded-lg text-slate-600 hover:bg-teal-50 hover:text-teal-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
