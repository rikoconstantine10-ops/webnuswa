import { notFound } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { CopyLinkButton } from "./CopyLinkButton";

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
  title_en: string | null;
  meta_description_en: string | null;
  content_html_en: string | null;
}

function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  return new Database(DB_PATH, { readonly: true });
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const db = getDb();
    const article = db.prepare(`
      SELECT id, title, slug, keyword, meta_description, content_html,
             word_count, category, featured_image,
             seo_score, aeo_score, geo_score, published_date, status,
             title_en, meta_description_en, content_html_en
      FROM articles WHERE slug = ? AND status = 'published'
    `).get(slug) as Article | undefined;
    db.close();
    return article ?? null;
  } catch {
    return null;
  }
}

function getEnContent(article: Article, isEn: boolean): { title: string; meta_description: string; content_html: string } {
  if (isEn && article.title_en && article.content_html_en) {
    return {
      title:            article.title_en,
      meta_description: article.meta_description_en ?? article.meta_description,
      content_html:     article.content_html_en,
    };
  }
  return {
    title:            article.title,
    meta_description: article.meta_description,
    content_html:     article.content_html,
  };
}

async function getRelatedArticles(category: string, currentSlug: string): Promise<Article[]> {
  try {
    const db = getDb();
    const articles = db.prepare(`
      SELECT id, title, slug, keyword, meta_description, category,
             featured_image, word_count, published_date,
             title_en, meta_description_en, content_html_en
      FROM articles
      WHERE status = 'published' AND category = ? AND slug != ?
      ORDER BY published_date DESC
      LIMIT 3
    `).all(category, currentSlug) as Article[];
    db.close();
    return articles;
  } catch {
    return [];
  }
}

function readingTime(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}

const FALLBACK_IMAGES = [
  "/images/blog/blog-1.png",
  "/images/blog/blog-2.png",
  "/images/blog/blog-3.png",
  "/images/blog/blog-4.png",
  "/images/blog/blog-5.png",
];

function getFeaturedImage(article: Article): string {
  if (article.featured_image) return article.featured_image;
  return FALLBACK_IMAGES[article.id % FALLBACK_IMAGES.length];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: locale === "en" ? "Article not found" : "Artikel tidak ditemukan" };

  const isEn = locale === "en";
  const title = (isEn && article.title_en) ? article.title_en : article.title;
  const description = (isEn && article.meta_description_en) ? article.meta_description_en : article.meta_description;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: article.featured_image ? [`https://nuswalab.com${article.featured_image}`] : [],
    datePublished: article.published_date,
    dateModified: article.published_date,
    author: { "@type": "Organization", name: "Nuswa Lab", url: "https://nuswalab.com" },
    publisher: {
      "@type": "Organization",
      name: "Nuswa Lab",
      url: "https://nuswalab.com",
      logo: { "@type": "ImageObject", url: "https://nuswalab.com/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://nuswalab.com/${locale}/blog/${article.slug}` },
    keywords: article.keyword,
    wordCount: article.word_count,
    inLanguage: isEn ? "en-US" : "id-ID",
    articleSection: article.category,
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.published_date,
      images: article.featured_image ? [{ url: `https://nuswalab.com${article.featured_image}` }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.featured_image ? [`https://nuswalab.com${article.featured_image}`] : [],
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const isEn = locale === "en";

  const article = await getArticle(slug);
  if (!article) notFound();

  const [enContent, related] = await Promise.all([
    Promise.resolve(getEnContent(article, isEn)),
    getRelatedArticles(article.category, slug),
  ]);

  const dateLocale = isEn ? "en-US" : "id-ID";
  const publishedDate = new Date(article.published_date).toLocaleDateString(dateLocale, {
    day: "numeric", month: "long", year: "numeric",
  });

  const minutes = readingTime(article.word_count);
  const articleUrl = `https://nuswalab.com/${locale}/blog/${article.slug}`;
  const waText = encodeURIComponent(`${isEn ? "Read this article" : "Baca artikel ini"}: ${enContent.title} — ${articleUrl}`);
  const waShareUrl = `https://wa.me/?text=${waText}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: enContent.title,
    description: enContent.meta_description,
    image: article.featured_image ? [`https://nuswalab.com${article.featured_image}`] : [],
    datePublished: article.published_date,
    dateModified: article.published_date,
    author: { "@type": "Organization", name: "Nuswa Lab", url: "https://nuswalab.com" },
    publisher: {
      "@type": "Organization",
      name: "Nuswa Lab",
      url: "https://nuswalab.com",
      logo: { "@type": "ImageObject", url: "https://nuswalab.com/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    keywords: article.keyword,
    wordCount: article.word_count,
    inLanguage: isEn ? "en-US" : "id-ID",
    articleSection: article.category,
  };

  const t = {
    blog: "Blog",
    readingTime: isEn ? `${minutes} min read` : `${minutes} menit baca`,
    wordCount: isEn
      ? `${article.word_count?.toLocaleString()} words`
      : `${article.word_count?.toLocaleString()} kata`,
    share: isEn ? "Share this article:" : "Bagikan artikel ini:",
    related: isEn ? "Related Articles" : "Artikel Terkait",
    allArticles: isEn ? "← All Articles" : "← Semua Artikel",
    minRead: isEn ? "min read" : "menit baca",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Nav />

      <div className="min-h-screen bg-white pt-24">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <a href={`/${locale}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">← Nuswa Lab</a>
            <span className="text-gray-300">/</span>
            <a href={`/${locale}/blog`} className="text-sm text-gray-500 hover:text-gray-700">{t.blog}</a>
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
            {enContent.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6 pb-6 border-b border-gray-100">
            <span>📅 {publishedDate}</span>
            <span>📖 {t.readingTime}</span>
            <span>✍️ {t.wordCount}</span>
            <span>🏷️ {article.keyword}</span>
          </div>

          {/* Featured image */}
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img
              src={getFeaturedImage(article)}
              alt={enContent.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>

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
            dangerouslySetInnerHTML={{ __html: enContent.content_html }}
          />

          {/* Share buttons */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">{t.share}</p>
            <div className="flex flex-wrap gap-3">
              <a
                href={waShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(enContent.title)}&url=${encodeURIComponent(articleUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X (Twitter)
              </a>
              <CopyLinkButton url={articleUrl} />
            </div>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-5">{t.related}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {related.map(rel => {
                  const relTitle = (isEn && rel.title_en) ? rel.title_en : rel.title;
                  return (
                    <a
                      key={rel.id}
                      href={`/${locale}/blog/${rel.slug}`}
                      className="group block bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl overflow-hidden transition-all"
                    >
                      {rel.featured_image && (
                        <div className="h-32 overflow-hidden">
                          <img
                            src={rel.featured_image}
                            alt={relTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">{rel.category}</span>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 mt-1 line-clamp-2 leading-snug">
                          {relTitle}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">{readingTime(rel.word_count)} {t.minRead}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap gap-4 text-xs text-gray-400 justify-between items-center">
              <div className="flex gap-3">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded font-medium">SEO {article.seo_score}</span>
                <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded font-medium">AEO {article.aeo_score}</span>
                <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded font-medium">AIO {article.geo_score}</span>
              </div>
              <a href={`/${locale}/blog`} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">{t.allArticles}</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
