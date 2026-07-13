import Link from "next/link";

export const metadata = {
  title: "Blog — NuswaMart",
  description: "Tips jualan online, strategi UMKM, dan update fitur NuswaMart.",
};

const CATEGORIES = [
  { label: "Semua", slug: "" },
  { label: "Tips Jualan", slug: "tips-jualan" },
  { label: "UMKM", slug: "umkm" },
  { label: "Update Produk", slug: "update-produk" },
];

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <section className="bg-gradient-to-b from-teal-50 to-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <span className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-4 py-1.5 rounded-full text-xs font-bold text-teal-600 mb-4">
            Blog NuswaMart
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
            Tips Jualan &amp; Cerita UMKM
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            Panduan praktis buat kamu yang jualan online — strategi pemasaran, pengelolaan toko, sampai update fitur NuswaMart.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <nav className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              href={c.slug ? `/blog?kategori=${c.slug}` : "/blog"}
              className="text-sm font-medium px-4 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-teal-600 hover:text-teal-600 transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
