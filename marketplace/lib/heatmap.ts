// Halaman publik yang dilacak untuk heatmap: Home, katalog, produk, toko.
// Dipakai di client (HeatmapTracker) dan server (ingest route) supaya konsisten.
export function isTrackedPath(path: string): boolean {
  return path === "/" || path.startsWith("/market") || path.startsWith("/p/") || path.startsWith("/s/");
}
