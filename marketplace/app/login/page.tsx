import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Masuk — NuswaMart" };

function safeNext(v: string | undefined): string | undefined {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : undefined;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);

  const user = await currentUser();
  if (user) {
    redirect(next ?? (user.role === "ADMIN" ? "/admin" : user.store ? "/dashboard" : "/akun"));
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-extrabold mb-1">Masuk</h1>
        <p className="text-sm text-slate-500 mb-6">
          Satu akun untuk belanja sekaligus kelola toko. Masuk pakai kode OTP ke email,
          atau username/email + password bila sudah kamu atur.
        </p>
        <AuthForm next={next} />
        <p className="text-xs text-slate-400 mt-6 text-center">
          Belum punya toko?{" "}
          <a href="/register-seller" className="text-teal-600 font-semibold hover:underline">
            Buka Toko Gratis
          </a>
        </p>
      </div>
    </div>
  );
}
