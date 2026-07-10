import { MetadataRoute } from "next";

const DB_PATH = "/home/ubuntu/articel generator/data.db";
const BASE_URL = "https://nuswalab.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/portofolio`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/portofolio/ai-development`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  let articleRoutes: MetadataRoute.Sitemap = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: true });
    const articles = db.prepare(`
      SELECT slug, published_date FROM articles
      WHERE status = 'published'
      ORDER BY published_date DESC
    `).all() as { slug: string; published_date: string }[];
    db.close();

    articleRoutes = articles.map(a => ({
      url: `${BASE_URL}/blog/${a.slug}`,
      lastModified: new Date(a.published_date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB not available at build time on dev — skip
  }

  return [...staticRoutes, ...articleRoutes];
}
