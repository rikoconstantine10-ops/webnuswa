import { MetadataRoute } from "next";

const DB_PATH = "/home/ubuntu/articel generator/data.db";
const BASE_URL = "https://nuswalab.com";
const LOCALES = ["id", "en"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = LOCALES.flatMap(locale => [
    {
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: locale === "id" ? 1.0 : 0.9,
    },
    {
      url: `${BASE_URL}/${locale}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/${locale}/portofolio`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/${locale}/portofolio/ai-development`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ]);

  let articleRoutes: MetadataRoute.Sitemap = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: true });
    const articles = db.prepare(`
      SELECT slug, published_date, title_en FROM articles
      WHERE status = 'published'
      ORDER BY published_date DESC
    `).all() as { slug: string; published_date: string; title_en: string | null }[];
    db.close();

    articleRoutes = articles.flatMap(a => {
      const lastMod = new Date(a.published_date);
      const base = {
        changeFrequency: "monthly" as const,
        priority: 0.8,
        lastModified: lastMod,
      };
      const routes = [
        { ...base, url: `${BASE_URL}/id/blog/${a.slug}` },
      ];
      // Only include EN URL if translation exists
      if (a.title_en) {
        routes.push({ ...base, url: `${BASE_URL}/en/blog/${a.slug}` });
      }
      return routes;
    });
  } catch {
    // DB not available at build time on dev — skip
  }

  return [...staticRoutes, ...articleRoutes];
}
