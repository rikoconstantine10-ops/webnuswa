import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-extrabold mb-1">Masuk / Daftar</h1>
        <p className="text-sm text-slate-500 mb-6">
          Tanpa password — cukup verifikasi kode OTP yang dikirim ke email kamu.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
