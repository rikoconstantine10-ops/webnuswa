import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect("/akun");

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-extrabold mb-1">Masuk Pembeli</h1>
        <p className="text-sm text-slate-500 mb-6">
          Opsional — belanja & checkout tidak wajib punya akun. Masuk untuk lihat
          riwayat pesanan, wishlist, dan poin loyalitas. Tanpa password, cukup
          kode OTP ke email kamu.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
