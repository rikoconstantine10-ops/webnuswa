import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "⚡",
    title: "Pembayaran Otomatis QRIS & VA",
    desc: "Pembeli bayar lewat QRIS atau Virtual Account (BNI, BRI, Mandiri, Permata, CIMB). Order otomatis lunas tanpa cek mutasi manual.",
    accent: "bg-teal-50 text-teal-600",
  },
  {
    icon: "📦",
    title: "Produk Fisik & Digital",
    desc: "Jual barang kiriman kurir maupun produk digital — e-book, preset, source code — yang terkirim otomatis lewat link download aman.",
    accent: "bg-purple-50 text-purple-600",
  },
  {
    icon: "💰",
    title: "Saldo & Penarikan Dana",
    desc: "Setiap penjualan langsung tercatat di saldo tokomu. Tarik dana ke rekening bank kapan saja, riwayat mutasi transparan.",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    icon: "🏪",
    title: "Halaman Toko Sendiri",
    desc: "Setiap UMKM dapat halaman toko dengan link sendiri yang siap dibagikan ke WhatsApp, Instagram, dan TikTok.",
    accent: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: "📊",
    title: "Dashboard Lengkap",
    desc: "Kelola produk, pesanan, resi pengiriman, dan keuangan dari satu dashboard yang sederhana — buka dari HP pun nyaman.",
    accent: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: "🔐",
    title: "Masuk Tanpa Password",
    desc: "Login cukup dengan kode OTP ke email. Cepat, aman, dan tidak ada password yang perlu diingat-ingat.",
    accent: "bg-rose-50 text-rose-600",
  },
];

const STEPS = [
  {
    no: "1",
    title: "Daftar & Buka Toko",
    desc: "Masuk dengan email, isi nama toko. Gratis, tidak sampai satu menit.",
  },
  {
    no: "2",
    title: "Pasang Produk",
    desc: "Upload produk fisik atau digital, atur harga dan stok sesukamu.",
  },
  {
    no: "3",
    title: "Terima Pembayaran",
    desc: "Pembeli bayar via QRIS/VA, saldo masuk otomatis, tarik ke rekeningmu.",
  },
];

export default async function HomePage() {
  const baseWhere = { active: true, moderation: "APPROVED", store: { status: "ACTIVE" } } as const;
  const cardInclude = { store: { select: { name: true, slug: true } } };
  const nowDate = new Date();
  const [latest, flashSale, bestSellers] = await Promise.all([
    db.product.findMany({ where: baseWhere, include: cardInclude, orderBy: { createdAt: "desc" }, take: 24 }),
    db.product.findMany({
      where: { ...baseWhere, salePrice: { gt: 0 }, saleEndsAt: { gt: nowDate } },
      include: cardInclude,
      orderBy: { saleEndsAt: "asc" },
      take: 6,
    }),
    db.product.findMany({
      where: { ...baseWhere, soldCount: { gt: 0 } },
      include: cardInclude,
      orderBy: { soldCount: "desc" },
      take: 6,
    }),
  ]);
  // Produk yang sedang di-boost tampil paling depan.
  const now = Date.now();
  const isBoosted = (p: { boostedUntil: Date | null }) => (p.boostedUntil ? p.boostedUntil.getTime() > now : false);
  const products = [...latest].sort((a, b) => Number(isBoosted(b)) - Number(isBoosted(a))).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full opacity-60 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(13,148,136,0.15) 0%, rgba(255,255,255,0) 70%)" }}
        />
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center relative">
          <span className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-5 py-2 rounded-full text-xs font-bold text-purple-600 mb-6">
            🇮🇩 Marketplace Digital untuk UMKM Indonesia
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 leading-tight tracking-tight mb-6">
            Jualan Online{" "}
            <span className="bg-gradient-to-r from-teal-500 to-slate-700 bg-clip-text text-transparent">
              Semudah Kirim Chat
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-9">
            Buka toko gratis, jual produk fisik maupun digital, dan terima pembayaran
            QRIS & Virtual Account secara otomatis. Semua dari satu platform — tanpa ribet,
            tanpa biaya bulanan.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link
              href="/register-seller"
              className="bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-teal-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-500/30 transition-all"
            >
              Buka Toko Gratis →
            </Link>
            <Link
              href="/market"
              className="bg-white text-slate-700 font-bold px-8 py-4 rounded-full border border-slate-200 shadow-sm hover:border-teal-500 hover:text-teal-600 transition-all"
            >
              Jelajahi Produk
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Gratis selamanya · Bayar hanya saat laku · Produk digital & fisik
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
            Semua yang UMKM Butuhkan untuk Go Digital
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Tinggalkan cara manual cek transferan satu-satu. Fokus jualan,
            sisanya platform yang urus.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-3xl border border-slate-200 p-7 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${f.accent}`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
              Mulai Jualan dalam 3 Langkah
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.no} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xl font-extrabold flex items-center justify-center mb-4 shadow-lg shadow-teal-500/25">
                  {s.no}
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/register-seller"
              className="inline-block bg-slate-900 text-white font-bold px-8 py-4 rounded-full hover:bg-slate-700 transition-colors"
            >
              Buka Toko Sekarang — Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Flash Sale */}
      {flashSale.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-rose-600">⚡ Flash Sale</h2>
            <Link href="/market" className="text-rose-600 font-bold text-sm hover:underline">Lihat Semua →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {flashSale.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Terlaris */}
      {bestSellers.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">🔥 Terlaris</h2>
            <Link href="/market?sort=rating" className="text-teal-600 font-bold text-sm hover:underline">Lihat Semua →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Product showcase */}
      {products.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">
                Produk Terbaru
              </h2>
              <p className="text-slate-500 text-sm mt-1">Dari UMKM yang sudah bergabung</p>
            </div>
            <Link href="/market" className="text-teal-600 font-bold text-sm hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
          <div
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)" }}
          />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Saatnya UMKM-mu Naik Kelas 🚀
          </h2>
          <p className="text-teal-50 max-w-xl mx-auto mb-8">
            Bergabung gratis hari ini. Tanpa biaya pendaftaran, tanpa langganan bulanan —
            platform hanya mengambil komisi kecil saat produkmu laku.
          </p>
          <Link
            href="/register-seller"
            className="inline-block bg-white text-teal-700 font-extrabold px-10 py-4 rounded-full hover:bg-teal-50 shadow-xl transition-colors"
          >
            Daftar & Buka Toko
          </Link>
        </div>
      </section>
    </div>
  );
}
