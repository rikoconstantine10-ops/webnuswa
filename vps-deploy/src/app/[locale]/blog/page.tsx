import Link from "next/link";
import { Nav } from "@/components/layout/Nav";

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
  title_en: string | null;
  meta_description_en: string | null;
}

async function getPublishedArticles(): Promise<Article[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: true });
    const articles = db.prepare(`
      SELECT id, title, slug, keyword, meta_description, category,
             featured_image, word_count, seo_score, published_date,
             title_en, meta_description_en
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: "Blog — Nuswa Lab",
    description: isEn
      ? "Latest articles on SEO, Google Ads, and Digital Marketing from Nuswa Lab for Indonesian diaspora businesses."
      : "Artikel terbaru tentang SEO, Google Ads, Digital Marketing dari Nuswa Lab untuk bisnis diaspora Indonesia.",
  };
}

const FALLBACK_IMAGES = [
  "/images/blog/blog-1.png",
  "/images/blog/blog-2.png",
  "/images/blog/blog-3.png",
  "/images/blog/blog-4.png",
  "/images/blog/blog-5.png",
];

function getImage(article: Article, index: number): string {
  if (article.featured_image) return article.featured_image;
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function readingTime(wordCount: number): number {
  return Math.max(1, Math.round((wordCount || 0) / 200));
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const articles = await getPublishedArticles();
  const featured = articles[0];
  const rest = articles.slice(1);

  const t = {
    back: "← Nuswa Lab",
    heading: "Blog",
    subtitle: isEn
      ? "SEO tips, Google Ads, and Digital Marketing for Indonesian diaspora businesses"
      : "Tips SEO, Google Ads, dan Digital Marketing untuk bisnis diaspora Indonesia",
    articles: isEn ? "articles" : "artikel",
    latest: isEn ? "⭐ Latest" : "⭐ Terbaru",
    minRead: isEn ? "min read" : "menit baca",
    empty: isEn ? "No articles published yet." : "Belum ada artikel yang dipublish.",
  };

  function getTitle(a: Article) {
    return (isEn && a.title_en) ? a.title_en : a.title;
  }
  function getMeta(a: Article) {
    return (isEn && a.meta_description_en) ? a.meta_description_en : a.meta_description;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <a href={`/${locale}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-4 inline-flex items-center gap-1">
            {t.back}
          </a>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{t.heading}</h1>
              <p className="text-gray-500 mt-1 text-base">{t.subtitle}</p>
            </div>
            <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full self-start sm:self-auto">
              {articles.length} {t.articles}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {articles.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg">{t.empty}</p>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featured && (
              <Link
                href={`/${locale}/blog/${featured.slug}`}
                className="group block mb-10 bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-2/5 h-56 md:h-auto flex-shrink-0 relative overflow-hidden">
                    <img
                      src={getImage(featured, 0)}
                      alt={getTitle(featured)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        {t.latest}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">{featured.category}</span>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug mb-3">
                      {getTitle(featured)}
                    </h2>
                    {getMeta(featured) && (
                      <p className="text-gray-500 leading-relaxed mb-5 line-clamp-3">{getMeta(featured)}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>📖 {readingTime(featured.word_count)} {t.minRead}</span>
                      <span>•</span>
                      <span>{new Date(featured.published_date).toLocaleDateString(isEn ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Article grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((article, i) => (
                <Link
                  key={article.id}
                  href={`/${locale}/blog/${article.slug}`}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                >
                  <div className="h-48 flex-shrink-0 overflow-hidden">
                    <img
                      src={getImage(article, i + 1)}
                      alt={getTitle(article)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">{article.category}</span>
                    <h2 className="text-gray-900 font-bold text-base leading-snug mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors flex-1">
                      {getTitle(article)}
                    </h2>
                    {getMeta(article) && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">{getMeta(article)}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-gray-100">
                      <span>📖 {readingTime(article.word_count)} {t.minRead}</span>
                      <span>{new Date(article.published_date).toLocaleDateString(isEn ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
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
