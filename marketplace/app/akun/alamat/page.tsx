import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AddressForm from "@/components/AddressForm";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";

export const metadata = { title: "Alamat — NuswaMart" };

export default async function AddressPage() {
  const user = await requireUser();
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Alamat Tersimpan</h1>
        <AddressForm />
      </div>

      {addresses.length === 0 ? (
        <p className="text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-200">
          Belum ada alamat tersimpan.
        </p>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm">{a.label}</span>
                {a.isDefault && (
                  <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Utama</span>
                )}
              </div>
              <p className="text-sm font-semibold">{a.recipientName} · {a.phone}</p>
              <p className="text-sm text-slate-500">{a.detail}{a.postalCode ? ` (${a.postalCode})` : ""}</p>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <AddressForm
                  editing={{
                    id: a.id,
                    label: a.label,
                    recipientName: a.recipientName,
                    phone: a.phone,
                    detail: a.detail,
                    areaId: a.areaId,
                    postalCode: a.postalCode,
                    isDefault: a.isDefault,
                  }}
                />
                {!a.isDefault && (
                  <form action={setDefaultAddressAction} className="inline">
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-slate-500 font-semibold hover:underline cursor-pointer">Jadikan Utama</button>
                  </form>
                )}
                <form action={deleteAddressAction} className="inline">
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-red-500 font-semibold hover:underline cursor-pointer">Hapus</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
