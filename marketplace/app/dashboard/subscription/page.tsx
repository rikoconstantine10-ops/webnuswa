import { requireSeller } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeBalance } from "@/lib/ledger";
import SubscribeButton from "@/components/SubscribeButton";

export const dynamic = "force-dynamic";

async function settingNumber(key: string, fallback: number): Promise<number> {
  const s = await db.setting.findUnique({ where: { key } });
  const v = s ? parseFloat(s.value) : NaN;
  return Number.isFinite(v) ? v : fallback;
}

export default async function SubscriptionPage() {
  const { store } = await requireSeller();
  const [price, feeStd, feePro, balance] = await Promise.all([
    settingNumber("pro_monthly_price", 49000),
    settingNumber("platform_fee_percent", 5),
    settingNumber("platform_fee_percent_pro", 3),
    storeBalance(store.id),
  ]);
  const active = store.plan === "PRO" && !!store.planUntil && store.planUntil > new Date();

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Langganan Pro</h1>
      <p className="text-slate-500 text-sm mb-6">
        Naikkan penjualanmu dengan fee lebih rendah dan fitur premium.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-xs font-bold uppercase text-slate-400 mb-1">Paket Gratis</p>
          <p className="text-2xl font-extrabold mb-4">Rp0</p>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>✅ Jualan tanpa batas produk</li>
            <li>✅ Fee platform {feeStd}% per transaksi</li>
            <li>✅ Notifikasi WhatsApp</li>
            <li className="text-slate-400">➖ Tanpa badge Pro</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border-2 border-amber-300 p-6 relative">
          <span className="absolute top-4 right-4 text-[10px] font-bold uppercase bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
            Populer
          </span>
          <p className="text-xs font-bold uppercase text-amber-600 mb-1">Paket Pro</p>
          <p className="text-2xl font-extrabold mb-4">
            Rp{price.toLocaleString("id-ID")}
            <span className="text-sm font-medium text-slate-400">/bln</span>
          </p>
          <ul className="text-sm text-slate-700 space-y-2 mb-5">
            <li>⚡ Fee platform hanya {feePro}% (hemat {feeStd - feePro}%)</li>
            <li>⭐ Badge Toko Pro</li>
            <li>📈 Prioritas dukungan</li>
            <li>✅ Semua fitur paket gratis</li>
          </ul>

          {active ? (
            <div className="mb-3 text-sm">
              <span className="inline-block bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs">
                Pro aktif s/d {store.planUntil!.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          ) : null}

          <SubscribeButton price={price} active={active} />
          <p className="text-xs text-slate-400 mt-3">
            Dibayar dari saldo aktif tokomu (Rp{balance.toLocaleString("id-ID")}). Berlaku 30 hari.
          </p>
        </div>
      </div>
    </div>
  );
}
