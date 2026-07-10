import { notFound } from "next/navigation";

const DB_PATH = "/home/ubuntu/articel generator/data.db";

interface Article {
  id: number;
  title: string;
  slug: string;
  keyword: string;
  meta_description: string;
  content_html: string;
  word_count: number;
  category: string;
  featured_image: string;
  seo_score: number;
  aeo_score: number;
  geo_score: number;
  published_date: string;
  status: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: true });
    const article = db.prepare(`
      SELECT id, title, slug, keyword, meta_description, content_html,
             word_count, category, featured_image,
             seo_score, aeo_score, geo_score, published_date, status
      FROM articles WHERE slug = ? AND status = 'published'
    `).get(slug) as Article | undefined;
    db.close();
    return article ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Artikel tidak ditemukan" };
  return {
    title: article.title,
    description: article.meta_description,
    openGraph: {
      title: article.title,
      description: article.meta_description,
      images: article.featured_image ? [article.featured_image] : [],
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const publishedDate = new Date(article.published_date).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">← Nuswa Lab</a>
          <span className="text-gray-300">/</span>
          <a href="/blog" className="text-sm text-gray-500 hover:text-gray-700">Blog</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-400 truncate max-w-xs">{article.category}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Category badge */}
        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6 pb-6 border-b border-gray-100">
          <span>📅 {publishedDate}</span>
          <span>📖 {article.word_count?.toLocaleString()} kata</span>
          <span>🏷️ {article.keyword}</span>
        </div>

        {/* Featured image */}
        {article.featured_image && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        {/* Article content */}
        <div
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-7 prose-h3:mb-3
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
            prose-ul:text-gray-700 prose-ul:pl-6 prose-li:mb-1
            prose-ol:text-gray-700 prose-ol:pl-6
            prose-strong:text-gray-900
            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:text-gray-700
            prose-table:text-sm prose-th:bg-gray-50 prose-th:text-gray-700
            prose-code:bg-gray-100 prose-code:text-indigo-700 prose-code:px-1 prose-code:rounded"
          dangerouslySetInnerHTML={{ __html: article.content_html }}
        />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex flex-wrap gap-4 text-xs text-gray-400 justify-between items-center">
            <div className="flex gap-3">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded font-medium">SEO {article.seo_score}</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded font-medium">AEO {article.aeo_score}</span>
              <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded font-medium">AIO {article.geo_score}</span>
            </div>
            <a href="/blog" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">← Semua Artikel</a>
          </div>
        </div>
      </div>
    </div>
  );
}
