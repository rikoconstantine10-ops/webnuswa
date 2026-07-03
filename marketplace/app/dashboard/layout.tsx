import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Ringkasan" },
  { href: "/dashboard/products", label: "Produk" },
  { href: "/dashboard/orders", label: "Pesanan" },
  { href: "/dashboard/analytics", label: "Analitik" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" },
  { href: "/dashboard/withdrawals", label: "Saldo & Penarikan" },
  { href: "/dashboard/store", label: "Pengaturan Toko" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.store) redirect("/register-seller");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <aside className="md:w-56 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-20">
          <p className="font-bold text-sm mb-1 truncate">{user.store.name}</p>
          <p
            className={`text-[10px] font-bold uppercase inline-block px-2 py-0.5 rounded-full mb-3 ${
              user.store.status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-700"
                : user.store.status === "PENDING"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {user.store.status === "ACTIVE"
              ? "Aktif"
              : user.store.status === "PENDING"
                ? "Menunggu Persetujuan"
                : "Ditangguhkan"}
          </p>
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
