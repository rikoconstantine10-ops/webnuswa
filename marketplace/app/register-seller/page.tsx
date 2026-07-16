import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import RegisterSellerForm from "@/components/RegisterSellerForm";
import SellerAuthForm from "@/components/SellerAuthForm";

export default async function RegisterSellerPage() {
  const user = await currentUser();
  if (user?.store) redirect("/dashboard");

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-extrabold mb-1">{user ? "Buka Toko" : "Masuk atau Buka Toko"}</h1>
        <p className="text-sm text-slate-500 mb-5">
          {user
            ? "Gratis. Jual produk digital maupun fisik, dana masuk ke saldo tokomu."
            : "Masuk ke tokomu (username/email + password, atau kode OTP), atau buka toko baru gratis."}
        </p>

        <div className="mb-6 flex gap-2 text-xs text-teal-800 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2.5">
          <span aria-hidden>💡</span>
          {user ? (
            <span>
              Tokomu akan dibuka di akun ini (<b>{user.email}</b>). Belanja &amp; jualan tetap
              <b> satu akun</b> — tak perlu akun terpisah.
            </span>
          ) : (
            <span>
              Sudah pernah belanja di NuswaMart? Masuk pakai <b>email/akun yang sama</b> — belanja
              &amp; jualan cukup <b>satu akun</b>, tak perlu daftar ulang.
            </span>
          )}
        </div>

        {user ? <RegisterSellerForm /> : <SellerAuthForm />}
      </div>
    </div>
  );
}
