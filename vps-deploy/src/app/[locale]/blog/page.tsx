import Link from "next/link";

const DB_PATH = "/home/ubuntu/articel generator/data.db";

interface Article {
  id: number;
  title: string;
  slug: string;
  keyword: string;
  meta_description: string;
  category: string;
  featured_image: string;
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

export default async function BlogPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <a href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-4 inline-block">← Nuswa Lab</a>
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-500 mt-1">Tips SEO, Google Ads, dan Digital Marketing untuk bisnis diaspora Indonesia</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {articles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p>Belum ada artikel yang dipublish.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <Link key={article.id} href={`/blog/${article.slug}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {article.featured_image && (
                  <div className="h-44 overflow-hidden">
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">{article.category}</span>
                  <h2 className="text-gray-900 font-semibold mt-1 mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors leading-snug">
                    {article.title}
                  </h2>
                  {article.meta_description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.meta_description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>📖 {Math.max(1, Math.round((article.word_count || 0) / 200))} menit baca</span>
                    <span>{new Date(article.published_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
