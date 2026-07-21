import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL || "https://nuswamart.com";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api", "/cart", "/order"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
