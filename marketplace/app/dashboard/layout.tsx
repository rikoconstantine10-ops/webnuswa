import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const NAV = [
  { href: "/dashboard", label: "Ringkasan" },
  { href: "/dashboard/notifications", label: "🔔 Notifikasi" },
  { href: "/dashboard/products", label: "Produk" },
  { href: "/dashboard/orders", label: "Pesanan" },
  { href: "/dashboard/reviews", label: "Ulasan" },
  { href: "/dashboard/questions", label: "Tanya Jawab" },
  { href: "/dashboard/vouchers", label: "Voucher" },
  { href: "/dashboard/analytics", label: "Analitik" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" },
  { href: "/dashboard/withdrawals", label: "Saldo & Penarikan" },
  { href: "/dashboard/subscription", label: "Langganan Pro" },
  { href: "/dashboard/store", label: "Pengaturan Toko" },
  { href: "/dashboard/store/builder", label: "Desain Toko" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.store) redirect("/register-seller");

  const unreadCount = await db.notification.count({ where: { storeId: user.store.id, readAt: null } });

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
          {user.store.paused && (
            <p className="text-[10px] font-bold uppercase inline-block px-2 py-0.5 rounded-full mb-3 ml-1 bg-slate-200 text-slate-600">
              ⏸ Tutup Sementara
            </p>
          )}
          <a
            href={`/s/${user.store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="block text-xs font-semibold text-teal-600 hover:underline mb-3"
          >
            🔗 Lihat Halaman Toko
          </a>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-lg text-slate-600 hover:bg-teal-50 hover:text-teal-700"
              >
                {item.label}
                {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
