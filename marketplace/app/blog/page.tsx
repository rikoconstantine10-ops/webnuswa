export const metadata = { title: "Blog — NuswaMart" };

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  date: string;
  readTime: string;
};

const POSTS: Post[] = [
  {
    slug: "cara-mulai-jualan-online-tanpa-modal-besar",
    title: "Cara Mulai Jualan Online Tanpa Modal Besar",
    excerpt: "Nggak perlu stok banyak buat mulai jualan. Ini langkah praktis buka toko di NuswaMart dari nol.",
    category: "Tips Jualan",
    categorySlug: "tips-jualan",
    date: "2026-07-02",
    readTime: "4 menit baca",
  },
  {
    slug: "5-strategi-umkm-naik-kelas-lewat-marketplace",
    title: "5 Strategi UMKM Naik Kelas Lewat Marketplace",
    excerpt: "Dari warung ke digital — begini cara UMKM lokal memperluas jangkauan pelanggan lewat marketplace.",
    category: "UMKM",
    categorySlug: "umkm",
    date: "2026-06-24",
    readTime: "6 menit baca",
  },
  {
    slug: "qris-vs-virtual-account-mana-yang-lebih-cocok",
    title: "QRIS vs Virtual Account, Mana yang Lebih Cocok Buat Tokomu?",
    excerpt: "Kenali perbedaan dan kelebihan masing-masing metode pembayaran otomatis di NuswaMart.",
    category: "Tips Jualan",
    categorySlug: "tips-jualan",
    date: "2026-06-15",
    readTime: "3 menit baca",
  },
  {
    slug: "dashboard-analitik-pantau-performa-toko",
    title: "Fitur Dashboard Analitik buat Pantau Performa Toko",
    excerpt: "Lihat tren penjualan, produk terlaris, dan sumber trafik langsung dari dashboard seller.",
    category: "Update Produk",
    categorySlug: "update-produk",
    date: "2026-06-08",
    readTime: "2 menit baca",
  },
  {
    slug: "jualan-produk-digital-vs-fisik",
    title: "Jualan Produk Digital vs Fisik, Apa Bedanya di NuswaMart?",
    excerpt: "Ongkir, stok, sampai cara pengiriman — perbandingan lengkap sebelum menentukan jenis produk jualan.",
    category: "Tips Jualan",
    categorySlug: "tips-jualan",
    date: "2026-05-30",
    readTime: "5 menit baca",
  },
  {
    slug: "kisah-toko-kecil-tembus-1000-transaksi",
    title: "Kisah Toko Kecil yang Tembus 1000 Transaksi Pertama",
    excerpt: "Belajar dari perjalanan salah satu seller NuswaMart yang konsisten sejak hari pertama buka toko.",
    category: "UMKM",
    categorySlug: "umkm",
    date: "2026-05-18",
    readTime: "4 menit baca",
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const posts = kategori ? POSTS.filter((p) => p.categorySlug === kategori) : POSTS;

  return (
    <div>
      {posts.length === 0 ? (
        <p className="text-center text-slate-500 py-16">Belum ada artikel di kategori ini.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-teal-600 hover:shadow-md transition-all flex flex-col"
            >
              <span className="text-xs font-bold text-teal-600 mb-2">{post.category}</span>
              <h2 className="font-bold text-slate-800 mb-2">{post.title}</h2>
              <p className="text-sm text-slate-500 flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                <span>{formatDate(post.date)}</span>
                <span>{post.readTime}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
