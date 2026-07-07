import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SetPasswordForm from "@/components/SetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Akun Saya — NuswaMart" };

export default async function AccountHomePage() {
  const user = await requireUser();
  const [orderCount, wishlistCount, addressCount] = await Promise.all([
    db.order.count({ where: { OR: [{ buyerId: user.id }, { buyerEmail: user.email }] } }),
    db.wishlist.count({ where: { userId: user.id } }),
    db.address.count({ where: { userId: user.id } }),
  ]);

  const cards = [
    { href: "/akun/pesanan", label: "Pesanan Saya", value: orderCount, icon: "📦" },
    { href: "/akun/wishlist", label: "Produk Favorit", value: wishlistCount, icon: "❤️" },
    { href: "/akun/alamat", label: "Alamat Tersimpan", value: addressCount, icon: "📍" },
    { href: "/akun/poin", label: "Poin Loyalitas", value: user.points, icon: "⭐" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Halo, {user.name || "Sobat NuswaMart"} 👋</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-teal-300 transition"
          >
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="text-2xl font-extrabold">{c.value.toLocaleString("id-ID")}</div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </Link>
        ))}
      </div>

      {!user.store && (
        <div className="mt-6 bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-2xl p-6">
          <h2 className="font-bold mb-1">Punya produk untuk dijual?</h2>
          <p className="text-sm text-slate-600 mb-3">Buka tokomu gratis dan mulai jualan hari ini.</p>
          <Link href="/register-seller" className="inline-block bg-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-teal-700">
            Buka Toko Gratis
          </Link>
        </div>
      )}

      {user.store && (
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-bold mb-1">
            {user.passwordHash ? "Ubah Password Login Toko" : "Atur Password Login Toko"}
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            Selain kode OTP, kamu bisa masuk ke dashboard toko pakai email + password.
          </p>
          <SetPasswordForm />
        </div>
      )}
    </div>
  );
}
