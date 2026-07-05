import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/money";
import { verifyKycAction, moderateProductAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  await requireAdmin();
  const [kyc, products] = await Promise.all([
    db.store.findMany({ where: { kycStatus: "PENDING" }, orderBy: { createdAt: "asc" } }),
    db.product.findMany({
      where: { moderation: "PENDING" },
      include: { store: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold">Moderasi & KYC</h1>

      <section className="space-y-3">
        <h2 className="font-bold text-sm">Verifikasi KYC Penjual ({kyc.length})</h2>
        {kyc.length === 0 && <p className="text-sm text-slate-400">Tidak ada pengajuan KYC.</p>}
        {kyc.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center gap-4">
            {s.kycIdImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.kycIdImageUrl} alt="KTP" className="h-20 w-32 object-cover rounded-lg border" />
            )}
            <div className="flex-1 min-w-48">
              <p className="font-bold">{s.name}</p>
              <p className="text-sm text-slate-600">{s.kycName} · NIK {s.kycIdNumber}</p>
            </div>
            <form action={verifyKycAction} className="flex gap-2">
              <input type="hidden" name="storeId" value={s.id} />
              <button name="decision" value="VERIFIED" className="bg-emerald-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700">Verifikasi</button>
              <button name="decision" value="REJECTED" className="bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-red-700">Tolak</button>
            </form>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-sm">Moderasi Produk ({products.length})</h2>
        {products.length === 0 && <p className="text-sm text-slate-400">Tidak ada produk menunggu moderasi.</p>}
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
            {p.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.name} className="h-16 w-16 object-cover rounded-lg border" />
            )}
            <div className="flex-1 min-w-48">
              <p className="font-bold text-sm">{p.name}</p>
              <p className="text-xs text-slate-500">{p.store.name} · {formatRupiah(p.price)}</p>
            </div>
            <form action={moderateProductAction} className="flex gap-2">
              <input type="hidden" name="productId" value={p.id} />
              <button name="decision" value="APPROVED" className="bg-emerald-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700">Setujui</button>
              <button name="decision" value="REJECTED" className="bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-red-700">Tolak</button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
