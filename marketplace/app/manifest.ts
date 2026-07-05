import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NuswaMart — Marketplace UMKM",
    short_name: "NuswaMart",
    description: "Belanja produk digital & fisik dari UMKM Indonesia. Bayar mudah via QRIS, VA, & COD.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0d9488",
    orientation: "portrait",
    categories: ["shopping", "business"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
