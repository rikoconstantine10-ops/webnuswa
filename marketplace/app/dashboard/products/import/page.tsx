import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import ImportForm from "@/components/ImportForm";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireSeller();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Impor Produk Massal</h1>
        <Link href="/dashboard/products" className="text-sm text-slate-500 hover:underline">
          ← Kembali
        </Link>
      </div>
      <ImportForm />
    </div>
  );
}
