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
        <h1 className="text-2xl font-extrabold mb-1">Buka Toko</h1>
        <p className="text-sm text-slate-500 mb-6">
          Gratis. Jual produk digital maupun fisik, dana masuk ke saldo tokomu.
        </p>
        {user ? <RegisterSellerForm /> : <SellerAuthForm />}
      </div>
    </div>
  );
}
