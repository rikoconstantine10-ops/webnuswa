import Link from "next/link";

const DB_PATH = "/home/ubuntu/articel generator/data.db";

interface Article {
  id: number;
  title: string;
  slug: string;
  keyword: string;
  meta_description: string;
  category: string;
  featured_image: string | null;
  word_count: number;
  seo_score: number;
  published_date: string;
}

async function getPublishedArticles(): Promise<Article[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: true });
    const articles = db.prepare(`
      SELECT id, title, slug, keyword, meta_description, category,
             featured_image, word_count, seo_score, published_date
      FROM articles
      WHERE status = 'published'
      ORDER BY published_date DESC
      LIMIT 50
    `).all() as Article[];
    db.close();
    return articles;
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Blog — Nuswa Lab",
  description: "Artikel terbaru tentang SEO, Google Ads, Digital Marketing dari Nuswa Lab untuk bisnis diaspora Indonesia.",
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  "SEO":              "from-emerald-500 to-teal-600",
  "Google Ads":       "from-blue-500 to-indigo-600",
  "Meta Ads":         "from-indigo-500 to-purple-600",
  "Digital Marketing":"from-violet-500 to-purple-600",
  "WhatsApp Marketing":"from-green-500 to-emerald-600",
  "AI & Automation":  "from-orange-500 to-red-500",
  "Diaspora":         "from-rose-500 to-pink-600",
};

const CATEGORY_ICONS: Record<string, string> = {
  "SEO":              "🔍",
  "Google Ads":       "📢",
  "Meta Ads":         "📱",
  "Digital Marketing":"📊",
  "WhatsApp Marketing":"💬",
  "AI & Automation":  "🤖",
  "Diaspora":         "🌏",
};

function getCategoryGradient(category: string): string {
  for (const [key, val] of Object.entries(CATEGORY_GRADIENTS)) {
    if (category?.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "from-slate-500 to-gray-600";
}

function getCategoryIcon(category: string): string {
  for (const [key, val] of Object.entries(CATEGORY_ICONS)) {
    if (category?.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "📝";
}

function readingTime(wordCount: number): number {
  return Math.max(1, Math.round((wordCount || 0) / 200));
}

export default async function BlogPage() {
  const articles = await getPublishedArticles();
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <a href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-4 inline-flex items-center gap-1">
            ← Nuswa Lab
          </a>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
              <p className="text-gray-500 mt-1 text-base">Tips SEO, Google Ads, dan Digital Marketing untuk bisnis diaspora Indonesia</p>
            </div>
            <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full self-start sm:self-auto">
              {articles.length} artikel
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {articles.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg">Belum ada artikel yang dipublish.</p>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group block mb-10 bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image / Gradient */}
                  <div className="md:w-2/5 h-56 md:h-auto flex-shrink-0 relative overflow-hidden">
                    {featured.featured_image ? (
                      <img
                        src={featured.featured_image}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(featured.category)} flex items-center justify-center`}>
                        <span className="text-6xl opacity-80">{getCategoryIcon(featured.category)}</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        ⭐ Featured
                      </span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">{featured.category}</span>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug mb-3">
                      {featured.title}
                    </h2>
                    {featured.meta_description && (
                      <p className="text-gray-500 leading-relaxed mb-5 line-clamp-3">{featured.meta_description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>📖 {readingTime(featured.word_count)} menit baca</span>
                      <span>•</span>
                      <span>{new Date(featured.published_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Article grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(article => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="h-48 flex-shrink-0 relative overflow-hidden">
                    {article.featured_image ? (
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(article.category)} flex items-center justify-center`}>
                        <span className="text-5xl opacity-75">{getCategoryIcon(article.category)}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">{article.category}</span>
                    <h2 className="text-gray-900 font-bold text-base leading-snug mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors flex-1">
                      {article.title}
                    </h2>
                    {article.meta_description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">{article.meta_description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-gray-100">
                      <span>📖 {readingTime(article.word_count)} menit baca</span>
                      <span>{new Date(article.published_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
