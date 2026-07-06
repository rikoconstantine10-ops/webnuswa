import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/transactions", label: "Transaksi" },
  { href: "/admin/sellers", label: "Seller" },
  { href: "/admin/reports", label: "Laporan Produk" },
  { href: "/admin/disputes", label: "Sengketa" },
  { href: "/admin/affiliates", label: "Afiliasi" },
  { href: "/admin/withdrawals", label: "Penarikan Dana" },
  { href: "/admin/categories", label: "Kategori" },
  { href: "/admin/vouchers", label: "Voucher Platform" },
  { href: "/admin/announcements", label: "Pengumuman" },
  { href: "/admin/audit", label: "Log Aktivitas" },
  { href: "/admin/errors", label: "Log Error" },
  { href: "/admin/settings", label: "Pengaturan" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <aside className="md:w-56 shrink-0">
        <div className="bg-slate-900 text-white rounded-2xl p-4 sticky top-20">
          <p className="font-bold text-sm mb-3">⚡ Admin Panel</p>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
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
