import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL || "https://nuswamart.com";
  const [products, stores] = await Promise.all([
    db.product.findMany({
      where: { active: true, moderation: "APPROVED", store: { status: "ACTIVE" } },
      select: { slug: true, createdAt: true },
      take: 5000,
    }),
    db.store.findMany({ where: { status: "ACTIVE" }, select: { slug: true } }),
  ]);

  const staticPages = ["", "/market", "/bantuan", "/terms", "/privacy"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  return [
    ...staticPages,
    ...products.map((p) => ({ url: `${base}/p/${p.slug}`, lastModified: p.createdAt, priority: 0.8 })),
    ...stores.map((s) => ({ url: `${base}/s/${s.slug}`, priority: 0.6 })),
  ];
}
